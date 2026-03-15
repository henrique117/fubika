import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), delete: vi.fn() },
        stats: { findUnique: vi.fn(), createMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
        invites: { findUnique: vi.fn(), update: vi.fn() },
        scores: { count: vi.fn(), deleteMany: vi.fn() },
        maps: { findFirst: vi.fn() },
        user_rank_history: { findMany: vi.fn() },
        $queryRaw: vi.fn()
    }
}))

vi.mock('../src/utils/hash', () => ({
    hashPassword: vi.fn(async () => '$2b$10$hashedpassword'),
    verifyPassword: vi.fn(async () => true)
}))

vi.mock('../src/utils/axios', () => ({
    default: { get: vi.fn() }
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'testuser' }
    })
}))

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async () => {})
}))

vi.mock('../src/utils/level', () => ({
    calculateLevel: vi.fn(() => 42.5)
}))

const buildServer = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    await app.register(fastifyJwt, { secret: 'test_secret' })
    const routes = (await import('../src/modules/user/user.route')).default
    await app.register(routes, { prefix: '/user' })
    await app.ready()
    return app
}

const mockStats = {
    pp: 250, acc: 94.5,
    tscore: BigInt(500000), rscore: BigInt(400000),
    max_combo: 200, playtime: 7200,
    x_count: 3, xh_count: 1, s_count: 8, sh_count: 2, a_count: 15
}

const mockUser = {
    id: 5, name: 'TestUser', safe_name: 'testuser',
    email: 'test@example.com', pw_bcrypt: '$2b$10$hashedpw',
    priv: 1, country: 'BR', latest_activity: Math.floor(Date.now() / 1000),
    discord_id: null, is_admin: false, is_dev: false
}

describe('POST /user/register', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('registra usuário com dados válidos e retorna 201', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'VALIDKEY', used_by_id: null, expires_at: new Date(Date.now() + 100000)
        } as any)
        vi.mocked(prisma.users.create).mockResolvedValueOnce({ ...mockUser, id: 10 } as any)
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce({
            id: 1, code: 'VALIDKEY', used_by_id: null, expires_at: new Date(Date.now() + 100000)
        } as any)
        vi.mocked(prisma.invites.update).mockResolvedValueOnce({} as any)
        vi.mocked(prisma.stats.createMany).mockResolvedValueOnce({ count: 8 })

        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'NewUser', email: 'new@test.com', password: 'pass123', key: 'VALIDKEY' })
        })

        expect(res.statusCode).toBe(201)
    })

    it('retorna 400 para convite inválido', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.invites.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'User', email: 'u@t.com', password: 'pass123', key: 'INVALID' })
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para nome muito curto (<3 chars)', async () => {
        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'AB', email: 'a@b.com', password: 'pass123', key: 'KEY' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para email inválido', async () => {
        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'ValidName', email: 'not-an-email', password: 'pass123', key: 'KEY' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para senha muito curta (<6 chars)', async () => {
        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'ValidName', email: 'v@t.com', password: '123', key: 'KEY' })
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para nome com caracteres inválidos', async () => {
        const res = await app.inject({
            method: 'POST', url: '/user/register',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Us@r!', email: 'u@t.com', password: 'pass123', key: 'KEY' })
        })
        expect(res.statusCode).toBe(400)
    })
})

describe('POST /user/login', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna token JWT em login válido', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ ...mockUser } as any)
            .mockResolvedValueOnce({ ...mockUser } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(true)
        vi.mocked(prisma.stats.findUnique).mockResolvedValueOnce({ ...mockStats } as any)
        vi.mocked(prisma.stats.count).mockResolvedValueOnce(3)
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(50)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'POST', url: '/user/login',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'TestUser', password: 'correctpass' })
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toHaveProperty('token')
    })

    it('retorna 401 para usuário inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/user/login',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'ghost', password: 'pass' })
        })
        expect(res.statusCode).toBe(401)
    })

    it('retorna 401 para senha errada', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(false)

        const res = await app.inject({
            method: 'POST', url: '/user/login',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'TestUser', password: 'wrongpass' })
        })
        expect(res.statusCode).toBe(401)
    })

    it('retorna 403 para conta restrita (priv=0)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser, priv: 0 } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(true)

        const res = await app.inject({
            method: 'POST', url: '/user/login',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'TestUser', password: 'pass' })
        })
        expect(res.statusCode).toBe(403)
    })
})

