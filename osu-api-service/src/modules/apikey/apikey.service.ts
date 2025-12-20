import prisma from "../../utils/prisma";
import { randomBytes } from "crypto";
import { CreateApikeyInput } from "./apikey.schema";

export const createApikey = async (input: CreateApikeyInput) => {

    if (input.id_req != Number(process.env.DISCORD_ID)) {
        throw new Error('Você não tem permissão para gerar chaves da API');
    }

    const target = await prisma.users.findUnique({
        where: {
            discord_id: input.id_target.toString()
        }
    });

    if (!target) {
        throw new Error('Usuário não encontrado');
    }

    const generatedKey = 'fubika_live_' + randomBytes(16).toString('hex');

    const apikey = await prisma.api_keys.create({
        data: {
            name: input.name,
            owner_id: target.id,
            key: generatedKey,
            can_write: false
        }
    });

    return apikey;
}

export const checkApiKey = async (apikey: string) => {
    return await prisma.api_keys.findUnique({
        where: { key: apikey },
        include: {
            user: true
        }
    });
}