import IPlayer from "../../interfaces/player.interface";
import IScore from "../../interfaces/score.interface";
import IBeatmap from "../../interfaces/beatmap.interface";
import { getModString } from "../../utils/getModString";
import { hashPassword, verifyPassword } from "../../utils/hash";
import prisma from "../../utils/prisma";
import axios from "axios";
import osuApiClient from "../../utils/axios";
import { checkInvite, useInvite } from "../invite/invite.service";
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

const mapOsuApiDataToBeatmap = (data: any): Omit<IBeatmap, 'scores'> => {
    return {
        artist: data.artist || data.beatmapset?.artist || 'Artista desconhecido',
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
        max_combo: data.max_combo,
        count_circles: data.count_circles,
        count_sliders: data.count_sliders,
        passcount: data.passcount,
        playcount: data.playcount
    };
};

const mapStatusIntToString = (status: number): string => {
    switch (status) {
        case 2:
            return 'ranked';
        case 3:
            return 'approved';
        case 4:
            return 'qualified';
        case 5:
            return 'loved';
        case 0:
            return 'pending';
        case -1:
        case -2:
            return 'graveyard';
        default:
            return 'ranked';
    }
};

const mapLocalRowToBeatmap = (row: any): Omit<IBeatmap, 'scores'> => {
    const fallbackSetId = Number(row.map_set_id || 0);
    return {
        artist: row.map_artist || row.artist || 'Artista Desconhecido',
        beatmap_id: Number(row.map_id || 0),
        beatmapset_id: fallbackSetId,
        beatmap_md5: row.map_md5,
        title: row.map_title || 'Mapa não encontrado',
        mode: 'osu',
        mode_int: Number(row.mode || 0),
        status: mapStatusIntToString(Number(row.map_status ?? 2)),
        total_length: Number(row.map_total_length || 0),
        author_id: 0,
        author_name: row.map_creator || 'Desconhecido',
        cover: fallbackSetId > 0 ? `https://assets.ppy.sh/beatmaps/${fallbackSetId}/covers/cover.jpg` : '',
        thumbnail: fallbackSetId > 0 ? `https://assets.ppy.sh/beatmaps/${fallbackSetId}/covers/list@2x.jpg` : '',
        diff: row.map_version || 'Unknown',
        star_rating: Number(row.map_diff || 0),
        bpm: Number(row.map_bpm || 0),
        od: Number(row.map_od || 0),
        ar: Number(row.map_ar || 0),
        cs: Number(row.map_cs || 0),
        hp: Number(row.map_hp || 0),
        max_combo: Number(row.map_max_combo || 0),
        count_circles: 0,
        count_sliders: 0,
        passcount: 0,
        playcount: 0
    };
};

const mapCatboyDataToBeatmap = (data: any): Omit<IBeatmap, 'scores'> => {
    const parentSet = data.set || {};
    const setId = Number(data.beatmapset_id || parentSet.id || 0);
    return {
        artist: parentSet.artist || data.artist || 'Artista Desconhecido',
        beatmap_id: Number(data.id || 0),
        beatmapset_id: setId,
        beatmap_md5: data.checksum || '',
        title: parentSet.title || data.title || 'Sem título',
        mode: data.mode || 'osu',
        mode_int: Number(data.mode_int || 0),
        status: data.status || 'ranked',
        total_length: Number(data.total_length || 0),
        author_id: Number(parentSet.user_id || data.user_id || 0),
        author_name: parentSet.creator || 'Desconhecido',
        cover: setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg` : '',
        thumbnail: setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg` : '',
        diff: data.version || 'Normal',
        star_rating: Number(data.difficulty_rating || 0),
        bpm: Number(data.bpm || parentSet.bpm || 0),
        od: Number(data.accuracy || 0),
        ar: Number(data.ar || 0),
        cs: Number(data.cs || 0),
        hp: Number(data.drain || 0),
        max_combo: Number(data.max_combo || 0),
        count_circles: Number(data.count_circles || 0),
        count_sliders: Number(data.count_sliders || 0),
        passcount: Number(data.passcount || 0),
        playcount: Number(data.playcount || 0)
    };
};

