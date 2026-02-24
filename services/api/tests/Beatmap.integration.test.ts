import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

vi.mock('../src/utils/prisma', () => ({
    default: {
        maps: { findFirst: vi.fn() },
        scores: { count: vi.fn() },
        $queryRaw: vi.fn(),
    },
}))

vi.mock('../src/utils/axios', () => ({
    default: { get: vi.fn() },
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    }),
}))

const buildServer = async () => {
    const app = Fastify()
    await app.register(fastifyJwt, { secret: 'test_secret' })

    const beatmapRoutes = (await import('../src/modules/beatmap/beatmap.route')).default
    await app.register(beatmapRoutes, { prefix: '/beatmap' })

    await app.ready()
    return app
}

const makeToken = (app: any) => app.jwt.sign({ id: 5, name: 'testuser' })

const mockOsuBeatmap = {
    id: 123,
    beatmapset_id: 456,
    checksum: 'abc123md5',
    mode: 'osu',
    mode_int: 0,
    status: 'ranked',
    total_length: 180,
    user_id: 1,
    version: 'Hard',
    difficulty_rating: 4.5,
    bpm: 180,
    accuracy: 8.5,
    ar: 9,
    cs: 4,
    drain: 6,
    max_combo: 1200,
    count_circles: 300,
    count_sliders: 200,
    passcount: 5000,
    playcount: 20000,
    beatmapset: {
        artist: 'Test Artist',
        title: 'Test Song',
        creator: 'Mapper',
        covers: {
            cover: 'https://assets.ppy.sh/beatmaps/456/covers/cover.jpg',
            'list@2x': 'https://assets.ppy.sh/beatmaps/456/covers/list@2x.jpg',
        },
    },
}

const mockOsuBeatmapset = {
    id: 456,
    play_count: 50000,
    artist: 'Test Artist',
    favourite_count: 1000,
    user_id: 1,
    title: 'Test Song',
    covers: {
        cover: 'https://assets.ppy.sh/beatmaps/456/covers/cover.jpg',
        'list@2x': 'https://assets.ppy.sh/beatmaps/456/covers/list@2x.jpg',
    },
    beatmaps: [mockOsuBeatmap],
}

const mockLeaderboardRow = {
    score_id: 1,
    userid: 5,
    score_val: 1000000,
    score_pp: 300,
    score_acc: 99.5,
    max_combo: 1200,
    mods: 8,
    n300: 900,
    n100: 20,
    n50: 2,
    nmiss: 0,
    grade: 'S',
    perfect: 1,
    play_time: 1700000000,
    map_md5: 'abc123md5',
    mode: 0,
    name: 'TestUser',
    safe_name: 'testuser',
    user_pp: 500,
    user_acc: 98,
    user_tscore: BigInt(999999),
    user_rscore: BigInt(888888),
    user_max_combo: 2000,
    playtime: 300000,
    x_count: 10, xh_count: 5, s_count: 20, sh_count: 3, a_count: 15,
}

describe('GET /beatmap/:id', () => {
    let app: any
    let prismaMock: any
    let osuApiMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        osuApiMock = (await import('../src/utils/axios')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna 200 com beatmap e leaderboard', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmap })
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([mockLeaderboardRow])
        prismaMock.scores.count
            .mockResolvedValueOnce(20000)
            .mockResolvedValueOnce(5000)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.beatmap_id).toBe(123)
        expect(body.title).toBe('Test Song')
        expect(body.scores).toHaveLength(1)
        expect(body.scores[0].player.name).toBe('TestUser')
    })

    it('retorna leaderboard vazia quando não há scores', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmap })
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([])
        prismaMock.scores.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().scores).toEqual([])
    })

    it('busca md5 na API osu! quando mapa não está no banco local', async () => {
        osuApiMock.get
            .mockResolvedValueOnce({ data: mockOsuBeatmap })
        prismaMock.maps.findFirst.mockResolvedValueOnce(null)
        prismaMock.$queryRaw.mockResolvedValueOnce([])
        prismaMock.scores.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
    })

    it('retorna playcount e passcount do banco local', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmap })
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([])
        prismaMock.scores.count
            .mockResolvedValueOnce(9999)
            .mockResolvedValueOnce(1234)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.json().playcount).toBe(9999)
        expect(res.json().passcount).toBe(1234)
    })

    it('retorna 404 quando a API osu! não retorna dados', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: null })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
    })

    it('retorna 400 para id não numérico', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/abc',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({ method: 'GET', url: '/beatmap/123' })
        expect(res.statusCode).toBe(401)
    })

    it('inclui campos corretos no response', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmap })
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([])
        prismaMock.scores.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/123',
            headers: { authorization: `Bearer ${token}` },
        })

        const body = res.json()
        expect(body).toHaveProperty('beatmap_id')
        expect(body).toHaveProperty('beatmap_md5')
        expect(body).toHaveProperty('star_rating')
        expect(body).toHaveProperty('bpm')
        expect(body).toHaveProperty('scores')
        expect(body).toHaveProperty('cover')
    })
})

describe('GET /beatmap/c/:id', () => {
    let app: any
    let osuApiMock: any

    beforeEach(async () => {
        vi.resetModules()
        osuApiMock = (await import('../src/utils/axios')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna 200 com beatmapset e seus beatmaps', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmapset })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/c/456',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.beatmapset_id).toBe(456)
        expect(body.title).toBe('Test Song')
        expect(body.artist).toBe('Test Artist')
        expect(Array.isArray(body.beatmaps)).toBe(true)
        expect(body.beatmaps).toHaveLength(1)
    })

    it('retorna beatmapset com beatmaps mapeados corretamente', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: mockOsuBeatmapset })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/c/456',
            headers: { authorization: `Bearer ${token}` },
        })

        const beatmap = res.json().beatmaps[0]
        expect(beatmap.beatmap_id).toBe(123)
        expect(beatmap.diff).toBe('Hard')
        expect(beatmap.star_rating).toBe(4.5)
    })

    it('retorna 404 quando API não retorna dados', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: null })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/c/456',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
    })

    it('retorna 400 para id não numérico', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/c/xyz',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({ method: 'GET', url: '/beatmap/c/456' })
        expect(res.statusCode).toBe(401)
    })

    it('lida com beatmapset sem beatmaps (array vazio)', async () => {
        osuApiMock.get.mockResolvedValueOnce({ data: { ...mockOsuBeatmapset, beatmaps: [] } })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/beatmap/c/456',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().beatmaps).toEqual([])
    })
})