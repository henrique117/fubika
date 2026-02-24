import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

vi.mock('../src/utils/prisma', () => ({
    default: {
        stats: {
            findMany: vi.fn(),
        },
        scores: {
            count: vi.fn(),
        },
    },
}))

vi.mock('../src/utils/errorHandler', async () => {
    const actual = await vi.importActual('../src/utils/errorHandler')
    return actual
})

vi.mock('../src/utils/level', () => ({
    calculateLevel: vi.fn(() => 42.5),
}))

const buildServer = async () => {
    const app = Fastify()

    await app.register(fastifyJwt, { secret: 'test_secret' })

    app.addHook('preHandler', async (req) => {
        try { await req.jwtVerify() } catch { }
    })

    const { authenticate } = await import('../src/middlewares/auth.middleware')

    const rankingRoutes = (await import('../src/modules/ranking/ranking.route')).default
    await app.register(rankingRoutes, { prefix: '/ranking' })

    await app.ready()
    return app
}

const makeToken = (app: Awaited<ReturnType<typeof buildServer>>) =>
    app.jwt.sign({ id: 5, name: 'testuser' })

// --- Dados de mock ---
const mockLeaderboardRow = {
    pp: 500.5,
    acc: 98.5,
    playtime: 360000,
    max_combo: 1200,
    tscore: BigInt(9999999),
    rscore: BigInt(8888888),
    x_count: 10,
    xh_count: 5,
    s_count: 20,
    sh_count: 3,
    a_count: 15,
    user: {
        id: 5,
        name: 'TestPlayer',
        safe_name: 'testplayer',
    },
}

describe('GET /ranking/global', () => {
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

    it('retorna 200 com leaderboard válida', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([mockLeaderboardRow])
        prismaMock.scores.count.mockResolvedValueOnce(50)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body[0].name).toBe('TestPlayer')
        expect(body[0].rank).toBe(1)
        expect(body[0].pp).toBe(500.5)
    })

    it('retorna array vazio quando não há jogadores', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual([])
    })

    it('calcula rank correto para página 2', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([mockLeaderboardRow])
        prismaMock.scores.count.mockResolvedValueOnce(10)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?page=2',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()[0].rank).toBe(51)
    })

    it('retorna 400 para page=0', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?page=0',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para mode inválido (>8)', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?mode=9',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(400)
    })

    it('usa page=1 e mode=0 como defaults', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(prismaMock.stats.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ mode: 0 }),
                skip: 0,
                take: 50,
            })
        )
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
        })

        expect(res.statusCode).toBe(401)
    })

    it('inclui campos corretos no response', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([mockLeaderboardRow])
        prismaMock.scores.count.mockResolvedValueOnce(30)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global',
            headers: { authorization: `Bearer ${token}` },
        })

        const player = res.json()[0]
        expect(player).toHaveProperty('id')
        expect(player).toHaveProperty('name')
        expect(player).toHaveProperty('rank')
        expect(player).toHaveProperty('pp')
        expect(player).toHaveProperty('acc')
        expect(player).toHaveProperty('level')
        expect(player).toHaveProperty('playcount')
        expect(player).toHaveProperty('ss_count')
    })

    it('aceita mode=4 (relax)', async () => {
        prismaMock.stats.findMany.mockResolvedValueOnce([mockLeaderboardRow])
        prismaMock.scores.count.mockResolvedValueOnce(5)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/ranking/global?mode=4',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(prismaMock.stats.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ mode: 4 }),
            })
        )
    })
})