import prisma from "../../utils/prisma";
import { Errors } from "../../utils/errorHandler";
import { TargetUserInput } from "./admin.schema";

export const banPlayer = async (input: TargetUserInput) => {
    const target = await prisma.users.findUnique({
        where: { id: input.target_id }
    });

    if (!target) {
        throw Errors.NotFound("Usuário não encontrado.");
    }

    if (target.id === 1 || target.id === 3) {
        throw Errors.Forbidden("Ação negada: Não podes banir o sistema ou o dono do servidor.");
    }

    await prisma.users.update({
        where: { id: target.id },
        data: { priv: 0 }
    });

    return { 
        success: true, 
        message: `O jogador ${target.name} foi banido com sucesso.` 
    };
};

export const giveAdminPrivileges = async (requesterId: number, input: TargetUserInput) => {
    const requester = await prisma.users.findUnique({
        where: { id: requesterId }
    });

    const ownerDiscordId = process.env.OWNER_DISCORD_ID || "520994132458471438";

    if (!requester || requester.discord_id !== ownerDiscordId) {
        throw Errors.Forbidden("Acesso negado: Apenas o dono do servidor (via Discord) pode promover admins.");
    }

    const target = await prisma.users.findUnique({
        where: { id: input.target_id }
    });

    if (!target) {
        throw Errors.NotFound("Usuário alvo não encontrado.");
    }

    await prisma.users.update({
        where: { id: target.id },
        data: {
            priv: 1048575,
            is_admin: true,
            is_dev: true
        }
    });

    return { 
        success: true, 
        message: `Sucesso! O jogador ${target.name} agora é um Administrador.` 
    };
};