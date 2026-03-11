import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { checkInvite, useInvite } from '../src/modules/invite/invite.service'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn() },
        invites: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }
    }
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    })
}))

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async () => {})
}))

const buildServer = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    await app.register(fastifyJwt, { secret: 'test_secret' })
    const routes = (await import('../src/modules/invite/invite.route')).default
    await app.register(routes, { prefix: '/invite' })
    await app.ready()
    return app
}

describe('POST /invite/create', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => {
        if (app) await app.close()
        vi.clearAllMocks()
    })

    it('retorna 201 com convite criado para admin por id numérico', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({
            id: 5, is_admin: true
        } as any)
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)
        vi.mocked(prisma.invites.create).mockResolvedValueOnce({
            id: 1, code: 'ABC1234', expires_at: new Date(), created_by_id: 5, used_by_id: null
        } as any)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: 5 })
        })

        expect(res.statusCode).toBe(201)
        expect(JSON.parse(res.body)).toHaveProperty('code')
    })

    it('retorna 201 com convite criado para admin por discord_id (string)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({
            id: 5, is_admin: true
        } as any)
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)
        vi.mocked(prisma.invites.create).mockResolvedValueOnce({
            id: 1, code: 'XYZ9876', expires_at: new Date(), created_by_id: 5, used_by_id: null
        } as any)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: '123456789012345678' })
        })

        expect(res.statusCode).toBe(201)
    })

    it('retorna 403 quando usuário não é admin', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({
            id: 5, is_admin: false
        } as any)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: 5 })
        })

        expect(res.statusCode).toBe(403)
    })

    it('retorna 403 quando usuário não existe', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: 999 })
        })

        expect(res.statusCode).toBe(403)
    })

    it('retenta geração de código quando há colisão', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ id: 5, is_admin: true } as any)
        vi.mocked(prisma.invites.findUnique)
            .mockResolvedValueOnce({ id: 99 } as any)
            .mockResolvedValueOnce(null)
        vi.mocked(prisma.invites.create).mockResolvedValueOnce({
            id: 1, code: 'NEWCODE', expires_at: new Date(), created_by_id: 5, used_by_id: null
        } as any)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: 5 })
        })

        expect(res.statusCode).toBe(201)
        expect(prisma.invites.findUnique).toHaveBeenCalledTimes(2)
    })

    it('retorna 400 para body sem id', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({})
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para id como objeto', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: { nested: true } })
        })
        expect(res.statusCode).toBe(400)
    })

    it('convite criado tem expiração em ~7 dias', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)

        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ id: 5, is_admin: true } as any)
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)
        vi.mocked(prisma.invites.create).mockResolvedValueOnce({
            id: 1, code: 'EXPIRES', expires_at: futureDate, created_by_id: 5, used_by_id: null
        } as any)

        const res = await app.inject({
            method: 'POST',
            url: '/invite/create',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id: 5 })
        })

        expect(res.statusCode).toBe(201)
        const body = JSON.parse(res.body)
        const expiresAt = new Date(body.expires_at)
        const diff = expiresAt.getTime() - Date.now()
        expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000)
    })
})

describe('checkInvite (service unit)', () => {
    beforeEach(() => vi.clearAllMocks())

    it('retorna true para convite válido', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'VALID', used_by_id: null, expires_at: new Date(Date.now() + 100000)
        } as any)
        expect(await checkInvite('VALID')).toBe(true)
    })

    it('retorna false para convite inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)
        expect(await checkInvite('NOPE')).toBe(false)
    })

    it('retorna false para convite já utilizado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'USED', used_by_id: 3, expires_at: new Date(Date.now() + 100000)
        } as any)
        expect(await checkInvite('USED')).toBe(false)
    })

    it('retorna false para convite expirado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'EXP', used_by_id: null, expires_at: new Date(Date.now() - 1000)
        } as any)
        expect(await checkInvite('EXP')).toBe(false)
    })

    it('usa convite com sucesso e atualiza used_by_id', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'OK', used_by_id: null, expires_at: new Date(Date.now() + 100000)
        } as any)
        vi.mocked(prisma.invites.update).mockResolvedValueOnce({
            id: 1, code: 'OK', used_by_id: 5
        } as any)

        const result = await useInvite({ code: 'OK', id: 5 })
        expect(result).toHaveProperty('used_by_id', 5)
    })

    it('lança 404 para código inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)
        await expect(useInvite({ code: 'NOPE', id: 1 })).rejects.toMatchObject({ statusCode: 404 })
    })

    it('lança 409 para convite já utilizado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'USED', used_by_id: 3, expires_at: new Date(Date.now() + 100000)
        } as any)
        await expect(useInvite({ code: 'USED', id: 5 })).rejects.toMatchObject({ statusCode: 409 })
    })

    it('lança 400 para convite expirado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'EXP', used_by_id: null, expires_at: new Date(Date.now() - 1000)
        } as any)
        await expect(useInvite({ code: 'EXP', id: 5 })).rejects.toMatchObject({ statusCode: 400 })
    })
})