describe('GET /user/count', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna total e online sem autenticação', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.count)
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(5)

        const res = await app.inject({ method: 'GET', url: '/user/count' })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('total_users', 100)
        expect(body).toHaveProperty('online_users', 5)
    })
})

describe('GET /user/me', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna perfil do usuário autenticado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.stats.findUnique).mockResolvedValueOnce({ ...mockStats } as any)
        vi.mocked(prisma.stats.count).mockResolvedValueOnce(2)
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(30)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/me',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('id')
        expect(body).toHaveProperty('name')
    })
})

describe('GET /user/:id', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('busca por id numérico', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.stats.findUnique).mockResolvedValueOnce({ ...mockStats } as any)
        vi.mocked(prisma.stats.count).mockResolvedValueOnce(4)
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(50)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
    })

    it('busca por safe_name (string não numérica)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.stats.findUnique).mockResolvedValueOnce({ ...mockStats } as any)
        vi.mocked(prisma.stats.count).mockResolvedValueOnce(1)
        vi.mocked(prisma.scores.count).mockResolvedValueOnce(10)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/testuser',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
    })

    it('retorna 404 para usuário inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'GET', url: '/user/999',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(404)
    })

    it('retorna 404 para usuário com id < 3 (sistema)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser, id: 2 } as any)

        const res = await app.inject({
            method: 'GET', url: '/user/2',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(404)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({ method: 'GET', url: '/user/5' })
        expect(res.statusCode).toBe(401)
    })
})

describe('GET /user/:id/recent', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close(); vi.clearAllMocks() })

    it('retorna scores recentes com defaults (mode=0, limit=5)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5/recent',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(Array.isArray(JSON.parse(res.body))).toBe(true)
    })

    it('aceita mode e limit customizados', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5/recent?mode=1&limit=10',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
    })

    it('retorna 400 para limit > 100', async () => {
        const res = await app.inject({
            method: 'GET', url: '/user/5/recent?limit=101',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 404 para usuário inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'GET', url: '/user/999/recent',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })
})

describe('GET /user/:id/map/:map', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.$queryRaw).mockReset()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close() })

    it('retorna best score no mapa via md5 local', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.maps.findFirst).mockResolvedValueOnce({ md5: 'abc123md5' } as any)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{
            score_id: 1, score_val: 500000, score_pp: 120, score_acc: 95,
            max_combo: 300, mods: 0, n300: 200, n100: 10, n50: 0, nmiss: 0,
            grade: 'A', perfect: 0, play_time: new Date(), map_id: 123,
            map_set_id: 456, map_status: 2
        }])

        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: {
            id: 123, checksum: 'abc123md5', beatmapset: { artist: 'Artist', title: 'Title', creator: 'Creator', covers: {} },
            mode: 'osu', mode_int: 0, status: 'ranked', total_length: 180, user_id: 1,
            version: 'Hard', difficulty_rating: 3.5, bpm: 180, accuracy: 8, ar: 9, cs: 4, drain: 7,
            max_combo: 500, count_circles: 100, count_sliders: 200, passcount: 1000, playcount: 5000,
            beatmapset_id: 456
        }})

        const res = await app.inject({
            method: 'GET', url: '/user/5/map/123',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toHaveProperty('score')
    })

    it('retorna 404 quando não há score no mapa', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.maps.findFirst).mockResolvedValueOnce({ md5: 'abc123md5' } as any)
        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5/map/123',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })

    it('busca md5 na API osu! quando mapa não está no banco local', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.maps.findFirst).mockResolvedValueOnce(null)

        const osuApi = (await import('../src/utils/axios')).default
        vi.mocked(osuApi.get).mockResolvedValueOnce({ data: { checksum: 'apimd5hash' } })

        vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5/map/999',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(osuApi.get).toHaveBeenCalledWith('/beatmaps/999')
        expect(res.statusCode).toBe(404)
    })
})

