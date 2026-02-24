import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import prisma from "./utils/prisma";

import { 
    userRoutes, 
    inviteRoutes, 
    discordRoutes, 
    beatmapRoutes, 
    rankingRoutes, 
    apikeyRoutes 
} from "./modules/barrel";

import { globalErrorHandler } from "./utils/errorHandler";
import { initCronJobs } from "./modules/cron/maintenance.service";

(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export const server = Fastify({ 
    logger: true
});

async function main() {
    server.setErrorHandler(globalErrorHandler);

    await server.register(multipart, {
        limits: {
            fieldNameSize: 100,
            fieldSize: 100,
            fields: 10,
            fileSize: 2000000,
            files: 1,
        },
    });

    await server.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'fubika_secret_2026'
    });

    await server.register(cors, { 
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    });

    server.get('/ping', async () => {
        const start = performance.now();
        await prisma.$queryRaw`SELECT 1`;
        const end = performance.now();

        return { 
            status: 'alive', 
            database: 'connected', 
            latency_db_ms: Math.round(end - start)
        };
    });

    await server.register(userRoutes, { prefix: 'api/user' });
    await server.register(inviteRoutes, { prefix: 'api/invite' });
    await server.register(discordRoutes, { prefix: 'api/discord' });
    await server.register(beatmapRoutes, { prefix: 'api/beatmap' });
    await server.register(rankingRoutes, { prefix: 'api/ranking' });
    await server.register(apikeyRoutes, { prefix: 'api/key' });

    initCronJobs();

    try {
        const port = Number(process.env.API_PORT) || 3000;
        await server.listen({ port: port, host: '0.0.0.0' });
        
        console.log(`
        🚀 Fubika API está online!
        📡 Porta: ${port}
        🔗 Host: http://0.0.0.0:${port}
        `);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();