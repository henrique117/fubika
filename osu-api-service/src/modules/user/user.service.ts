import IPlayer from "../../interfaces/player.interface";
import IScore from "../../interfaces/score.interface";
import { getModString } from "../../utils/getModString";
import { hashPassword, verifyPassword } from "../../utils/hash";
import prisma from "../../utils/prisma";
import { checkInvite, useInvite } from "../invite/invite.service";
import { CreateUserInput, LoginUserInput } from "./user.schema";
import { ptBR } from "date-fns/locale";
import { formatDistance } from "date-fns";
import { calculateLevel } from "../../utils/level";

const toSafeName = (name: string): string => {
    return name.trim().toLowerCase().replace(/ /g, '_');
}

const mapProfileScore = (row: any): Omit<IScore, 'player'> => {
    return {
        id: Number(row.id),
        score: Number(row.score),
        pp: row.pp,
        acc: row.acc,
        max_combo: row.max_combo,
        mods_int: row.mods,
        mods: getModString(row.mods),
        n300: row.n300,
        n100: row.n100,
        n50: row.n50,
        nmiss: row.nmiss,
        grade: row.grade,
        perfect: Boolean(row.perfect),
        map_md5: row.map_md5,
    };
};

export const getLastActivity = (unixTimestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - unixTimestamp;
    
    if (diff < 300) {
        return "Online";
    }

    const date = new Date(unixTimestamp * 1000);

    return formatDistance(date, new Date(), { 
        addSuffix: true,
        locale: ptBR 
    });
}

export const getPlayerPlaycount = async (player_id: number): Promise<number> => {
    const playcount = await prisma.scores.count({
        where: {
            userid: player_id
        }
    })
    
    return playcount;
}

export const createUser = async (input: CreateUserInput) => {

    const { password, name, email, key } = input;

    const isValidKey = await checkInvite(key)

    if (!isValidKey) {
        throw new Error('O Código é inválido');
    }

    const safeName = toSafeName(name);
    const hash = await hashPassword(password);

    let user_priv = false;
    let user_priv_int = 1;

    if (key === "FIRSTINVITE") {
        user_priv = true;
        user_priv_int = 31879;
    }

    const user = await prisma.users.create({
        data: {
            name: safeName,
            email: email,
            pw_bcrypt: hash,
            safe_name: safeName,
            country: 'br',
            priv: user_priv_int,
            creation_time: Math.floor(Date.now() / 1000),
            latest_activity: Math.floor(Date.now() / 1000),
            is_admin: user_priv,
            is_dev: user_priv
        }
    })

    const usedKey = await useInvite({ code: key, id: user.id });

    await createUserStats(user.id);

    return { user, usedKey };
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

type UserFilter = { id: number } | { discord_id: string };

export const getUserStats = async (filter: UserFilter, mode: number = 0): Promise<IPlayer> => {

    const user = await prisma.users.findUnique({
        where: filter as any
    });

    if (!user) throw new Error("Usuário não encontrado");
    
    if (user.id < 3) throw new Error("Usuário inválido (Bot ou Bancho)");

    const playerId = user.id;

    const stats = await prisma.stats.findUnique({
        where: { 
            id_mode: { id: playerId, mode: mode } 
        }
    });

    const userStats = stats || {
        pp: 0, acc: 0, tscore: 0n, rscore: 0n, 
        max_combo: 0, playtime: 0, 
        x_count: 0, xh_count: 0, s_count: 0, sh_count: 0, a_count: 0
    };

    const rank = await prisma.stats.count({
        where: {
            mode: mode,
            pp: { gt: userStats.pp }
        }
    }) + 1;

    const topScoresRaw = await prisma.scores.findMany({
        where: {
            userid: playerId,
            mode: mode,
            status: 2,
            pp: { gt: 0 }
        },
        orderBy: [
            { pp: 'desc' },
            { score: 'desc' }
        ],
        take: 100
    });

    const totalScoreNumber = Number(userStats.tscore);

    return {
        id: user.id,
        name: user.name,
        safe_name: user.safe_name,
        pfp: `https://a.${process.env.DOMAIN}/${user.id}`,
        banner: `https://assets.ppy.sh/user-profile-covers/${user.id}.jpg`,
        
        rank: rank,
        pp: userStats.pp,
        acc: userStats.acc,
        
        playtime: userStats.playtime,
        playcount: await getPlayerPlaycount(user.id),
        max_combo: userStats.max_combo,
        total_score: Number(userStats.tscore),
        ranked_score: Number(userStats.rscore),

        level: calculateLevel(totalScoreNumber),

        ss_count: userStats.x_count,
        ssh_count: userStats.xh_count,
        s_count: userStats.s_count,
        sh_count: userStats.sh_count,
        a_count: userStats.a_count,

        last_activity: getLastActivity(user.latest_activity),

        top_100: topScoresRaw.map(mapProfileScore)
    };
}