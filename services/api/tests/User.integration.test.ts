import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

vi.mock('../src/utils/prisma', () => ({
    default: {
        maps: { findFirst: vi.fn() },
        scores: { count: vi.fn() },
        $queryRaw: vi.fn()
    }
}))

vi.mock('../src/utils/axios', () => ({
    default: { get: vi.fn() }
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    })
}))

const buildServer = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    await app.register(fastifyJwt, { secret: 'test_secret' })
    const routes = (await import('../src/modules/beatmap/beatmap.route')).default
    await app.register(routes, { prefix: '/beatmap' })
    await app.ready()
    return app
}

const mockOsuBeatmapResponse = {
    id: 123,
    checksum: 'abc123md5',
    beatmapset_id: 456,
    beatmapset: {
        artist: 'Test Artist',
        title: 'Test Song',
        creator: 'Mapper',
        covers: { cover: 'https://assets.ppy.sh/cover.jpg', 'list@2x': 'https://thumb.jpg' }
    },
    mode: 'osu', mode_int: 0, status: 'ranked',
    total_length: 180, user_id: 1,
    version: 'Hard', difficulty_rating: 3.5, bpm: 180,
    accuracy: 8, ar: 9, cs: 4, drain: 7,
    max_combo: 500, count_circles: 100, count_sliders: 200,
    passcount: 1000, playcount: 5000
}

describe('GET /beatmap/:id', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna 200 com beatmap e leaderboard', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const osuApi = (await import('../src/utils/axios')).default

        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockOsuBeatmapResponse })
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(50).mockResolvedValueOnce(30)

        const res = await app.inject({
            method: 'GET', url: '/beatmap/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('beatmap_id', 123)
        expect(body).toHaveProperty('scores')
    })

    it('retorna leaderboard vazia quando não há scores', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const osuApi = (await import('../src/utils/axios')).default

        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockOsuBeatmapResponse })
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const res = await app.inject({
            method: 'GET', url: '/beatmap/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body).scores).toEqual([])
    })

    it('busca md5 na API osu! quando mapa não está no banco local', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const osuApi = (await import('../src/utils/axios')).default

        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockOsuBeatmapResponse })
        vi.mocked(prisma.maps.findFirst).mockResolvedValueOnce(null)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const res = await app.inject({
            method: 'GET', url: '/beatmap/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(osuApi.get).toHaveBeenCalledWith('/beatmaps/123')
    })

    it('retorna playcount e passcount do banco local', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const osuApi = (await import('../src/utils/axios')).default

        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockOsuBeatmapResponse })
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(42).mockResolvedValueOnce(20)

        const res = await app.inject({
            method: 'GET', url: '/beatmap/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body.playcount).toBe(42)
        expect(body.passcount).toBe(20)
    })

    it('retorna 404 quando a API osu! não retorna dados', async () => {
        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: null })

        const res = await app.inject({
            method: 'GET', url: '/beatmap/999',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 400 para id não numérico', async () => {
        const res = await app.inject({
            method: 'GET', url: '/beatmap/abc',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({ method: 'GET', url: '/beatmap/123' })
        expect(res.statusCode).toBe(401)
    })

    it('inclui campos corretos no response', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        const osuApi = (await import('../src/utils/axios')).default

        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockOsuBeatmapResponse })
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const res = await app.inject({
            method: 'GET', url: '/beatmap/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        const body = JSON.parse(res.body)
        const requiredFields = ['beatmap_id', 'title', 'artist', 'scores', 'star_rating']
        requiredFields.forEach(f => expect(body).toHaveProperty(f))
    })
})

describe('GET /beatmap/c/:id', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    const mockBeatmapsetResponse = {
        id: 456, play_count: 5000, favourite_count: 200,
        artist: 'Set Artist', title: 'Set Title', user_id: 1,
        covers: { cover: 'https://cover.jpg', 'list@2x': 'https://thumb.jpg' },
        beatmaps: [
            { ...mockOsuBeatmapResponse, id: 123, beatmapset_id: 456 },
            { ...mockOsuBeatmapResponse, id: 124, beatmapset_id: 456, version: 'Normal' }
        ]
    }

    it('retorna 200 com beatmapset e seus beatmaps', async () => {
        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockBeatmapsetResponse })

        const res = await app.inject({
            method: 'GET', url: '/beatmap/c/456',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('beatmapset_id', 456)
        expect(body.beatmaps).toHaveLength(2)
    })

    it('retorna beatmapset com beatmaps mapeados corretamente', async () => {
        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: mockBeatmapsetResponse })

        const res = await app.inject({
            method: 'GET', url: '/beatmap/c/456',
            headers: { authorization: 'Bearer fake_token' }
        })

        const body = JSON.parse(res.body)
        expect(body.beatmaps[0]).toHaveProperty('beatmap_id')
        expect(body.beatmaps[0]).toHaveProperty('diff')
    })

    it('retorna 404 quando API não retorna dados', async () => {
        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: null })

        const res = await app.inject({
            method: 'GET', url: '/beatmap/c/999',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 400 para id não numérico', async () => {
        const res = await app.inject({
            method: 'GET', url: '/beatmap/c/abc',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({ method: 'GET', url: '/beatmap/c/456' })
        expect(res.statusCode).toBe(401)
    })

    it('lida com beatmapset sem beatmaps (array vazio)', async () => {
        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({
            data: { ...mockBeatmapsetResponse, beatmaps: [] }
        })

        const res = await app.inject({
            method: 'GET', url: '/beatmap/c/456',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body).beatmaps).toEqual([])
    })
})