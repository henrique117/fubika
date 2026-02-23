import { FastifyRequest, FastifyReply } from "fastify";
import z from "zod";

export class ServerError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ServerError.prototype);
    }
}

export const Errors = {
    BadRequest: (msg: string) => new ServerError(msg, 400),
    Unauthorized: (msg = "Não autorizado") => new ServerError(msg, 401),
    Forbidden: (msg = "Acesso negado") => new ServerError(msg, 403),
    NotFound: (msg = "Recurso não encontrado") => new ServerError(msg, 404),
    Conflict: (msg: string) => new ServerError(msg, 409),
    Internal: (msg = "Erro interno no servidor") => new ServerError(msg, 500),
};

export const globalErrorHandler = (
    error: any,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    if (error instanceof z.ZodError) {
        return reply.status(400).send({
            error: "Validation Error",
            message: "Dados de entrada inválidos.",
            details: error.flatten().fieldErrors,
        });
    }

    if (error instanceof ServerError) {
        return reply.status(error.statusCode).send({
            error: getStatusName(error.statusCode),
            message: error.message,
        });
    }

    if (error.code?.startsWith("P")) {
        request.log.error(`[Prisma Error ${error.code}]: ${error.message}`);
        return reply.status(500).send({
            error: "Database Error",
            message: "Ocorreu um erro na persistência dos dados.",
        });
    }

    return reply.status(500).send({
        error: "Internal Server Error",
        message: "Algo correu muito mal. O administrador foi avisado.",
    });
};

function getStatusName(code: number): string {
    const map: Record<number, string> = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        500: "Internal Server Error",
    };
    return map[code] || "Error";
}