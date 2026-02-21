import { FastifyReply, FastifyRequest } from "fastify";
import { finishLinkProcess, startLinkProcess } from "./discord.service";
import { CheckDiscordLink, CreateDiscordLink } from "./discord.schema";
import z from "zod";

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[Discord Link API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleCreateDiscordLink = async (
    req: FastifyRequest<{ Body: CreateDiscordLink }>,
    res: FastifyReply
) => {
    try {
        const result = await startLinkProcess(req.body);
        return res.send(result);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, "Dados de entrada inválidos.");
        }

        if (err.message === "USER_NOT_FOUND") {
            return sendError(res, 404, "Usuário não encontrado no servidor.");
        }

        if (err.message === "ALREADY_LINKED") {
            return sendError(res, 409, "Este usuário já está vinculado a uma conta Discord.");
        }

        return sendError(res, 500, "Falha ao processar o início da vinculação.", err);
    }
}

export const handleCheckDiscordLink = async (
    req: FastifyRequest<{ Body: CheckDiscordLink }>,
    res: FastifyReply
) => {
    try {
        const result = await finishLinkProcess(req.body);
        return res.send(result);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, "Parâmetros de verificação inválidos.");
        }

        const msg = err.message === "INVALID_CODE" ? "Código de verificação inválido ou expirado." : "Erro ao finalizar vinculação.";
        return sendError(res, 400, msg, err);
    }
}