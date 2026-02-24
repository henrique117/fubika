import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { ServerError, Errors, globalErrorHandler } from '../src/utils/errorHandler'

const mockReply = () => {
    const reply = {
        _status: 0,
        _body: null as any,
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    }
    reply.status.mockImplementation((code: number) => {
        reply._status = code
        return reply
    })
    reply.send.mockImplementation((body: any) => {
        reply._body = body
        return reply
    })
    return reply
}

const mockRequest = () => ({
    log: { error: vi.fn() }
})

describe('ServerError', () => {
    it('cria um erro com statusCode 400 por padrão', () => {
        const err = new ServerError('algo errado')
        expect(err.statusCode).toBe(400)
        expect(err.message).toBe('algo errado')
    })

    it('cria um erro com statusCode customizado', () => {
        const err = new ServerError('não encontrado', 404)
        expect(err.statusCode).toBe(404)
    })

    it('é instância de Error', () => {
        expect(new ServerError('x')).toBeInstanceOf(Error)
    })
})

describe('Errors', () => {
    it('BadRequest retorna status 400', () => {
        expect(Errors.BadRequest('campo inválido').statusCode).toBe(400)
    })

    it('Unauthorized retorna status 401 com mensagem padrão', () => {
        const err = Errors.Unauthorized()
        expect(err.statusCode).toBe(401)
        expect(err.message).toBe('Não autorizado')
    })

    it('Unauthorized aceita mensagem customizada', () => {
        expect(Errors.Unauthorized('token expirado').message).toBe('token expirado')
    })

    it('Forbidden retorna status 403', () => {
        expect(Errors.Forbidden().statusCode).toBe(403)
    })

    it('NotFound retorna status 404 com mensagem padrão', () => {
        const err = Errors.NotFound()
        expect(err.statusCode).toBe(404)
        expect(err.message).toBe('Recurso não encontrado')
    })

    it('Conflict retorna status 409', () => {
        expect(Errors.Conflict('usuário já existe').statusCode).toBe(409)
    })

    it('Internal retorna status 500', () => {
        expect(Errors.Internal().statusCode).toBe(500)
    })
})

describe('globalErrorHandler', () => {
    let reply: ReturnType<typeof mockReply>
    let request: ReturnType<typeof mockRequest>

    beforeEach(() => {
        reply = mockReply()
        request = mockRequest()
    })

    it('trata ZodError com status 400 e detalhes dos campos', () => {
        const schema = z.object({ name: z.string() })
        let zodError: z.ZodError
        try { schema.parse({ name: 123 }) } catch (e: any) { zodError = e }

        globalErrorHandler(zodError!, request as any, reply as any)

        expect(reply._status).toBe(400)
        expect(reply._body.error).toBe('Validation Error')
        expect(reply._body.details).toBeDefined()
    })

    it('trata ServerError com o statusCode correto', () => {
        const err = Errors.NotFound('mapa não encontrado')
        globalErrorHandler(err, request as any, reply as any)

        expect(reply._status).toBe(404)
        expect(reply._body.message).toBe('mapa não encontrado')
        expect(reply._body.error).toBe('Not Found')
    })

    it('trata ServerError 403', () => {
        globalErrorHandler(Errors.Forbidden(), request as any, reply as any)
        expect(reply._status).toBe(403)
        expect(reply._body.error).toBe('Forbidden')
    })

    it('trata ServerError 409', () => {
        globalErrorHandler(Errors.Conflict('conflito'), request as any, reply as any)
        expect(reply._status).toBe(409)
        expect(reply._body.error).toBe('Conflict')
    })

    it('trata erros Prisma (código P*) com status 500', () => {
        const prismaError = { code: 'P2002', message: 'Unique constraint failed' }
        globalErrorHandler(prismaError, request as any, reply as any)

        expect(reply._status).toBe(500)
        expect(reply._body.error).toBe('Database Error')
        expect(request.log.error).toHaveBeenCalled()
    })

    it('trata erros desconhecidos com status 500 genérico', () => {
        globalErrorHandler(new Error('crash inesperado'), request as any, reply as any)

        expect(reply._status).toBe(500)
        expect(reply._body.error).toBe('Internal Server Error')
    })

    it('trata erros que não são instâncias de Error', () => {
        globalErrorHandler('string de erro', request as any, reply as any)
        expect(reply._status).toBe(500)
    })
})