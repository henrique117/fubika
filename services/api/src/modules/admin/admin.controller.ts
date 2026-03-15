import { FastifyReply, FastifyRequest } from "fastify";
import { banPlayer, giveAdminPrivileges } from "./admin.service";
import { TargetUserInput } from "./admin.schema";

export const handleBan = async (
    req: FastifyRequest<{ Body: TargetUserInput }>, 
    res: FastifyReply
) => {
    const result = await banPlayer(req.body);
    return res.status(200).send(result);
};

export const handleGiveAdmin = async (
    req: FastifyRequest<{ Body: TargetUserInput }>, 
    res: FastifyReply
) => {
    const userFromToken = req.user as { id: number };
    const result = await giveAdminPrivileges(userFromToken.id, req.body);
    
    return res.status(200).send(result);
};