import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../utils/prisma";

export async function authorizeDiscordOwnership(req: FastifyRequest, reply: FastifyReply) {
    const userFromToken = req.user as { id: number };

    let requestedDiscordId: string | undefined;

    if (req.params && (req.params as any).discord_id) {
        requestedDiscordId = (req.params as any).discord_id;
    } else if (req.body && (req.body as any).discord_id) {
        requestedDiscordId = (req.body as any).discord_id;
    } else {
        const data = await req.file();
        if (data && data.fields.discord_id) {
            requestedDiscordId = (data.fields.discord_id as any).value;
        }
    }

    if (!requestedDiscordId) return;

    const validMatch = await prisma.users.findFirst({
        where: {
            id: userFromToken.id,
            discord_id: requestedDiscordId
        }
    });

    if (!validMatch) {
        console.error(`[Security Warning] Usuário ID:${userFromToken.id} tentou agir sobre Discord:${requestedDiscordId}`);
        return reply.status(403).send({ 
            error: "Forbidden", 
            message: "Você não tem permissão para alterar dados de outra conta." 
        });
    }
}

export async function authorizeUserIdentity(req: FastifyRequest, reply: FastifyReply) {
    const userFromToken = req.user as { id: number };
    const targetId = Number((req.params as any).id);

    if (targetId && userFromToken.id !== targetId) {
        return reply.status(403).send({ 
            error: "Forbidden", 
            message: "Você só pode modificar o seu próprio perfil." 
        });
    }
}