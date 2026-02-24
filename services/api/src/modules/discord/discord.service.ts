import prisma from "../../utils/prisma";
import { sendIngameMessage } from "../../utils/redis";
import { CheckDiscordLink, CreateDiscordLink } from "./discord.schema";
import crypto from "crypto";
import { Errors } from "../../utils/errorHandler"; // Importando o padrão novo

export const startLinkProcess = async (input: CreateDiscordLink) => {
    const user = await prisma.users.findFirst({
        where: { safe_name: input.osu_name.trim().toLowerCase().replace(/ /g, '_') }
    });

    if (!user) {
        throw Errors.NotFound("Usuário não encontrado.");
    }

    if (user.discord_id) {
        throw Errors.Conflict("Esta conta já possui um Discord vinculado.");
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    await prisma.$transaction([
        prisma.verification_codes.deleteMany({
            where: { discord_id: input.discord_id }
        }),

        prisma.verification_codes.create({
            data: {
                osu_id: user.id,
                discord_id: input.discord_id,
                code: code
            }
        })
    ]);

    await sendIngameMessage(user.id, `Seu código de verificação é: ${code}`);

    return { 
        success: true, 
        message: "Código enviado no chat do jogo (F9)." 
    };
}

export const finishLinkProcess = async (input: CheckDiscordLink) => {
    const code = await prisma.verification_codes.findFirst({
        where: {
            code: input.code
        }
    });

    if (!code || code.discord_id != input.discord_id) {
        throw Errors.BadRequest("O código inserido é inválido ou expirou.");
    }

    await prisma.$transaction([
        prisma.users.update({
            where: { id: code.osu_id },
            data: { discord_id: code.discord_id }
        }),
        prisma.verification_codes.delete({
            where: { id: code.id }
        })
    ]);

    return {
        success: true,
        message: "Conta vinculada com sucesso"
    };
}