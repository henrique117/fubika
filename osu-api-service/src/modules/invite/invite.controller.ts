import { FastifyReply, FastifyRequest } from "fastify";
import { createInvite } from "./invite.service";
import { CreateInviteInput } from "./invite.schema";

export const handleInviteCreate = async (
    req: FastifyRequest<{ Body: CreateInviteInput }>, 
    res: FastifyReply
) => {
    
    const body = req.body;

    try {
        const invite = await createInvite(body);

        return res.code(201).send(invite);
    } catch (err) {
        console.log(err);
        return res.code(401).send(err);
    }
}