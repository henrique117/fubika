import { FastifyInstance } from "fastify";
import { handleCheckDiscordLink, handleCreateDiscordLink } from "./discord.controller";

const discordRoutes = async (server: FastifyInstance) => {
    server.post('/createlink', handleCreateDiscordLink);
    server.post('/checklink', handleCheckDiscordLink);
}

export default discordRoutes;