describe('GET /user/:id/history', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close() })

    const mockHistory = [
        { date: new Date('2026-01-01'), rank: 10, pp: 500 },
        { date: new Date('2026-01-15'), rank: 8, pp: 550 },
        { date: new Date('2026-02-01'), rank: 5, pp: 620 }
    ]

    it('retorna 200 com histórico de rank', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce(mockHistory as any)

        const res = await app.inject({
            method: 'GET', url: '/user/5/history',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(Array.isArray(body)).toBe(true)
        expect(body).toHaveLength(3)
    })

    it('retorna array vazio quando não há histórico', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'GET', url: '/user/5/history',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual([])
    })

    it('inclui campos date, rank e pp no response', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce(mockHistory as any)

        const res = await app.inject({
            method: 'GET', url: '/user/5/history',
            headers: { authorization: 'Bearer fake_token' }
        })

        const body = JSON.parse(res.body)
        expect(body[0]).toHaveProperty('rank')
        expect(body[0]).toHaveProperty('pp')
        expect(body[0]).toHaveProperty('date')
    })

    it('filtra por mode customizado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce([])

        await app.inject({
            method: 'GET', url: '/user/5/history?mode=1',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(prisma.user_rank_history.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ mode: 1 })
            })
        )
    })

    it('filtra por days customizado', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce([])

        await app.inject({
            method: 'GET', url: '/user/5/history?days=30',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(prisma.user_rank_history.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ user_id: mockUser.id })
            })
        )
    })

    it('usa mode=0 e days=90 como defaults', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce([])

        await app.inject({
            method: 'GET', url: '/user/5/history',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(prisma.user_rank_history.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ mode: 0, user_id: mockUser.id })
            })
        )
    })

    it('retorna 400 para mode inválido (>8)', async () => {
        const res = await app.inject({
            method: 'GET', url: '/user/5/history?mode=9',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para days > 365', async () => {
        const res = await app.inject({
            method: 'GET', url: '/user/5/history?days=366',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para days=0', async () => {
        const res = await app.inject({
            method: 'GET', url: '/user/5/history?days=0',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 404 para usuário inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'GET', url: '/user/999/history',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 404 para id < 3 (conta de sistema)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser, id: 2 } as any)

        const res = await app.inject({
            method: 'GET', url: '/user/2/history',
            headers: { authorization: 'Bearer fake_token' }
        })
        expect(res.statusCode).toBe(404)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({ method: 'GET', url: '/user/5/history' })
        expect(res.statusCode).toBe(401)
    })

    it('ordena histórico por data ascendente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        vi.mocked(prisma.user_rank_history.findMany).mockResolvedValueOnce(mockHistory as any)

        await app.inject({
            method: 'GET', url: '/user/5/history',
            headers: { authorization: 'Bearer fake_token' }
        })

        expect(prisma.user_rank_history.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { date: 'asc' } })
        )
    })
})

describe('DELETE /user/me', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close() })

    it('deleta a conta com sucesso e retorna 200', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(true)
        vi.mocked(prisma.stats.deleteMany).mockResolvedValueOnce({ count: 8 } as any)
        vi.mocked(prisma.scores.deleteMany).mockResolvedValueOnce({ count: 42 } as any)
        vi.mocked(prisma.users.delete).mockResolvedValueOnce({ ...mockUser } as any)

        const res = await app.inject({
            method: 'DELETE', url: '/user/me',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ password: 'senha123' })
        })

        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toHaveProperty('message')
    })

    it('deleta stats e scores antes de deletar o usuário', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(true)
        vi.mocked(prisma.stats.deleteMany).mockResolvedValueOnce({ count: 8 } as any)
        vi.mocked(prisma.scores.deleteMany).mockResolvedValueOnce({ count: 0 } as any)
        vi.mocked(prisma.users.delete).mockResolvedValueOnce({ ...mockUser } as any)

        await app.inject({
            method: 'DELETE', url: '/user/me',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ password: 'senha123' })
        })

        expect(prisma.stats.deleteMany).toHaveBeenCalledWith({ where: { id: mockUser.id } })
        expect(prisma.scores.deleteMany).toHaveBeenCalledWith({ where: { userid: mockUser.id } })
        expect(prisma.users.delete).toHaveBeenCalledWith({ where: { id: mockUser.id } })
    })

    it('retorna 401 para senha incorreta', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockUser } as any)
        const { verifyPassword } = await import('../src/utils/hash')
        vi.mocked(verifyPassword).mockResolvedValueOnce(false)

        const res = await app.inject({
            method: 'DELETE', url: '/user/me',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ password: 'senhaerrada' })
        })

        expect(res.statusCode).toBe(401)
        expect(prisma.users.delete).not.toHaveBeenCalled()
    })

    it('retorna 400 para body sem password', async () => {
        const res = await app.inject({
            method: 'DELETE', url: '/user/me',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({})
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({
            method: 'DELETE', url: '/user/me',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ password: 'senha123' })
        })

        expect(res.statusCode).toBe(401)
    })
})