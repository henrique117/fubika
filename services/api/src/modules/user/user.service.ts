import IPlayer from "../../interfaces/player.interface";
import IScore from "../../interfaces/score.interface";
import { getModString } from "../../utils/getModString";
import { hashPassword, verifyPassword } from "../../utils/hash";
import prisma from "../../utils/prisma";
import { checkInvite, useInvite } from "../invite/invite.service";
import { ensureBeatmapsCache } from "../beatmap/beatmap.service";
import { CreateUserInput, LoginUserInput, PostPfpInput, ScoreQueryInput, ScoreQueryModeInput } from "./user.schema";
import { ptBR } from "date-fns/locale";
import { formatDistance } from "date-fns";
import { calculateLevel } from "../../utils/level";
import path from "path";
import { pipeline } from "stream/promises";
import fs from "fs";
import { Errors } from "../../utils/errorHandler";

const toSafeName = (name: string): string => {
    return name.trim().toLowerCase().replace(/ /g, '_');
}

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

const formatScoreData = (row: any, cache?: any): Omit<IScore, 'player'> => {
    return {
        id: Number(row.score_id),
        score: Number(row.score_val),
        pp: row.score_pp || 0,
        acc: row.score_acc,
        max_combo: row.max_combo,
        mods_int: row.mods,
        mods: getModString(row.mods),
        n300: row.n300,
        n100: row.n100,
        n50: row.n50,
        nmiss: row.nmiss,
        grade: row.grade,
        perfect: Boolean(row.perfect),
        play_time: row.play_time,
        
        beatmap: {
            artist: row.map_artist || 'Artista Desconhecido',
            beatmap_id: Number(row.map_id) || 0,
            beatmapset_id: Number(row.map_set_id) || 0,
            beatmap_md5: row.map_md5,
            title: row.map_title || 'Sem Título',
            mode: row.mode,
            mode_int: row.mode,
            status: row.map_status || 0,
            total_length: row.map_total_length || 0,
            author_id: 0,
            author_name: row.map_creator || 'Desconhecido',
            cover: cache?.cover || '',
            thumbnail: cache?.thumbnail || '',
            diff: row.map_diff_name || 'Normal',
            star_rating: row.map_sr || 0,
            bpm: row.map_bpm || 0,
            od: row.map_od || 0,
            ar: row.map_ar || 0,
            cs: row.map_cs || 0,
            hp: row.map_hp || 0,
            max_combo: row.map_max_combo || 0,
            count_circles: 0,
            count_sliders: 0,
            passcount: row.map_passes || 0,
            playcount: row.map_plays || 0
        }
    };
};

const populateScoresWithCache = async (rawScores: any[]): Promise<Omit<IScore, 'player'>[]> => {
    if (!rawScores || rawScores.length === 0) return [];

    const mapIds = Array.from(new Set(rawScores.map(r => Number(r.map_id))));
    
    await ensureBeatmapsCache(mapIds);

    const cachedData = await prisma.api_beatmap_cache.findMany({
        where: { map_id: { in: mapIds } }
    });

    const cacheMap = new Map(cachedData.map(c => [c.map_id, c]));

    return rawScores.map(row => formatScoreData(row, cacheMap.get(Number(row.map_id))));
};

export const getPlayerPlaycount = async (player_id: number): Promise<number> => {
    const playcount = await prisma.scores.count({
        where: { userid: player_id }
    })
    return playcount;
}

export const createUser = async (input: CreateUserInput) => {
    const { password, name, email, key } = input;
    const isValidKey = await checkInvite(key);
    
    if (!isValidKey) {
        throw Errors.BadRequest('O código de convite é inválido ou já foi utilizado.');
    }

    const safeName = toSafeName(name);
    const hash = await hashPassword(password);

    let user_priv = 1;
    if (key === "FIRSTINVITE") user_priv = 31879;

    const user = await prisma.users.create({
        data: {
            name: name,
            email: email,
            pw_bcrypt: hash,
            safe_name: safeName,
            country: 'BR',
            priv: user_priv,
            creation_time: Math.floor(Date.now() / 1000),
            latest_activity: Math.floor(Date.now() / 1000),
            is_admin: user_priv > 1,
            is_dev: user_priv > 1
        }
    });

    if (key !== "FIRSTINVITE") await useInvite({ code: key, id: user.id });
    await createUserStats(user.id);

    return { user };
}

