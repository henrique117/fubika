import { FastifyInstance } from "fastify";
import { handleCheckDiscordLink, handleCreateDiscordLink } from "./discord.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";
import { checkDiscordLinkSchema, createDiscordLinkSchema, CheckDiscordLink, CreateDiscordLink } from "./discord.schema";

const discordRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: CreateDiscordLink }>('/createlink', {
        schema: {
            body: createDiscordLinkSchema
        },
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleCreateDiscordLink);

    server.post<{ Body: CheckDiscordLink }>('/checklink', {
        schema: {
            body: checkDiscordLinkSchema
        },
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleCheckDiscordLink);
}

export default discordRoutes;