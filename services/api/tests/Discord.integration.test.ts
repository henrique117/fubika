import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findFirst: vi.fn(), update: vi.fn() },
        verification_codes: {
            findFirst: vi.fn(),
            deleteMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

vi.mock('../src/utils/redis', () => ({
    sendIngameMessage: vi.fn(),
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

    const discordRoutes = (await import('../src/modules/discord/discord.route')).default
    await app.register(discordRoutes, { prefix: '/discord' })

    await app.ready()
    return app
}

const makeToken = (app: any) => app.jwt.sign({ id: 5, name: 'testuser' })

const mockUser = {
    id: 5,
    name: 'TestUser',
    safe_name: 'testuser',
    discord_id: null,
}

const mockUserWithDiscord = {
    ...mockUser,
    discord_id: '123456789012345678',
}

const mockVerificationCode = {
    id: 1,
    osu_id: 5,
    discord_id: '999888777666555444',
    code: 'ABC123',
}

describe('POST /discord/createlink', () => {
    let app: any
    let prismaMock: any
    let redisMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        redisMock = await import('../src/utils/redis')
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('inicia vinculação com sucesso e envia código in-game', async () => {
        prismaMock.users.findFirst.mockResolvedValueOnce(mockUser)
        prismaMock.$transaction.mockResolvedValueOnce([])
        redisMock.sendIngameMessage.mockResolvedValueOnce(undefined)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                discord_id: '999888777666555444',
                osu_name: 'TestUser',
            },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.success).toBe(true)
        expect(body.message).toContain('código')
        expect(redisMock.sendIngameMessage).toHaveBeenCalledWith(
            5,
            expect.stringContaining('código')
        )
    })

    it('retorna 404 para osu_name inexistente', async () => {
        prismaMock.users.findFirst.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', osu_name: 'NaoExiste' },
        })

        expect(res.statusCode).toBe(404)
        expect(res.json().message).toContain('não encontrado')
    })

    it('retorna 409 quando conta já tem Discord vinculado', async () => {
        prismaMock.users.findFirst.mockResolvedValueOnce(mockUserWithDiscord)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', osu_name: 'TestUser' },
        })

        expect(res.statusCode).toBe(409)
        expect(res.json().message).toContain('Discord vinculado')
    })

    it('normaliza osu_name (case-insensitive, espaços para _)', async () => {
        prismaMock.users.findFirst.mockResolvedValueOnce(mockUser)
        prismaMock.$transaction.mockResolvedValueOnce([])
        redisMock.sendIngameMessage.mockResolvedValueOnce(undefined)

        const token = makeToken(app)
        await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999', osu_name: 'Test User' },
        })

        expect(prismaMock.users.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { safe_name: 'test_user' },
            })
        )
    })

    it('retorna 400 para body sem discord_id', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { osu_name: 'TestUser' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem osu_name', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para discord_id vazio', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '', osu_name: 'TestUser' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('usa $transaction para deletar código antigo e criar novo', async () => {
        prismaMock.users.findFirst.mockResolvedValueOnce(mockUser)
        prismaMock.$transaction.mockResolvedValueOnce([])
        redisMock.sendIngameMessage.mockResolvedValueOnce(undefined)

        const token = makeToken(app)
        await app.inject({
            method: 'POST',
            url: '/discord/createlink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', osu_name: 'TestUser' },
        })

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    })
})

describe('POST /discord/checklink', () => {
    let app: any
    let prismaMock: any

    beforeEach(async () => {
        vi.resetModules()
        prismaMock = (await import('../src/utils/prisma')).default
        app = await buildServer()
    })

    afterEach(async () => { await app.close(); vi.clearAllMocks() })

    it('finaliza vinculação com sucesso', async () => {
        prismaMock.verification_codes.findFirst.mockResolvedValueOnce(mockVerificationCode)
        prismaMock.$transaction.mockResolvedValueOnce([])

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                discord_id: '999888777666555444',
                code: 'ABC123',
            },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().success).toBe(true)
        expect(res.json().message).toContain('sucesso')
    })

    it('usa $transaction para atualizar user e deletar código', async () => {
        prismaMock.verification_codes.findFirst.mockResolvedValueOnce(mockVerificationCode)
        prismaMock.$transaction.mockResolvedValueOnce([])

        const token = makeToken(app)
        await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', code: 'ABC123' },
        })

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    })

    it('retorna 400 para código inexistente', async () => {
        prismaMock.verification_codes.findFirst.mockResolvedValueOnce(null)

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', code: 'INVALID' },
        })

        expect(res.statusCode).toBe(400)
        expect(res.json().message).toContain('inválido')
    })

    it('retorna 400 quando discord_id não bate com o código', async () => {
        prismaMock.verification_codes.findFirst.mockResolvedValueOnce({
            ...mockVerificationCode,
            discord_id: 'OUTRO_DISCORD_ID',
        })

        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444', code: 'ABC123' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem code', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: { discord_id: '999888777666555444' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem discord_id', async () => {
        const token = makeToken(app)
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            headers: { authorization: `Bearer ${token}` },
            payload: { code: 'ABC123' },
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/discord/checklink',
            payload: { discord_id: '999', code: 'ABC123' },
        })

        expect(res.statusCode).toBe(401)
    })
})