import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

vi.mock('../src/utils/prisma', () => ({
    default: {
        users: { findUnique: vi.fn(), update: vi.fn() }
    }
}))

vi.mock('../src/middlewares/auth.middleware', () => ({
    authenticate: vi.fn(async (req: any, _res: any) => {
        req.user = { id: 5, name: 'adminuser' }
    })
}))

vi.mock('../src/middlewares/admin.middleware', () => ({
    authorizeAdmin: vi.fn(async () => {})
}))

vi.mock('../src/middlewares/ownership.middleware', () => ({
    authorizeDiscordOwnership: vi.fn(async () => {})
}))

const buildServer = async () => {
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    await app.register(fastifyJwt, { secret: 'test_secret' })
    const routes = (await import('../src/modules/admin/admin.route')).default
    await app.register(routes, { prefix: '/admin' })
    await app.ready()
    return app
}

const mockRegularUser = {
    id: 10,
    name: 'PlayerAlvo',
    safe_name: 'playeralvo',
    priv: 1,
    discord_id: '123456789',
    is_admin: false,
    is_dev: false
}

const mockAdminUser = {
    id: 5,
    name: 'adminuser',
    safe_name: 'adminuser',
    priv: 1048575,
    discord_id: process.env.OWNER_DISCORD_ID || '520994132458471438',
    is_admin: true,
    is_dev: true
}

describe('POST /admin/ban', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close() })

    it('bane o jogador com sucesso e retorna 200', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockRegularUser } as any)
        vi.mocked(prisma.users.update).mockResolvedValueOnce({ ...mockRegularUser, priv: 0 } as any)

        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body.success).toBe(true)
        expect(body.message).toContain('PlayerAlvo')
    })

    it('seta priv=0 no banco ao banir', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockRegularUser } as any)
        vi.mocked(prisma.users.update).mockResolvedValueOnce({ ...mockRegularUser, priv: 0 } as any)

        await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(prisma.users.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { priv: 0 }
        })
    })

    it('retorna 404 para usuário inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 999 })
        })

        expect(res.statusCode).toBe(404)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 403 ao tentar banir o sistema (id=1)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockRegularUser, id: 1 } as any)

        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 1 })
        })

        expect(res.statusCode).toBe(403)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 403 ao tentar banir o dono do servidor (id=3)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({ ...mockRegularUser, id: 3 } as any)

        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 3 })
        })

        expect(res.statusCode).toBe(403)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 400 para target_id não numérico', async () => {
        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 'abc' })
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 400 para body sem target_id', async () => {
        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
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
            method: 'POST', url: '/admin/ban',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(401)
    })

    it('retorna 403 sem privilégio de admin', async () => {
        const { authorizeAdmin } = await import('../src/middlewares/admin.middleware')
        vi.mocked(authorizeAdmin).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(403).send({ message: 'Forbidden' })
        })

        const res = await app.inject({
            method: 'POST', url: '/admin/ban',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(403)
    })
})

describe('POST /admin/giveadmin', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        vi.clearAllMocks()
        app = await buildServer()
    })

    afterEach(async () => { if (app) await app.close() })

    it('promove jogador a admin com sucesso e retorna 200', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ ...mockAdminUser } as any)
            .mockResolvedValueOnce({ ...mockRegularUser } as any)
        vi.mocked(prisma.users.update).mockResolvedValueOnce({
            ...mockRegularUser, priv: 1048575, is_admin: true, is_dev: true
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body.success).toBe(true)
        expect(body.message).toContain('PlayerAlvo')
    })

    it('seta priv=1048575, is_admin=true, is_dev=true ao promover', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ ...mockAdminUser } as any)
            .mockResolvedValueOnce({ ...mockRegularUser } as any)
        vi.mocked(prisma.users.update).mockResolvedValueOnce({} as any)

        await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(prisma.users.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { priv: 1048575, is_admin: true, is_dev: true }
        })
    })

    it('retorna 403 se o requester não é o dono (discord_id diferente)', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce({
            ...mockAdminUser,
            discord_id: '999999999999'
        } as any)

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(403)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 403 se o requester não existe no banco', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique).mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(403)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 404 para usuário alvo inexistente', async () => {
        const prisma = (await import('../src/utils/prisma')).default
        vi.mocked(prisma.users.findUnique)
            .mockResolvedValueOnce({ ...mockAdminUser } as any)
            .mockResolvedValueOnce(null)

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 999 })
        })

        expect(res.statusCode).toBe(404)
        expect(prisma.users.update).not.toHaveBeenCalled()
    })

    it('retorna 400 para target_id não numérico', async () => {
        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 'abc' })
        })

        expect(res.statusCode).toBe(400)
    })

    it('retorna 401 sem token', async () => {
        const { authenticate } = await import('../src/middlewares/auth.middleware')
        vi.mocked(authenticate).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(401).send({ message: 'Unauthorized' })
        })

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(401)
    })

    it('retorna 403 sem ownership do Discord', async () => {
        const { authorizeDiscordOwnership } = await import('../src/middlewares/ownership.middleware')
        vi.mocked(authorizeDiscordOwnership).mockImplementationOnce(async (_req: any, res: any) => {
            return res.code(403).send({ message: 'Forbidden' })
        })

        const res = await app.inject({
            method: 'POST', url: '/admin/giveadmin',
            headers: { authorization: 'Bearer fake_token', 'content-type': 'application/json' },
            body: JSON.stringify({ target_id: 10 })
        })

        expect(res.statusCode).toBe(403)
    })
})