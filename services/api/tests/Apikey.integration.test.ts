import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { checkApiKey } from '../src/modules/apikey/apikey.service'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn() },
        api_keys: { create: vi.fn(), findUnique: vi.fn() }
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
    const routes = (await import('../src/modules/apikey/apikey.route')).default
    await app.register(routes, { prefix: '/apikey' })
    await app.ready()
    return app
}

describe('POST /apikey/', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna 201 com apikey criada por dev para target válido', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ id: 5, discord_id: '111', is_dev: true } as any)
            .mockResolvedValueOnce({ id: 10, discord_id: '222', is_dev: false } as any)
        vi.mocked(prisma.api_keys.create).mockResolvedValueOnce({
            id: 1, name: 'TestKey', key: 'fubika_live_abc123def456abc123def456abc123de', owner_id: 10, can_write: false
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'TestKey' })
        })

        expect(res.statusCode).toBe(201)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('key')
    })

    it('apikey gerada tem prefixo fubika_live_ e 32 chars hex', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ id: 5, discord_id: '111', is_dev: true } as any)
            .mockResolvedValueOnce({ id: 10, discord_id: '222', is_dev: false } as any)

        const fakeKey = 'fubika_live_' + 'a'.repeat(32)
        vi.mocked(prisma.api_keys.create).mockResolvedValueOnce({
            id: 1, name: 'TestKey', key: fakeKey, owner_id: 10, can_write: false
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'TestKey' })
        })

        const body = JSON.parse(res.body)
        expect(body.key).toMatch(/^fubika_live_[a-f0-9]{32}$/)
    })

    it('retorna 403 quando requester não é dev', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({
            id: 5, discord_id: '111', is_dev: false
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(403)
    })

    it('retorna 403 quando requester não existe', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 999, id_target: 10, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(403)
    })

    it('retorna 404 quando target não existe', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ id: 5, discord_id: '111', is_dev: true } as any)
            .mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 999, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 400 para nome com menos de 3 caracteres', async () => {
        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'AB' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 quando id_req está ausente', async () => {
        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_target: 10, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 quando id_target está ausente', async () => {
        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para id_req não inteiro (float)', async () => {
        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5.5, id_target: 10, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'TestKey' })
        })
        expect(res.statusCode).toBe(401)
    })

    it('busca requester pelo discord_id como string', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ id: 5, discord_id: '123456789', is_dev: true } as any)
            .mockResolvedValueOnce({ id: 10, discord_id: '987654321', is_dev: false } as any)
        vi.mocked(prisma.api_keys.create).mockResolvedValueOnce({
            id: 1, name: 'Key', key: 'fubika_live_' + 'b'.repeat(32), owner_id: 10, can_write: false
        } as any)

        await app.inject({
            method: 'POST', url: '/apikey/',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ id_req: 5, id_target: 10, name: 'MyKey' })
        })

        expect(prisma.users.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ discord_id: '5' }) })
        )
    })
})

describe('checkApiKey (service unit)', () => {
    beforeEach(() => vi.clearAllMocks())

    it('retorna apikey com user quando chave existe', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.api_keys.findUnique).mockResolvedValueOnce({
            id: 1, key: 'fubika_live_abc', name: 'Test', owner_id: 5, can_write: false,
            user: { id: 5, name: 'TestUser' }
        } as any)

        const result = await checkApiKey('fubika_live_abc')
        expect(result).toHaveProperty('key', 'fubika_live_abc')
        expect(result).toHaveProperty('user')
    })

    it('retorna null quando chave não existe', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.api_keys.findUnique).mockResolvedValueOnce(null)

        const result = await checkApiKey('invalid_key')
        expect(result).toBeNull()
    })
})