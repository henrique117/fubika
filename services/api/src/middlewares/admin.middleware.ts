import { FastifyRequest } from "fastify";
import { Errors } from "../utils/errorHandler";
import prisma from "../utils/prisma";

export async function authorizeAdmin(req: FastifyRequest, _: any) {
    const userAuth = req.user as { id: number };

    const user = await prisma.users.findUnique({
        where: { id: userAuth.id },
        select: { is_admin: true }
    });

    if (!user || !user.is_admin) {
        throw Errors.Forbidden("Acesso negado. Apenas administradores podem realizar esta ação.");
    }
}