import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis', 
    port: Number(process.env.REDIS_PORT) || 6379
});

export const sendIngameMessage = async (userId: number, message: string) => {
    const payload = JSON.stringify({
        target_id: userId,
        msg: message
    });

    await redis.publish('api:notification', payload);
    console.log(`[REDIS] Pedido de mensagem enviado para ID: ${userId}`);
}