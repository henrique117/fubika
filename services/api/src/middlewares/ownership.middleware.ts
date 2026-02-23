import { FastifyRequest } from "fastify";
import prisma from "../utils/prisma";
import { Errors } from "../utils/errorHandler";

export async function authorizeDiscordOwnership(req: FastifyRequest, _: any) {
    const userAuth = req.user as { id: number };

    let requestedDiscordId: string | undefined;

    if (req.params && (req.params as any).discord_id) {
        requestedDiscordId = (req.params as any).discord_id;
    } else if (req.body && (req.body as any).discord_id) {
        requestedDiscordId = (req.body as any).discord_id;
    } else if (req.isMultipart()) {
        const data = await req.file();
        if (data && data.fields.discord_id) {
            requestedDiscordId = (data.fields.discord_id as any).value;
        }
    }

    if (!requestedDiscordId) return;

    const validMatch = await prisma.users.findFirst({
        where: {
            id: userAuth.id,
            discord_id: requestedDiscordId
        }
    });

    if (!validMatch) {
        console.warn(`[Segurança] Tentativa de acesso indevido: User ID ${userAuth.id} -> Discord ID ${requestedDiscordId}`);
        throw Errors.Forbidden("Acesso negado. Este Discord ID não pertence à sua conta.");
    }
}

export async function authorizeUserIdentity(req: FastifyRequest, _: any) {
    const userAuth = req.user as { id: number };
    const targetId = Number((req.params as any).id);

    if (targetId && userAuth.id !== targetId) {
        throw Errors.Forbidden("Acesso negado. Só pode realizar esta acção na sua própria conta.");
    }
}