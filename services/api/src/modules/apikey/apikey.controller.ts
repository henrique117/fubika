import { FastifyReply, FastifyRequest } from "fastify";
import { CreateApikeyInput } from "./apikey.schema";
import { createApikey } from "./apikey.service";

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[ApiKey API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleApikeyCreate = async (
    req: FastifyRequest<{ Body: CreateApikeyInput }>, 
    res: FastifyReply
) => {
    try {
        const apiKeyData = await createApikey(req.body);
        return res.code(201).send(apiKeyData);
    } catch (err: any) {
        const statusCode = err.message?.includes("permissão") ? 401 : 400;
        const msg = err.message || "Não foi possível gerar a chave de API.";
        
        return sendError(res, statusCode, msg, err);
    }
}