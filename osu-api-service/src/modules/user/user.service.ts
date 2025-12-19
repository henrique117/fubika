import { hashPassword, verifyPassword } from "../../utils/hash";
import prisma from "../../utils/prisma";
import { checkInvite, useInvite } from "../invite/invite.service";
import { CreateUserInput, LoginUserInput } from "./user.schema";

export const createUser = async (input: CreateUserInput) => {

    const { password, name, email, key } = input;

    const isValidKey = await checkInvite(key)

    if (!isValidKey) {
        throw new Error('O Código é inválido');
    }

    const safeName = toSafeName(name);
    const hash = await hashPassword(password);

    const user = await prisma.users.create({
        data: {
            name: safeName,
            email: email,
            pw_bcrypt: hash,
            safe_name: safeName,
            country: 'br',
            priv: 1,
            creation_time: Math.floor(Date.now() / 1000),
            latest_activity: Math.floor(Date.now() / 1000),
        }
    })

    const usedKey = await useInvite({ code: key, id: user.id });

    await createUserStats(user.id);

    return {user, usedKey};
}

export const loginUser = async (input: LoginUserInput) => {
    const { name, password } = input;

    const safeName = toSafeName(name);

    const user = await prisma.users.findUnique({
        where: { safe_name: safeName }
    });

    if (!user) {
        throw new Error('Usuário ou senha inválidos');
    }

    const isPasswordValid = await verifyPassword(password, user.pw_bcrypt);

    if (!isPasswordValid) {
        throw new Error('Usuário ou senha inválidos');
    }

    if ((user.priv & 1) === 0) {
        throw new Error('Esta conta está restrita/banida.');
    }

    return user;
}

export const createUserStats = async (playerId: number): Promise<void> => {
    
    const modes = [0, 1, 2, 3, 4, 5, 6, 8];

    const statsData = modes.map(mode => ({
        id: playerId,
        mode: mode,
        tscore: 0,
        rscore: 0,
        pp: 0,
        acc: 0.0,
        plays: 0,
        playtime: 0,
        max_combo: 0,
        total_hits: 0,
        replay_views: 0,
        xh_count: 0,
        x_count: 0,
        sh_count: 0,
        s_count: 0,
        a_count: 0
    }));

    await prisma.stats.createMany({
        data: statsData
    });
}

const toSafeName = (name: string): string => {
    return name.trim().toLowerCase().replace(/ /g, '_');
}