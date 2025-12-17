import { randomBytes } from "crypto";
import { CheckInviteInput, CreateInviteInput } from "./invite.schema";
import prisma from "../../utils/prisma";

export const createInvite = async (input: CreateInviteInput) => {

    const user = await prisma.users.findUniqueOrThrow({
        where: { id: input.id },
        select: { is_admin: true }
    });

    if (!user.is_admin) {
        throw new Error('Permissão negada: Apenas administradores podem criar convites.');
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

    const invite = await prisma.invites.create({
        data: {
            code: code,
            expires_at: expirationDate,
            created_by_id: input.id
        }
    });

    return invite;
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

    if (!invite) throw new Error('Código inválido.');
    
    if (invite.used_by_id) {
        throw new Error('Este convite já foi utilizado.');
    }

    if (invite.expires_at < new Date()) {
        throw new Error('Este convite expirou.');
    }

    const updatedInvite = await prisma.invites.update({
        where: { id: invite.id },
        data: {
            used_by_id: input.id
        }
    });

    return updatedInvite;
}