import { FastifyInstance } from "fastify";
import { handleDiscordLink } from "./discord.controller";

const discordRoutes = async (server: FastifyInstance) => {
    server.post('/link', handleDiscordLink);
}

export default discordRoutes;