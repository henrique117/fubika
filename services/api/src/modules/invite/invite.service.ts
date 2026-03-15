import { randomBytes } from "crypto";
import { CheckInviteInput, CreateInviteInput } from "./invite.schema";
import prisma from "../../utils/prisma";
import { Errors } from "../../utils/errorHandler";

export const createInvite = async (input: CreateInviteInput) => {
    let user;

    if (typeof input.id === "number") {
        user = await prisma.users.findUnique({
            where: { id: input.id },
            select: { is_admin: true, id: true }
        });
    } else {
        user = await prisma.users.findUnique({
            where: { discord_id: input.id },
            select: { is_admin: true, id: true }
        });
    }

    if (!user || !user.is_admin) {
        throw Errors.Forbidden('Permissão negada: Apenas administradores podem criar convites.');
    }

    let code: string = '';
    let isUnique: boolean = false;

    while (!isUnique) {
        code = randomBytes(7).toString('hex').toUpperCase();

        const existingCode = await prisma.invites.findUnique({
            where: {
                code: code
            }
        });

        if (!existingCode) {
            isUnique = true;
        }
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    return await prisma.invites.create({
        data: {
            code: code,
            expires_at: expirationDate,
            created_by_id: user.id
        }
    });
}

export const checkInvite = async (input: string) => {
    const invite = await prisma.invites.findUnique({
        where: { code: input }
    });

    if (!invite || invite.used_by_id || invite.expires_at < new Date()) {
        return false;
    }

    return true;
}

export const useInvite = async (input: CheckInviteInput) => {
    const invite = await prisma.invites.findUnique({
        where: { code: input.code }
    });

    if (!invite) {
        throw Errors.NotFound('Código de convite inválido.');
    }
    
    if (invite.used_by_id) {
        throw Errors.Conflict('Este convite já foi utilizado.');
    }

    if (invite.expires_at < new Date()) {
        throw Errors.BadRequest('Este convite expirou.');
    }

    const updatedInvite = await prisma.invites.update({
        where: { id: invite.id },
        data: {
            used_by_id: input.id
        }
    });

    return updatedInvite;
}