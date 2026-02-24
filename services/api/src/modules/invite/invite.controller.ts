import { FastifyReply, FastifyRequest } from "fastify";
import { createInvite } from "./invite.service";
import { CreateInviteInput } from "./invite.schema";

export const handleInviteCreate = async (
    req: FastifyRequest<{ Body: CreateInviteInput }>, 
    res: FastifyReply
) => {
    const invite = await createInvite(req.body);

    return res.code(201).send(invite);
};