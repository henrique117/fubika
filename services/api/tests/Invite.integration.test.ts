import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { randomBytes } from 'crypto'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn() },
        invites: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (_req: any, _res: any) => { }),
}))

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async (_req: any, _res: any) => { }),
}))

const buildServer = async () => {
    const app = Fastify()
    await app.register(fastifyJwt, { secret: 'test_secret' })

    const inviteRoutes = (await import('../src/modules/invite/invite.route')).default
    await app.register(inviteRoutes, { prefix: '/invite' })

    await app.ready()
    return app
}

const makeToken = (app: any) => app.jwt.sign({ id: 5, name: 'admin' })

const mockAdminUser = { id: 5, is_admin: true }
const mockNonAdminUser = { id: 10, is_admin: false }
const mockCode = randomBytes(7).toString('hex').toUpperCase()
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

const mockInvite = {
    id: 1,
    code: mockCode,
    expires_at: futureDate,
    used_by_id: null,
    created_by_id: 5,
}

describe('POST /invite/create', () => {
    let app: Awaited<ReturnType<typeof buildServer>>
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => {
        await app.close()
        vi.clearAllMocks()
    })

    it('retorna 201 com convite criado para admin por id numérico', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockAdminUser)
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)
        prismaMock.invites.create.mockResolvedValueOnce(mockInvite)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: 5 },
        })

        expect(res.statusCode).toBe(201)
        const body = res.json()
        expect(body).toHaveProperty('code')
        expect(body).toHaveProperty('expires_at')
    })

    it('retorna 201 com convite criado para admin por discord_id (string)', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockAdminUser)
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)
        prismaMock.invites.create.mockResolvedValueOnce(mockInvite)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: '123456789012345678' },
        })

        expect(res.statusCode).toBe(201)
    })

    it('retorna 403 quando usuário não é admin', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockNonAdminUser)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: 10 },
        })

        expect(res.statusCode).toBe(403)
        expect(res.json().message).toContain('administradores')
    })

    it('retorna 403 quando usuário não existe', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: 999 },
        })

        expect(res.statusCode).toBe(403)
    })

    it('retenta geração de código quando há colisão', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockAdminUser)
        prismaMock.invites.findUnique
            .mockResolvedValueOnce({ code: 'EXISTENTE' })
            .mockResolvedValueOnce(null)
        prismaMock.invites.create.mockResolvedValueOnce(mockInvite)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: 5 },
        })

        expect(res.statusCode).toBe(201)
        expect(prismaMock.invites.findUnique).toHaveBeenCalledTimes(2)
    })

    it('retorna 400 para body sem id', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: {},
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para id como objeto', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: { nested: true } },
        })

        expect(res.statusCode).toBe(400)
    })

    it('convite criado tem expiração em ~7 dias', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockAdminUser)
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)
        prismaMock.invites.create.mockResolvedValueOnce(mockInvite)

        const token = makeToken(app)
        const before = new Date()
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: `Bearer ${token}` },
            payload: { id: 5 },
        })

        expect(res.statusCode).toBe(201)
        const expiresAt = new Date(res.json().expires_at)
        const diffDays = (expiresAt.getTime() - before.getTime()) / (1000 * 60 * 60 * 24)
        expect(diffDays).toBeGreaterThan(6)
        expect(diffDays).toBeLessThanOrEqual(8)
    })
})

describe('checkInvite (service)', () => {
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
    })

    afterEach(() => vi.clearAllMocks())

    it('retorna true para convite válido', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce(mockInvite)
        const { checkInvite } = await import('../src/modules/invite/invite.service')
        expect(await checkInvite(mockCode)).toBe(true)
    })

    it('retorna false para convite inexistente', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)
        const { checkInvite } = await import('../src/modules/invite/invite.service')
        expect(await checkInvite('INVALIDO')).toBe(false)
    })

    it('retorna false para convite já utilizado', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce({ ...mockInvite, used_by_id: 99 })
        const { checkInvite } = await import('../src/modules/invite/invite.service')
        expect(await checkInvite(mockCode)).toBe(false)
    })

    it('retorna false para convite expirado', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce({
            ...mockInvite,
            expires_at: new Date(Date.now() - 1000),
        })
        const { checkInvite } = await import('../src/modules/invite/invite.service')
        expect(await checkInvite(mockCode)).toBe(false)
    })
})

describe('useInvite (service)', () => {
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
    })

    afterEach(() => vi.clearAllMocks())

    it('usa convite com sucesso e atualiza used_by_id', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce(mockInvite)
        prismaMock.invites.update.mockResolvedValueOnce({ ...mockInvite, used_by_id: 7 })

        const { useInvite } = await import('../src/modules/invite/invite.service')
        const result = await useInvite({ code: mockCode, id: 7 })

        expect(result.used_by_id).toBe(7)
        expect(prismaMock.invites.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { used_by_id: 7 } })
        )
    })

    it('lança 404 para código inexistente', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)
        const { useInvite } = await import('../src/modules/invite/invite.service')
        await expect(useInvite({ code: 'FAKE', id: 1 })).rejects.toMatchObject({ statusCode: 404 })
    })

    it('lança 409 para convite já utilizado', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce({ ...mockInvite, used_by_id: 5 })
        const { useInvite } = await import('../src/modules/invite/invite.service')
        await expect(useInvite({ code: mockCode, id: 1 })).rejects.toMatchObject({ statusCode: 409 })
    })

    it('lança 400 para convite expirado', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce({
            ...mockInvite,
            expires_at: new Date(Date.now() - 1000),
        })
        const { useInvite } = await import('../src/modules/invite/invite.service')
        await expect(useInvite({ code: mockCode, id: 1 })).rejects.toMatchObject({ statusCode: 400 })
    })
})