export const loginUser = async (input: LoginUserInput): Promise<IPlayer> => {
    const { name, password } = input;
    const safeName = toSafeName(name);

    const user = await prisma.users.findUnique({
        where: { safe_name: safeName }
    });

    if (!user) {
        throw Errors.Unauthorized('Usuário ou senha inválidos.');
    }

    const isPasswordValid = await verifyPassword(password, user.pw_bcrypt);
    if (!isPasswordValid) {
        throw Errors.Unauthorized('Usuário ou senha inválidos.');
    }
    
    if ((user.priv & 1) === 0) {
        throw Errors.Forbidden('Esta conta está restrita ou banida.');
    }

    return await getUserStats({ id: user.id }, 0);
}

export const createUserStats = async (playerId: number): Promise<void> => {
    const modes = [0, 1, 2, 3, 4, 5, 6, 8];
    const statsData = modes.map(mode => ({
        id: playerId,
        mode: mode,
        tscore: 0, rscore: 0, pp: 0, acc: 0.0, plays: 0, playtime: 0, max_combo: 0, 
        total_hits: 0, replay_views: 0, xh_count: 0, x_count: 0, sh_count: 0, s_count: 0, a_count: 0
    }));

    await prisma.stats.createMany({ data: statsData });
}

type UserFilter = { id: number } | { discord_id: string } | { safe_name: string };

export const getUserStats = async (filter: UserFilter, mode: number = 0): Promise<IPlayer> => {

    const user = await prisma.users.findUnique({
        where: filter as any
    });

    if (!user) throw Errors.NotFound("Usuário não encontrado.");
    if (user.id < 3) throw Errors.NotFound("Perfil indisponível.");

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

    const topScoresRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, s.score as score_val, s.pp as score_pp, s.acc as score_acc, 
            s.max_combo, s.mods, s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id, m.set_id as map_set_id, m.title as map_title, m.artist as map_artist,
            m.version as map_diff_name, m.creator as map_creator, m.status as map_status, 
            m.total_length as map_total_length, m.bpm as map_bpm, m.cs as map_cs, m.ar as map_ar, 
            m.od as map_od, m.hp as map_hp, m.max_combo as map_max_combo, m.plays as map_plays, 
            m.passes as map_passes, m.diff as map_sr

        FROM scores s
        INNER JOIN maps m ON s.map_md5 = m.md5
        WHERE 
            s.userid = ${playerId} 
            AND s.mode = ${mode}
            AND s.status = 2
            AND s.pp > 0
            AND m.status = 2
        ORDER BY s.pp DESC
        LIMIT 200;
    `;

    const totalScoreNumber = Number(userStats.tscore);

    const populatedScores = await populateScoresWithCache(topScoresRaw);

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
        total_score: totalScoreNumber,
        ranked_score: Number(userStats.rscore),

        level: calculateLevel(totalScoreNumber),

        ss_count: userStats.x_count,
        ssh_count: userStats.xh_count,
        s_count: userStats.s_count,
        sh_count: userStats.sh_count,
        a_count: userStats.a_count,

        last_activity: getLastActivity(user.latest_activity),

        top_200: populatedScores
    };
}

export const getUserRecent = async (filter: UserFilter, input: ScoreQueryInput) => {
    const { mode, limit } = input;
    
    const user = await prisma.users.findUnique({ where: filter as any });
    
    if (!user) throw Errors.NotFound("Usuário não encontrado.");
    if (user.id < 3) throw Errors.NotFound("Perfil indisponível.");

    const recentScoresRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, s.score as score_val, s.pp as score_pp, s.acc as score_acc, 
            s.max_combo, s.mods, s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id, m.set_id as map_set_id, m.title as map_title, m.artist as map_artist,
            m.version as map_diff_name, m.creator as map_creator, m.status as map_status, 
            m.total_length as map_total_length, m.bpm as map_bpm, m.cs as map_cs, m.ar as map_ar, 
            m.od as map_od, m.hp as map_hp, m.max_combo as map_max_combo, m.plays as map_plays, 
            m.passes as map_passes, m.diff as map_sr

        FROM scores s
        INNER JOIN maps m ON s.map_md5 = m.md5
        WHERE 
            s.userid = ${user.id} 
            AND s.mode = ${mode}
        ORDER BY s.play_time DESC
        LIMIT ${limit};
    `;

    return await populateScoresWithCache(recentScoresRaw);
}

