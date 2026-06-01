import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

const mockPublish = vi.fn()

vi.mock('ioredis', () => ({
    default: class Redis {
        publish = mockPublish
        on = vi.fn()
    }
}))

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findFirst: vi.fn(), update: vi.fn() },
        verification_codes: {
            findFirst: vi.fn(),
            deleteMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn()
        },
        $transaction: vi.fn()
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
    const routes = (await import('../src/modules/discord/discord.route')).default
    await app.register(routes, { prefix: '/discord' })
    await app.ready()
    return app
}

describe('POST /discord/createlink', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        mockPublish.mockReset()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('inicia vinculação com sucesso e envia código in-game', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findFirst).mockResolvedValueOnce({
            id: 5, safe_name: 'testuser', discord_id: null
        } as any)
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([undefined, { id: 1 }])
        mockPublish.mockResolvedValueOnce(1)

        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123456789', osu_name: 'TestUser' })
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toHaveProperty('success', true)
    })

    it('retorna 404 para osu_name inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findFirst).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', osu_name: 'ghost' })
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 409 quando conta já tem Discord vinculado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findFirst).mockResolvedValueOnce({
            id: 5, safe_name: 'testuser', discord_id: '999888777'
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', osu_name: 'testuser' })
        })
        expect(res.statusCode).toBe(409)
    })

    it('normaliza osu_name (case-insensitive, espaços para _)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findFirst).mockResolvedValueOnce({
            id: 5, safe_name: 'test_user', discord_id: null
        } as any)
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([undefined, { id: 1 }])
        mockPublish.mockResolvedValueOnce(1)

        await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', osu_name: 'Test User' })
        })

        expect(prisma.users.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ safe_name: 'test_user' })
            })
        )
    })

    it('retorna 400 para body sem discord_id', async () => {
        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ osu_name: 'test' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem osu_name', async () => {
        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para discord_id vazio', async () => {
        const res = await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '', osu_name: 'test' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('usa $transaction para deletar código antigo e criar novo', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findFirst).mockResolvedValueOnce({
            id: 5, safe_name: 'testuser', discord_id: null
        } as any)
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([undefined, { id: 1 }])
        mockPublish.mockResolvedValueOnce(1)

        await app.inject({
            method: 'POST', url: '/discord/createlink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', osu_name: 'testuser' })
        })

        expect(prisma.$transaction).toHaveBeenCalledOnce()
    })
})

describe('POST /discord/checklink', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('finaliza vinculação com sucesso', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.verification_codes.findFirst).mockResolvedValueOnce({
            id: 1, osu_id: 5, discord_id: '123', code: 'ABC123'
        } as any)
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}])

        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', code: 'ABC123' })
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toHaveProperty('success', true)
    })

    it('usa $transaction para atualizar user e deletar código', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.verification_codes.findFirst).mockResolvedValueOnce({
            id: 1, osu_id: 5, discord_id: '123', code: 'XYZ'
        } as any)
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}])

        await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', code: 'XYZ' })
        })

        expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('retorna 400 para código inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.verification_codes.findFirst).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', code: 'WRONG' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 quando discord_id não bate com o código', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.verification_codes.findFirst).mockResolvedValueOnce({
            id: 1, osu_id: 5, discord_id: '999', code: 'ABC'
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '111', code: 'ABC' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem code', async () => {
        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem discord_id', async () => {
        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ code: 'ABC' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({
            method: 'POST', url: '/discord/checklink',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ discord_id: '123', code: 'ABC' })
        })
        expect(res.statusCode).toBe(401)
    })
})