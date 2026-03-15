import { FastifyRequest } from "fastify";
import { checkApiKey } from "../modules/apikey/apikey.service";
import { Errors } from "../utils/errorHandler";

export async function authenticate(req: FastifyRequest, _: any) {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
        const tokenData = await checkApiKey(apiKey);

        if (!tokenData) {
            throw Errors.Unauthorized("API Key inválida.");
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
        (req.user as any).isBot = false;
    } catch (err) {
        throw Errors.Unauthorized("Token inválido ou não fornecido.");
    }
}