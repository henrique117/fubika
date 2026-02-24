import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn() },
        api_keys: { create: vi.fn(), findUnique: vi.fn() },
    },
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    }),
}))

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async (_req: any, _res: any) => { }),
}))

const buildServer = async () => {
    const app = Fastify()
    await app.register(fastifyJwt, { secret: 'test_secret' })

    const apikeyRoutes = (await import('../src/modules/apikey/apikey.route')).default
    await app.register(apikeyRoutes, { prefix: '/apikey' })

    await app.ready()
    return app
}

const makeToken = (app: any) => app.jwt.sign({ id: 5, name: 'testuser' })

const mockDevUser = { id: 5, discord_id: '111222333444555666', is_dev: true }
const mockNonDevUser = { id: 10, discord_id: '999888777666555444', is_dev: false }
const mockTargetUser = { id: 7, discord_id: '777666555444333222', is_dev: false }

const mockApiKey = {
    id: 1,
    name: 'Bot Key',
    owner_id: 7,
    key: 'fubika_live_' + 'a'.repeat(32),
    can_write: false,
}

describe('POST /apikey/', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna 201 com apikey criada por dev para target válido', async () => {
        prismaMock.users.findUnique
            .mockResolvedValueOnce(mockDevUser)
            .mockResolvedValueOnce(mockTargetUser)
        prismaMock.api_keys.create.mockResolvedValueOnce(mockApiKey)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                id_req: 111222333444555666,
                id_target: 777666555444333222,
                name: 'Bot Key',
            },
        })

        expect(res.statusCode).toBe(201)
        const body = res.json()
        expect(body).toHaveProperty('key')
        expect(body.key).toMatch(/^fubika_live_/)
        expect(body.can_write).toBe(false)
    })

    it('apikey gerada tem prefixo fubika_live_ e 32 chars hex', async () => {
        prismaMock.users.findUnique
            .mockResolvedValueOnce(mockDevUser)
            .mockResolvedValueOnce(mockTargetUser)

        prismaMock.api_keys.create.mockImplementationOnce(({ data }: any) => ({
            id: 1,
            ...data,
            owner_id: mockTargetUser.id,
            can_write: false,
        }))

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 111222333444555666, id_target: 777666555444333222, name: 'MyKey' },
        })

        expect(res.statusCode).toBe(201)
        const key = res.json().key as string
        expect(key).toMatch(/^fubika_live_[a-f0-9]{32}$/)
    })

    it('retorna 403 quando requester não é dev', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockNonDevUser)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 999888777666555444, id_target: 777666555444333222, name: 'Key' },
        })

        expect(res.statusCode).toBe(403)
        expect(res.json().message).toContain('permissão')
    })

    it('retorna 403 quando requester não existe', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 0, id_target: 777666555444333222, name: 'Key' },
        })

        expect(res.statusCode).toBe(403)
    })

    it('retorna 404 quando target não existe', async () => {
        prismaMock.users.findUnique
            .mockResolvedValueOnce(mockDevUser)
            .mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 111222333444555666, id_target: 0, name: 'Key' },
        })

        expect(res.statusCode).toBe(404)
        expect(res.json().message).toContain('destino não encontrado')
    })

    it('retorna 400 para nome com menos de 3 caracteres', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 111, id_target: 222, name: 'ab' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 quando id_req está ausente', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_target: 777666555444333222, name: 'Key' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 quando id_target está ausente', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 111222333444555666, name: 'Key' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para id_req não inteiro (float)', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 1.5, id_target: 2, name: 'Key' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/apikey/',
            payload: { id_req: 111, id_target: 222, name: 'Key' },
        })

        expect(res.statusCode).toBe(401)
    })

    it('busca requester pelo discord_id como string', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockDevUser)
        prismaMock.users.findUnique.mockResolvedValueOnce(mockTargetUser)
        prismaMock.api_keys.create.mockResolvedValueOnce(mockApiKey)

        const token = makeToken(app)
        await app.inject({
            method: 'POST',
            url: '/apikey/',
            headers: { authorization: `Bearer ${token}` },
            payload: { id_req: 111222333444555666, id_target: 777666555444333222, name: 'Key' },
        })

        expect(prismaMock.users.findUnique).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                where: { discord_id: '111222333444555666' },
            })
        )
    })
})

describe('checkApiKey (service)', () => {
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
    })

    afterEach(() => vi.clearAllMocks())

    it('retorna apikey com user quando chave existe', async () => {
        const mockKeyWithUser = { ...mockApiKey, user: mockTargetUser }
        prismaMock.api_keys.findUnique.mockResolvedValueOnce(mockKeyWithUser)

        const { checkApiKey } = await import('../src/modules/apikey/apikey.service')
        const result = await checkApiKey(mockApiKey.key)

        expect(result).not.toBeNull()
        expect(result?.user).toEqual(mockTargetUser)
        expect(prismaMock.api_keys.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { key: mockApiKey.key },
                include: { user: true },
            })
        )
    })

    it('retorna null quando chave não existe', async () => {
        prismaMock.api_keys.findUnique.mockResolvedValueOnce(null)

        const { checkApiKey } = await import('../src/modules/apikey/apikey.service')
        const result = await checkApiKey('chave_inexistente')

        expect(result).toBeNull()
    })
})