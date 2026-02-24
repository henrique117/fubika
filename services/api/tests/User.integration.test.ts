import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
        stats: { findUnique: vi.fn(), count: vi.fn(), createMany: vi.fn() },
        scores: { count: vi.fn() },
        maps: { findFirst: vi.fn() },
        invites: { findUnique: vi.fn(), update: vi.fn() },
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

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async (_req: any, _res: any) => { }),
}))

vi.mock('../src/utils/level', () => ({ calculateLevel: vi.fn(() => 35.7) }))

const buildServer = async () => {
    const app = Fastify()
    await app.register(fastifyJwt, { secret: 'test_secret' })
    await app.register(fastifyMultipart)

    const userRoutes = (await import('../src/modules/user/user.route')).default
    await app.register(userRoutes, { prefix: '/user' })

    await app.ready()
    return app
}

const makeToken = (app: any, payload = { id: 5, name: 'testuser' }) =>
    app.jwt.sign(payload)

const mockUser = {
    id: 5,
    name: 'TestUser',
    safe_name: 'testuser',
    email: 'test@fubika.com',
    pw_bcrypt: '$2a$10$abc',
    priv: 1,
    country: 'br',
    discord_id: '123456789012345678',
    latest_activity: Math.floor(Date.now() / 1000),
    is_admin: false,
    is_dev: false,
    creation_time: Math.floor(Date.now() / 1000),
}

const mockStats = {
    pp: 1200.5,
    acc: 97.3,
    tscore: BigInt(50000000),
    rscore: BigInt(30000000),
    max_combo: 2000,
    playtime: 500000,
    x_count: 20,
    xh_count: 8,
    s_count: 40,
    sh_count: 5,
    a_count: 60,
}

describe('POST /user/register', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('registra usuário com dados válidos e retorna 201', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce({
            id: 1, code: 'VALIDCODE', used_by_id: null,
            expires_at: new Date(Date.now() + 86400000), created_by_id: 1,
        })
        prismaMock.users.create.mockResolvedValueOnce(mockUser)
        prismaMock.invites.update.mockResolvedValueOnce({})
        prismaMock.stats.createMany.mockResolvedValueOnce({})

        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: {
                name: 'TestUser',
                email: 'test@fubika.com',
                password: 'senha123',
                key: 'VALIDCODE',
            },
        })

        expect(res.statusCode).toBe(201)
        expect(res.json().user).toHaveProperty('id')
    })

    it('retorna 400 para convite inválido', async () => {
        prismaMock.invites.findUnique.mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: {
                name: 'TestUser',
                email: 'test@fubika.com',
                password: 'senha123',
                key: 'INVALIDO',
            },
        })

        expect(res.statusCode).toBe(400)
        expect(res.json().message).toContain('convite')
    })

    it('retorna 400 para nome muito curto (<3 chars)', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: { name: 'ab', email: 'test@test.com', password: 'senha123', key: 'CODE' },
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para email inválido', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: { name: 'ValidUser', email: 'nao-e-email', password: 'senha123', key: 'CODE' },
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para senha muito curta (<6 chars)', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: { name: 'ValidUser', email: 'test@test.com', password: '123', key: 'CODE' },
        })
        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para nome com caracteres inválidos', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/user/register',
            payload: { name: 'user@#!', email: 'test@test.com', password: 'senha123', key: 'CODE' },
        })
        expect(res.statusCode).toBe(400)
    })
})

describe('POST /user/login', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna token JWT em login válido', async () => {
        const { hashPassword } = await import('../src/utils/hash')
        const hash = await hashPassword('senha123')

        prismaMock.users.findUnique
            .mockResolvedValueOnce({ ...mockUser, pw_bcrypt: hash })
            .mockResolvedValueOnce({ ...mockUser, pw_bcrypt: hash })
        prismaMock.stats.findUnique.mockResolvedValueOnce(mockStats)
        prismaMock.stats.count.mockResolvedValueOnce(10)
        prismaMock.scores.count.mockResolvedValueOnce(150)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const res = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: { name: 'TestUser', password: 'senha123' },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toHaveProperty('token')
        expect(res.json()).toHaveProperty('user')
    })

    it('retorna 401 para usuário inexistente', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: { name: 'NaoExiste', password: 'senha123' },
        })

        expect(res.statusCode).toBe(401)
        expect(res.json().message).toContain('inválidos')
    })

    it('retorna 401 para senha errada', async () => {
        const { hashPassword } = await import('../src/utils/hash')
        const hash = await hashPassword('senhaCorreta')
        prismaMock.users.findUnique.mockResolvedValueOnce({ ...mockUser, pw_bcrypt: hash })

        const res = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: { name: 'TestUser', password: 'senhaErrada' },
        })

        expect(res.statusCode).toBe(401)
    })

    it('retorna 403 para conta restrita (priv=0)', async () => {
        const { hashPassword } = await import('../src/utils/hash')
        const hash = await hashPassword('senha123')
        prismaMock.users.findUnique.mockResolvedValueOnce({ ...mockUser, pw_bcrypt: hash, priv: 0 })

        const res = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: { name: 'TestUser', password: 'senha123' },
        })

        expect(res.statusCode).toBe(403)
        expect(res.json().message).toContain('restrita')
    })
})

