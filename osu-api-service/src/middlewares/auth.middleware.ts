import { FastifyRequest, FastifyReply } from "fastify";
import { checkApiKey } from "../modules/apikey/apikey.service";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
        const tokenData = await checkApiKey(apiKey);

        if (!tokenData) {
            return reply.status(401).send({ message: "API Key inválida" });
        }

        req.user = {
            id: tokenData.user.id,
            name: tokenData.user.name,
            priv: tokenData.user.priv,
        };

        return;
    }

    try {
        await req.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ message: "Token inválido ou não fornecido" });
    }
}