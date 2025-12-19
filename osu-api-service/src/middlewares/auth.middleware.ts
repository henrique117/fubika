import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ message: "Token inválido ou não fornecido" });
    }
}