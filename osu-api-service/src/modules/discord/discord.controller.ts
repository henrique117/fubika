import { FastifyRequest, FastifyReply } from "fastify";
import { startLinkProcess } from "./discord.service";
import { CheckDiscordLink, CreateDiscordLink } from "./discord.schema";
import z from "zod";

export const handleCreateDiscordLink = async (
    req: FastifyRequest<{ Body: CreateDiscordLink }>,
    res: FastifyReply
) => {
    try {
        const body = req.body;

        const result = await startLinkProcess(body);

        return res.send(result);

    } catch (err: any) {
        
        if (err instanceof z.ZodError) {
            return res.status(400).send({ error: "Dados inválidos", details: err.format() });
        }

        if (err.message === "USER_NOT_FOUND") {
            return res.status(404).send({ error: "Usuário não encontrado no servidor." });
        }

        if (err.message === "ALREADY_LINKED") {
            return res.status(409).send({ error: "Este usuário já está vinculado a um Discord." });
        }

        return res.status(500).send({ error: "Erro interno ao processar vinculação." });
    }
}

export const handleCheckDiscordLink = async (
    req: FastifyRequest<{ Body: CheckDiscordLink }>,
    res: FastifyReply
) => {
    try {
        const body = req.body;

        
    } catch (err: any) {

        if (err instanceof z.ZodError) {
            return res.status(400).send({ error: "Dados inválidos", details: err.format() });
        }

        return res.status(500).send({ error: "Erro interno ao processar vinculação." });
    }
}