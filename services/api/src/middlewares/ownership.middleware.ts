import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../utils/prisma";
import { Errors } from "../utils/errorHandler";
import { logger } from "../utils/logger";

export async function authorizeDiscordOwnership(req: FastifyRequest, _res: FastifyReply) {
    const userAuth = req.user as { id: number };

    let requestedDiscordId: string | undefined;

    const params = req.params as { discord_id?: string };
    const body = req.body as { discord_id?: string } | undefined;

    if (params?.discord_id) {
        requestedDiscordId = params.discord_id;
    } else if (body?.discord_id) {
        requestedDiscordId = body.discord_id;
    } else if (req.isMultipart()) {
        const data = await req.file();
        const field = data?.fields.discord_id as { value?: string } | undefined;
        if (field?.value) {
            requestedDiscordId = field.value;
        }
    }

    if (!requestedDiscordId) return;

    const validMatch = await prisma.users.findFirst({
        where: {
            id: userAuth.id,
            discord_id: requestedDiscordId,
        },
    });

    if (!validMatch) {
        logger.warn(
            `[Segurança] Tentativa de acesso indevido: User ID ${userAuth.id} -> Discord ID ${requestedDiscordId}`
        );
        throw Errors.Forbidden("Acesso negado. Este Discord ID não pertence à sua conta.");
    }
}
