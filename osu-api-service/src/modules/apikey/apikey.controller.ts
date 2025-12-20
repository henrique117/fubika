import { FastifyReply, FastifyRequest } from "fastify";
import { CreateApikeyInput } from "./apikey.schema";
import { createApikey } from "./apikey.service";

export const handleApikeyCreate = async (
    req: FastifyRequest<{ Body: CreateApikeyInput }>, 
    res: FastifyReply
) => {
    const body = req.body;
    
    try {
        const invite = await createApikey(body);

        return res.code(201).send(invite);
    } catch (err) {
        return res.code(401).send(err);
    }
}