const persistResolvedBeatmap = async (bmap: Omit<IBeatmap, 'scores'>) => {
    const bId = Number(bmap.beatmap_id);
    if (!bId || bId <= 0) return;

    try {
        const cleanArtist = (bmap.artist || 'Artista Desconhecido').slice(0, 128);
        const cleanTitle = (bmap.title || 'Sem título').slice(0, 128);
        const cleanCreator = (bmap.author_name || 'Desconhecido').slice(0, 19);
        const cleanVersion = (bmap.diff || 'Normal').slice(0, 128);
        const filename = `${cleanArtist} - ${cleanTitle} (${cleanCreator}) [${cleanVersion}].osu`.slice(0, 256);

        await prisma.maps.upsert({
            where: { id: bId },
            create: {
                id: bId,
                set_id: Number(bmap.beatmapset_id) || 0,
                status: 2,
                md5: bmap.beatmap_md5 || '',
                artist: cleanArtist,
                title: cleanTitle,
                version: cleanVersion,
                creator: cleanCreator,
                filename: filename,
                last_update: new Date(),
                total_length: Number(bmap.total_length) || 0,
                max_combo: Number(bmap.max_combo) || 0,
                mode: Number(bmap.mode_int) || 0,
                bpm: Number(bmap.bpm) || 0,
                cs: Number(bmap.cs) || 0,
                ar: Number(bmap.ar) || 0,
                od: Number(bmap.od) || 0,
                hp: Number(bmap.hp) || 0,
                diff: Number(bmap.star_rating) || 0
            },
            update: {
                set_id: Number(bmap.beatmapset_id) || 0,
                artist: cleanArtist,
                title: cleanTitle,
                version: cleanVersion,
                creator: cleanCreator,
                total_length: Number(bmap.total_length) || 0,
                max_combo: Number(bmap.max_combo) || 0,
                bpm: Number(bmap.bpm) || 0,
                cs: Number(bmap.cs) || 0,
                ar: Number(bmap.ar) || 0,
                od: Number(bmap.od) || 0,
                hp: Number(bmap.hp) || 0,
                diff: Number(bmap.star_rating) || 0
            }
        });
    } catch {
        // Ignora silenciosamente para não interromper a resposta da API
    }
};

const resolveBeatmapWithCascade = async (row: any): Promise<Omit<IBeatmap, 'scores'>> => {
    const hasValidLocal = Boolean(
        row.map_title &&
        row.map_title !== 'Mapa não encontrado' &&
        row.map_title !== 'Sem título'
    );

    if (hasValidLocal) {
        return mapLocalRowToBeatmap(row);
    }

    const mapId = Number(row.map_id || 0);
    const mapMd5 = row.map_md5;

    // --- PLANO A: osu!api oficial (v2) ---
    if (mapId > 0) {
        try {
            const response = await osuApiClient.get(`/beatmaps/${mapId}`);
            if (response.data && (response.data.title || response.data.beatmapset?.title)) {
                const bmap = mapOsuApiDataToBeatmap(response.data);
                persistResolvedBeatmap(bmap);
                return bmap;
            }
        } catch {
            // Falha no Plano A, avança para o Plano B
        }
    }

    // --- PLANO B: Catboy v2 Mirror (suporte a ID e MD5) ---
    try {
        const catboyHeaders = { 'User-Agent': 'Fubika/1.0 (Web API; osu! private server)' };
        let catboyUrl: string | null = null;
        if (mapId > 0) {
            catboyUrl = `https://catboy.best/api/v2/b/${mapId}`;
        } else if (mapMd5) {
            catboyUrl = `https://catboy.best/api/v2/md5/${mapMd5}`;
        }

        if (catboyUrl) {
            const catboyRes = await axios.get(catboyUrl, {
                headers: catboyHeaders,
                timeout: 5000
            });
            if (catboyRes.data && (catboyRes.data.id || catboyRes.data.checksum)) {
                const bmap = mapCatboyDataToBeatmap(catboyRes.data);
                persistResolvedBeatmap(bmap);
                return bmap;
            }
        }
    } catch {
        // Falha no Plano B, avança para o Plano C
    }

    // --- PLANO C: Sayobot Mirror ---
    try {
        if (mapId > 0) {
            const sayoRes = await axios.get(`https://api.sayobot.cn/v2/beatmapinfo?K=${mapId}`, {
                timeout: 5000
            });
            if (sayoRes.data?.data) {
                const sData = sayoRes.data.data;
                const bmap: Omit<IBeatmap, 'scores'> = {
                    artist: sData.artist || 'Artista Desconhecido',
                    beatmap_id: Number(sData.bid || mapId),
                    beatmapset_id: Number(sData.sid || 0),
                    beatmap_md5: mapMd5 || '',
                    title: sData.title || 'Sem título',
                    mode: 'osu',
                    mode_int: 0,
                    status: 'ranked',
                    total_length: Number(sData.length || 0),
                    author_id: 0,
                    author_name: sData.creator || 'Desconhecido',
                    cover: sData.sid ? `https://assets.ppy.sh/beatmaps/${sData.sid}/covers/cover.jpg` : '',
                    thumbnail: sData.sid ? `https://assets.ppy.sh/beatmaps/${sData.sid}/covers/list@2x.jpg` : '',
                    diff: sData.version || 'Normal',
                    star_rating: Number(sData.star || 0),
                    bpm: Number(sData.bpm || 0),
                    od: Number(sData.od || 0),
                    ar: Number(sData.ar || 0),
                    cs: Number(sData.cs || 0),
                    hp: Number(sData.hp || 0),
                    max_combo: Number(sData.maxcombo || 0),
                    count_circles: 0,
                    count_sliders: 0,
                    passcount: 0,
                    playcount: 0
                };
                persistResolvedBeatmap(bmap);
                return bmap;
            }
        }
    } catch {
        // Falha no Plano C
    }

    // --- FALLBACK FINAL: Retorna fallback local sem omitir o score ---
    return mapLocalRowToBeatmap(row);
};

