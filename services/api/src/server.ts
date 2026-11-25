import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import prisma from "./utils/prisma";

import {
    userRoutes,
    inviteRoutes,
    discordRoutes,
    beatmapRoutes,
    rankingRoutes,
    apikeyRoutes,
    adminRoutes,
} from "./modules/barrel";

import { globalErrorHandler } from "./utils/errorHandler";
import { initCronJobs } from "./modules/cron/maintenance.service";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import { env, DEFAULT_JWT_SECRET } from "./config/env";
import { logger } from "./utils/logger";

(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (this: bigint) {
    return Number(this);
};

const API_PREFIX = "api/v1";

export const server = Fastify({
    loggerInstance: logger,
    connectionTimeout: env.server.connectionTimeoutMs,
    keepAliveTimeout: env.server.keepAliveTimeoutMs,
    requestTimeout: env.server.requestTimeoutMs,
});

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

async function main() {
    server.setErrorHandler(globalErrorHandler);

    if (env.isProduction && env.jwtSecret === DEFAULT_JWT_SECRET) {
        logger.warn(
            "[Segurança] JWT_SECRET não definido — usando valor padrão. Defina JWT_SECRET em produção."
        );
    }

    await server.register(helmet, { contentSecurityPolicy: false });

    await server.register(cors, {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    });

    await server.register(rateLimit, {
        max: env.rateLimit.max,
        timeWindow: env.rateLimit.windowMs,
    });

    await server.register(fastifyJwt, {
        secret: env.jwtSecret,
    });

    await server.register(multipart, {
        limits: {
            fieldNameSize: 100,
            fieldSize: 100,
            fields: 10,
            fileSize: env.upload.maxFileSizeBytes,
            files: 1,
        },
    });

    server.get("/ping", async () => {
        const start = performance.now();
        await prisma.$queryRaw`SELECT 1`;
        const end = performance.now();

        return {
            status: "alive",
            database: "connected",
            latency_db_ms: Math.round(end - start),
        };
    });

    await server.register(userRoutes, { prefix: `${API_PREFIX}/user` });
    await server.register(inviteRoutes, { prefix: `${API_PREFIX}/invite` });
    await server.register(discordRoutes, { prefix: `${API_PREFIX}/discord` });
    await server.register(beatmapRoutes, { prefix: `${API_PREFIX}/beatmap` });
    await server.register(rankingRoutes, { prefix: `${API_PREFIX}/ranking` });
    await server.register(apikeyRoutes, { prefix: `${API_PREFIX}/key` });
    await server.register(adminRoutes, { prefix: `${API_PREFIX}/admin` });

    initCronJobs();

    try {
        await server.listen({ port: env.port, host: env.host });

        logger.info(`🚀 Fubika API online em http://${env.host}:${env.port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();
