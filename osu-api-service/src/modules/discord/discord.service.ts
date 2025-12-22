import prisma from "../../utils/prisma";
import { sendIngameMessage } from "../../utils/redis";
import { CreateDiscordLink } from "./discord.schema";
import crypto from "crypto";

export const startLinkProcess = async (input: CreateDiscordLink) => {
    const user = await prisma.users.findFirst({
        where: { safe_name: input.osu_name.toLowerCase().replace(/ /g, '_') }
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }
 
    if (user.discord_id) {
        throw new Error("ALREADY_LINKED");
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
        message: "Código enviado no chat do jogo (F8)." 
    };
}