const mapProfileScoreWithApiMap = async (row: any): Promise<Omit<IScore, 'player'>> => {
    const beatmapData = await resolveBeatmapWithCascade(row);

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
        total_hits: 0, replay_views: 0,
        x_count: 0, xh_count: 0, s_count: 0, sh_count: 0, a_count: 0
    };

    const rank = await prisma.stats.count({
        where: {
            mode: mode,
            pp: { gt: userStats.pp }
        }
    }) + 1;

    const normalizedCountry = user.country ? user.country.trim().toLowerCase() : '';
    const hasValidState = normalizedCountry.length === 2 && normalizedCountry !== 'xx';
    const stateRank = hasValidState && userStats.pp > 0
        ? await prisma.stats.count({
            where: {
                mode: mode,
                pp: { gt: userStats.pp },
                user: {
                    priv: { gt: 0 },
                    country: user.country
                }
            }
        }) + 1
        : null;

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
            m.artist as map_artist,
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

    const rankHistoryRaw = prisma.user_rank_history?.findMany
        ? await prisma.user_rank_history.findMany({
              where: { user_id: playerId, mode },
              orderBy: { date: 'desc' },
              take: 60
          })
        : [];

    const rankHistory = rankHistoryRaw
        .slice()
        .reverse()
        .map(entry => ({
            date: entry.date instanceof Date
                ? entry.date.toISOString().slice(0, 10)
                : String(entry.date),
            rank: entry.rank,
            pp: entry.pp
        }));

    return {
        id: user.id,
        name: user.name,
        safe_name: user.safe_name,
        country: user.country,
        state_rank: stateRank,
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
        total_hits: userStats.total_hits ?? 0,
        replay_views: userStats.replay_views ?? 0,

        level: calculateLevel(totalScoreNumber),

        ss_count: userStats.x_count,
        ssh_count: userStats.xh_count,
        s_count: userStats.s_count,
        sh_count: userStats.sh_count,
        a_count: userStats.a_count,

        last_activity: getLastActivity(user.latest_activity),

        rank_history: rankHistory,
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
            s.id as score_id, 
            s.score as score_val, 
            s.pp as score_pp, 
            s.acc as score_acc, 
            s.max_combo, s.mods, 
            s.n300, s.n100, s.n50, s.nmiss, s.grade, s.perfect, 
            s.play_time, s.map_md5, s.mode, s.status,
            
            m.id as map_id,
            m.set_id as map_set_id,
            m.artist as map_artist,
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
    if (!user) throw Errors.NotFound("Usuário não encontrado.");

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
            console.error("Erro ao buscar MD5 do mapa na API (silenciado para fallback).");
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