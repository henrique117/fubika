import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

vi.mock('../src/utils/prisma', () => ({
    default: {
        stats: { findMany: vi.fn(), count: vi.fn() },
        users: { count: vi.fn() },
        scores: { count: vi.fn() }
    }
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    })
}))

vi.mock('../src/utils/level', () => ({
    calculateLevel: vi.fn(() => 50.5)
}))

const buildServer = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    await app.register(fastifyJwt, { secret: 'test_secret' })
    const routes = (await import('../src/modules/ranking/ranking.route')).default
    await app.register(routes, { prefix: '/ranking' })
    await app.ready()
    return app
}

describe('GET /ranking/global', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => {
        if (app) await app.close()
    })

    it('retorna 200 com leaderboard válida', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const { getPlayerPlaycount } = await import('../src/modules/user/user.service')

        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([
            {
                id: 3, mode: 0, pp: 500, acc: 95.5,
                tscore: BigInt(1000000), rscore: BigInt(800000),
                max_combo: 300, playtime: 3600,
                x_count: 5, xh_count: 2, s_count: 10, sh_count: 3, a_count: 20,
                plays: 100, total_hits: 5000, replay_views: 10,
                user: { id: 3, name: 'TestUser', safe_name: 'testuser', priv: 1 }
            } as any
        ])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(50)

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(Array.isArray(body)).toBe(true)
        expect(body[0].id).toBe(3)
    })

    it('retorna array vazio quando não há jogadores', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual([])
    })

    it('calcula rank correto para página 2', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([
            {
                id: 3, mode: 0, pp: 100, acc: 90,
                tscore: BigInt(0), rscore: BigInt(0),
                max_combo: 0, playtime: 0,
                x_count: 0, xh_count: 0, s_count: 0, sh_count: 0, a_count: 0,
                plays: 0, total_hits: 0, replay_views: 0,
                user: { id: 3, name: 'Player51', safe_name: 'player51', priv: 1 }
            } as any
        ])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(0)

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?page=2',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body[0].rank).toBe(51)
    })

    it('retorna 400 para page=0', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?page=0',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para mode inválido (>8)', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?mode=9',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('usa page=1 e mode=0 como defaults', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(prisma.stats.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ mode: 0 }) })
        )
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({ method: 'GET', url: '/ranking/global' })
        expect(res.statusCode).toBe(401)
    })

    it('inclui campos corretos no response', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([
            {
                id: 3, mode: 0, pp: 300, acc: 92,
                tscore: BigInt(500000), rscore: BigInt(400000),
                max_combo: 150, playtime: 1800,
                x_count: 1, xh_count: 0, s_count: 5, sh_count: 1, a_count: 8,
                plays: 50, total_hits: 2500, replay_views: 5,
                user: { id: 3, name: 'Checker', safe_name: 'checker', priv: 1 }
            } as any
        ])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(50)

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: 'Bearer fake_token' }
        })

        const body = JSON.parse(res.body)
        const fields = ['id', 'name', 'pp', 'acc', 'rank']
        fields.forEach(f => expect(body[0]).toHaveProperty(f))
    })

    it('aceita mode=4 (relax)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.stats.findMany).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?mode=4',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(prisma.stats.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ mode: 4 }) })
        )
    })
})