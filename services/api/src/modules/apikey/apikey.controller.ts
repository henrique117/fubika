import { FastifyReply, FastifyRequest } from "fastify";
import { CreateApikeyInput } from "./apikey.schema";
import { createApikey } from "./apikey.service";

export const handleApikeyCreate = async (
    req: FastifyRequest<{ Body: CreateApikeyInput }>, 
    res: FastifyReply
) => {
    const apiKeyData = await createApikey(req.body);

    return res.code(201).send(apiKeyData);
};