describe('GET /user/count', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna total e online sem autenticação', async () => {
        prismaMock.users.count
            .mockResolvedValueOnce(250)
            .mockResolvedValueOnce(12)

        const res = await app.inject({ method: 'GET', url: '/user/count' })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({ total_users: 250, online_users: 12 })
    })
})

describe('GET /user/me', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna perfil do usuário autenticado', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.stats.findUnique.mockResolvedValueOnce(mockStats)
        prismaMock.stats.count.mockResolvedValueOnce(5)
        prismaMock.scores.count.mockResolvedValueOnce(100)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/me',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toHaveProperty('name', 'TestUser')
    })
})

describe('GET /user/:id', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('busca por id numérico', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.stats.findUnique.mockResolvedValueOnce(mockStats)
        prismaMock.stats.count.mockResolvedValueOnce(3)
        prismaMock.scores.count.mockResolvedValueOnce(50)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().id).toBe(5)
    })

    it('busca por safe_name (string não numérica)', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.stats.findUnique.mockResolvedValueOnce(mockStats)
        prismaMock.stats.count.mockResolvedValueOnce(1)
        prismaMock.scores.count.mockResolvedValueOnce(20)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/testuser',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(prismaMock.users.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { safe_name: 'testuser' } })
        )
    })

    it('retorna 404 para usuário inexistente', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/999',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
    })

    it('retorna 404 para usuário com id < 3 (sistema)', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce({ ...mockUser, id: 2 })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/2',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
        expect(res.json().message).toContain('indisponível')
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({ method: 'GET', url: '/user/5' })
        expect(res.statusCode).toBe(401)
    })
})

describe('GET /user/:id/recent', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('retorna scores recentes com defaults (mode=0, limit=5)', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/recent',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.json())).toBe(true)
    })

    it('aceita mode e limit customizados', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/recent?mode=1&limit=10',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
    })

    it('retorna 400 para limit > 100', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/recent?limit=101',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 404 para usuário inexistente', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/999/recent',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
    })
})

describe('GET /user/:id/map/:map', () => {
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

    it('retorna best score no mapa via md5 local', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([{
            score_id: 1, score_val: 500000, score_pp: 250, score_acc: 98,
            max_combo: 800, mods: 8, n300: 500, n100: 10, n50: 2, nmiss: 0,
            grade: 'S', perfect: 1, play_time: 1700000000, map_md5: 'abc123md5',
            mode: 0, status: 2, map_id: 123, map_set_id: 456,
        }])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/map/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toHaveProperty('player')
        expect(res.json().player.id).toBe(5)
    })

    it('retorna 404 quando não há score no mapa', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.maps.findFirst.mockResolvedValueOnce({ md5: 'abc123md5' })
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/map/123',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(res.statusCode).toBe(404)
    })

    it('busca md5 na API osu! quando mapa não está no banco local', async () => {
        prismaMock.users.findUnique.mockResolvedValueOnce(mockUser)
        prismaMock.maps.findFirst.mockResolvedValueOnce(null)
            ; (osuApiMock.get as any).mockResolvedValueOnce({
                data: { checksum: 'md5fromapi123' },
            })
        prismaMock.$queryRaw.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'GET',
            url: '/user/5/map/999',
            headers: { authorization: `Bearer ${token}` },
        })

        expect(osuApiMock.get).toHaveBeenCalledWith('/beatmaps/999')
        expect(res.statusCode).toBe(404)
    })
})