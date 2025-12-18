import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { userRoutes, inviteRoutes, discordRoutes } from "./modules/barrel";
import prisma from "./utils/prisma";
import fastifyJwt from "@fastify/jwt";

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
})

async function main() {
    await server.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'aaabbbccc'
    })

    server.decorate("authenticate", async (req: FastifyRequest, res: FastifyReply) => {
        try {
            await req.jwtVerify();
        } catch (err) {
            return res.status(401).send({ message: "Token inválido ou não fornecido" });
        }
    });

    await server.register(userRoutes, { prefix: 'api/user' });
    await server.register(inviteRoutes, { prefix: 'api/invite' });
    await server.register(discordRoutes, { prefix: 'api/discord' });

    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Servidor rodando em http://0.0.0.0:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

main();