import Redis from "ioredis";
import { Errors } from "./errorHandler";

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    }
});

redis.on('error', (err) => console.error('[Redis] Erro de ligação:', err.message));
redis.on('connect', () => console.log('[Redis] Conectado com sucesso.'));

export const sendIngameMessage = async (userId: number, message: string) => {
    try {
        const payload = JSON.stringify({
            target_id: userId,
            msg: message
        });

        await redis.publish('api:notification', payload);
        
        console.log(`[Redis] Mensagem enviada para o utilizador ${userId}: "${message}"`);
    } catch (err) {
        console.error(`[Redis] Falha ao publicar mensagem para ID ${userId}:`, err);
        
        throw Errors.Internal("Não foi possível comunicar com o servidor do jogo via Redis.");
    }
}

export default redis;