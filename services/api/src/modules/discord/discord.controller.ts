import { FastifyReply, FastifyRequest } from "fastify";
import { finishLinkProcess, startLinkProcess } from "./discord.service";
import { CheckDiscordLink, CreateDiscordLink } from "./discord.schema";

export const handleCreateDiscordLink = async (
    req: FastifyRequest<{ Body: CreateDiscordLink }>,
    res: FastifyReply
) => {
    const result = await startLinkProcess(req.body);
    return res.send(result);
};

export const handleCheckDiscordLink = async (
    req: FastifyRequest<{ Body: CheckDiscordLink }>,
    res: FastifyReply
) => {
    const result = await finishLinkProcess(req.body);
    return res.send(result);
};