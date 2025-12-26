(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

import Fastify from "fastify";
import { userRoutes, inviteRoutes, discordRoutes, beatmapRoutes } from "./modules/barrel";
import prisma from "./utils/prisma";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import rankingRoutes from "./modules/ranking/ranking.route";
import apikeyRoutes from "./modules/apikey/apikey.route";

export const server = Fastify({ 
    logger: true
});

server.get('/ping', async () => {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const end = performance.now();

    return { 
        status: 'alive', 
        database: 'connected', 
        latency_db_ms: end - start
    }
});

async function main() {
    await server.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'aaabbbccc'
    });

    await server.register(cors, { 
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    });

    await server.register(userRoutes, { prefix: 'api/user' });
    await server.register(inviteRoutes, { prefix: 'api/invite' });
    await server.register(discordRoutes, { prefix: 'api/discord' });
    await server.register(beatmapRoutes, { prefix: 'api/beatmap' });
    await server.register(rankingRoutes, { prefix: 'api/ranking' });
    await server.register(apikeyRoutes, { prefix: 'api/key' });

    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Servidor rodando em http://0.0.0.0:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();