export const getUserRankHistory = async (filter: UserFilter, mode: number, days: number) => {
    const user = await prisma.users.findUnique({ where: filter as any });
    
    if (!user) throw Errors.NotFound("Usuário não encontrado.");
    if (user.id < 3) throw Errors.NotFound("Perfil indisponível.");

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const history = await prisma.user_rank_history.findMany({
        where: {
            user_id: user.id,
            mode: mode,
            date: { gte: dateLimit }
        },
        orderBy: { date: 'asc' },
        select: {
            date: true,
            rank: true,
            pp: true
        }
    });

    return history;
}

export const getUserBestOnMap = async (filter: UserFilter, bmap_id: number, input: ScoreQueryModeInput) => {
    const { mode } = input;

    const user = await prisma.users.findUnique({ where: filter as any });
    if (!user) throw Errors.NotFound("Usuário não encontrado.");

    const bestScoreRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, s.score as score_val, s.pp as score_pp, s.acc as score_acc, 
            s.max_combo, s.mods, s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id, m.set_id as map_set_id, m.title as map_title, m.artist as map_artist,
            m.version as map_diff_name, m.creator as map_creator, m.status as map_status, 
            m.total_length as map_total_length, m.bpm as map_bpm, m.cs as map_cs, m.ar as map_ar, 
            m.od as map_od, m.hp as map_hp, m.max_combo as map_max_combo, m.plays as map_plays, 
            m.passes as map_passes, m.diff as map_sr

        FROM scores s
        INNER JOIN maps m ON s.map_md5 = m.md5
        WHERE 
            s.userid = ${user.id} 
            AND m.id = ${bmap_id}
            AND s.mode = ${mode}
            AND s.status = 2
        ORDER BY s.pp DESC, s.score DESC
        LIMIT 1;
    `;

    if (!bestScoreRaw || bestScoreRaw.length === 0) {
        return null;
    }

    const populatedArray = await populateScoresWithCache(bestScoreRaw);
    const scoreWithoutPlayer = populatedArray[0];

    return {
        ...scoreWithoutPlayer,
        player: {
            id: user.id,
            name: user.name,
            safe_name: user.safe_name,
            pfp: `https://a.${process.env.DOMAIN}/${user.id}`,
            rank: 0, pp: 0, acc: 0, a_count: 0, s_count: 0, ss_count: 0, sh_count: 0, ssh_count: 0,
            total_score: 0, ranked_score: 0, max_combo: 0, playtime: 0
        }
    };
}

export const getUsersCount = async () => {
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300;

    const usersCount = await prisma.users.count({
        where: { 
            priv: { gt: 0 }
        }
    });

    const onlineCount = await prisma.users.count({
        where: {
            priv: { gt: 0 },
            latest_activity: {
                gte: fiveMinutesAgo
            }
        }
    });

    return {
        total_users: usersCount,
        online_users: onlineCount
    };
}

export const setUserPfp = async (data: PostPfpInput) => {
    const user = await prisma.users.findFirst({
        where: {
            discord_id: data.discord_id 
        }
    });

    if (!user) {
        throw Errors.NotFound("Usuário não encontrado ou não vinculado.");
    }

    const avatarDir = path.join(process.cwd(), '.data', 'avatars');
    
    if (!fs.existsSync(avatarDir)) {
        fs.mkdirSync(avatarDir, { recursive: true });
    }

    const fileName = `${user.id}.png`;
    const avatarPath = path.join(avatarDir, fileName);

    try {
        await pipeline(
            data.avatar.file,
            fs.createWriteStream(avatarPath)
        );

        const now = new Date();
        fs.utimesSync(avatarPath, now, now);

        return {
            id: user.id,
            name: user.name,
            avatar_url: `https://a.${process.env.DOMAIN || 'bpy.local'}/${user.id}?v=${Date.now()}`
        };

    } catch (err) {
        console.error("Erro no processamento do avatar:", err);
        throw Errors.Internal("Falha ao gravar a imagem de perfil no servidor.");
    }
}