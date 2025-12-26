import IPlayer from "../../interfaces/player.interface";
import IScore from "../../interfaces/score.interface";
import IBeatmap from "../../interfaces/beatmap.interface";
import { getModString } from "../../utils/getModString";
import { hashPassword, verifyPassword } from "../../utils/hash";
import prisma from "../../utils/prisma";
import osuApiClient from "../../utils/axios";
import { checkInvite, useInvite } from "../invite/invite.service";
import { CreateUserInput, LoginUserInput, ScoreQueryInput, ScoreQueryModeInput } from "./user.schema";
import { ptBR } from "date-fns/locale";
import { formatDistance } from "date-fns";
import { calculateLevel } from "../../utils/level";

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

const mapOsuApiDataToBeatmap = (data: any): Omit<IBeatmap, 'scores'> => {
    return {
        beatmap_id: data.id,
        beatmapset_id: data.beatmapset_id,
        beatmap_md5: data.checksum,
        title: data.beatmapset?.title || 'Sem título', 
        mode: data.mode,
        mode_int: data.mode_int,
        status: data.status,
        total_length: data.total_length,
        author_id: data.user_id, 
        author_name: data.beatmapset?.creator || 'Desconhecido',
        cover: data.beatmapset?.covers?.cover || '',
        thumbnail: data.beatmapset?.covers?.['list@2x'] || '',
        diff: data.version,
        star_rating: data.difficulty_rating,
        bpm: data.bpm,
        od: data.accuracy,
        ar: data.ar,
        cs: data.cs,
        hp: data.drain,
        max_combo: data.max_combo
    };
};

const mapProfileScoreWithApiMap = async (row: any): Promise<Omit<IScore, 'player'>> => {
    let beatmapData: Omit<IBeatmap, 'scores'>;

    try {
        const response = await osuApiClient.get(`/beatmaps/${row.map_id}`);
        
        if (response.data) {
            beatmapData = mapOsuApiDataToBeatmap(response.data);
        } else {
            throw new Error("Dados vazios");
        }
    } catch (error) {
        beatmapData = {
            beatmap_id: row.map_id || 0,
            beatmapset_id: row.map_set_id || 0,
            beatmap_md5: row.map_md5,
            title: 'Mapa não encontrado',
            mode: 'osu',
            mode_int: 0,
            status: 'unknown',
            total_length: 0,
            author_id: 0,
            author_name: 'Desconhecido',
            cover: '',
            thumbnail: '',
            diff: 'Unknown',
            star_rating: 0,
            bpm: 0,
            od: 0,
            ar: 0,
            cs: 0,
            hp: 0,
            max_combo: 0
        };
    }

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
        
        beatmap: beatmapData
    };
};

export const getPlayerPlaycount = async (player_id: number): Promise<number> => {
    const playcount = await prisma.scores.count({
        where: { userid: player_id }
    })
    return playcount;
}

export const createUser = async (input: CreateUserInput) => {
    const { password, name, email, key } = input;
    const isValidKey = await checkInvite(key)
    if (!isValidKey) throw new Error('O Código é inválido');

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
            country: 'br',
            priv: user_priv,
            creation_time: Math.floor(Date.now() / 1000),
            latest_activity: Math.floor(Date.now() / 1000),
            is_admin: user_priv > 1,
            is_dev: user_priv > 1
        }
    })

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

    if (!user) throw new Error('Usuário ou senha inválidos');

    const isPasswordValid = await verifyPassword(password, user.pw_bcrypt);
    if (!isPasswordValid) throw new Error('Usuário ou senha inválidos');
    
    if ((user.priv & 1) === 0) throw new Error('Esta conta está restrita/banida.');

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

    const topScoresRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, 
            s.score as score_val, 
            s.pp as score_pp, 
            s.acc as score_acc, 
            s.max_combo, s.mods, 
            s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id,
            m.set_id as map_set_id,
            m.status

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

    const populatedScores = await Promise.all(
        topScoresRaw.map(row => mapProfileScoreWithApiMap(row))
    );

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
    if (!user) throw new Error("Usuário não encontrado");
    if (user.id < 3) throw new Error("Usuário inválido (Bot ou Bancho)");

    const recentScoresRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, 
            s.score as score_val, 
            s.pp as score_pp, 
            s.acc as score_acc, 
            s.max_combo, s.mods, 
            s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id,
            m.set_id as map_set_id,
            m.title as map_title,
            m.version as map_version,
            m.creator as map_creator,
            m.diff as map_diff,
            m.status as map_status

        FROM scores s
        INNER JOIN maps m ON s.map_md5 = m.md5
        WHERE 
            s.userid = ${user.id} 
            AND s.mode = ${mode}
        ORDER BY s.play_time DESC
        LIMIT ${limit};
    `;

    const populatedScores = await Promise.all(
        recentScoresRaw.map(row => mapProfileScoreWithApiMap(row))
    );

    return populatedScores;
}

export const getUserBestOnMap = async (filter: UserFilter, bmap_id: number, input: ScoreQueryModeInput) => {
    const { mode } = input;

    const user = await prisma.users.findUnique({ where: filter as any });
    if (!user) throw new Error("Usuário não encontrado");

    let mapMd5 = "";

    const localMap = await prisma.maps.findFirst({
        where: { id: bmap_id },
        select: { md5: true }
    });

    if (localMap) {
        mapMd5 = localMap.md5;
    } else {
        try {
            const response = await osuApiClient.get(`/beatmaps/${bmap_id}`);
            if (response.data?.checksum) {
                mapMd5 = response.data.checksum;
            }
        } catch (error) {
            console.error("Erro ao buscar MD5 do mapa na API:", error);
        }
    }

    if (!mapMd5) {
        return null; 
    }

    const bestScoreRaw = await prisma.$queryRaw<any[]>`
        SELECT 
            s.id as score_id, 
            s.score as score_val, 
            s.pp as score_pp, 
            s.acc as score_acc, 
            s.max_combo, s.mods, 
            s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            -- Forçamos o ID do mapa que veio do parâmetro para o mapper usar na API
            ${bmap_id} as map_id,
            
            -- Campos de fallback do banco local (caso o mapper da API falhe)
            m.set_id as map_set_id,
            m.title as map_title,
            m.version as map_version,
            m.creator as map_creator,
            m.diff as map_diff,
            m.status as map_status,
            m.total_length as map_total_length,
            m.bpm as map_bpm,
            m.cs as map_cs, m.ar as map_ar, m.od as map_od, m.hp as map_hp,
            m.max_combo as map_max_combo

        FROM scores s
        LEFT JOIN maps m ON s.map_md5 = m.md5
        WHERE 
            s.userid = ${user.id} 
            AND s.map_md5 = ${mapMd5}
            AND s.mode = ${mode}
            AND s.status = 2 -- Apenas scores passados/rankeados
        ORDER BY s.pp DESC, s.score DESC
        LIMIT 1;
    `;

    if (!bestScoreRaw || bestScoreRaw.length === 0) {
        return null;
    }

    const scoreWithoutPlayer = await mapProfileScoreWithApiMap(bestScoreRaw[0]);

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