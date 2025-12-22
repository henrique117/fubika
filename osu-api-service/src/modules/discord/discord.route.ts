import { FastifyInstance } from "fastify";
import { handleCheckDiscordLink, handleCreateDiscordLink } from "./discord.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const discordRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);
    
    server.post('/createlink', handleCreateDiscordLink);
    server.post('/checklink', handleCheckDiscordLink);
}

export default discordRoutes;