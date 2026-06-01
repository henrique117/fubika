import prisma from "../../utils/prisma";
import { randomBytes } from "crypto";
import { CreateApikeyInput } from "./apikey.schema";
import { Errors } from "../../utils/errorHandler";

export const createApikey = async (input: CreateApikeyInput) => {
    const requester = await prisma.users.findUnique({
        where: { discord_id: input.id_req.toString() }
    });

    if (!requester || !requester.is_dev) {
        throw Errors.Forbidden("Você não tem permissão para gerar chaves de API.");
    }

    const target = await prisma.users.findUnique({
        where: { discord_id: input.id_target.toString() }
    });

    if (!target) {
        throw Errors.NotFound("Usuário de destino não encontrado.");
    }

    const generatedKey = 'fubika_live_' + randomBytes(16).toString('hex');

    return await prisma.api_keys.create({
        data: {
            name: input.name,
            owner_id: target.id,
            key: generatedKey,
            can_write: false
        }
    });
};

export const checkApiKey = async (apikey: string) => {
    return await prisma.api_keys.findUnique({
        where: { key: apikey },
        include: {
            user: true
        }
    });
};