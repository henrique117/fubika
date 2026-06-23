import Redis from "ioredis";
import { Errors } from "./errorHandler";
import { env } from "../config/env";
import { logger } from "./logger";

const redis = new Redis(env.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    },
});

redis.on("error", (err) => logger.error({ err: err.message }, "[Redis] Erro de ligação"));
redis.on("connect", () => logger.info("[Redis] Conectado com sucesso."));

export const sendIngameMessage = async (userId: number, message: string) => {
    try {
        const payload = JSON.stringify({
            target_id: userId,
            msg: message,
        });

        await redis.publish("api:notification", payload);

        logger.info(`[Redis] Mensagem enviada para o utilizador ${userId}: "${message}"`);
    } catch (err) {
        logger.error({ err }, `[Redis] Falha ao publicar mensagem para ID ${userId}`);

        throw Errors.Internal("Não foi possível comunicar com o servidor do jogo via Redis.");
    }
};

export default redis;
