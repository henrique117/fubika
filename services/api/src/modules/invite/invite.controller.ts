import { FastifyReply, FastifyRequest } from "fastify";
import { createInvite } from "./invite.service";
import { CreateInviteInput } from "./invite.schema";

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[Invite API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleInviteCreate = async (
    req: FastifyRequest<{ Body: CreateInviteInput }>, 
    res: FastifyReply
) => {
    try {
        const invite = await createInvite(req.body);
        return res.code(201).send(invite);
    } catch (err: any) {
        const statusCode = err.message.includes("Permissão negada") ? 401 : 400;
        return sendError(res, statusCode, err.message || "Erro ao gerar código de convite.", err);
    }
}