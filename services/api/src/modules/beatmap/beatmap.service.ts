import prisma from "../../utils/prisma";
import axios from "axios";
import IBeatmap from "../../interfaces/beatmap.interface";
import IBeatmapset from "../../interfaces/beatmapset.interface";
import IScore from "../../interfaces/score.interface";
import osuApiClient from "../../utils/axios";
import { getModString } from "../../utils/getModString";
import { SearchBeatmaps } from "./beatmap.schema";
import { Errors } from "../../utils/errorHandler";

const mapOsuBeatmapToDomain = (data: any): IBeatmap => {
    return {
        artist: data.beatmapset?.artist || 'Desconhecido',
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
        playcount: data.playcount,
        scores: []
    };
};

const mapOsuBeatmapsetToDomain = (data: any): IBeatmapset => {
    return {
        beatmapset_id: data.id,
        playcount: data.play_count,
        artist: data.artist,
        favourite_count: data.favourite_count,
        cover: data.covers?.cover || '',
        thumbnail: data.covers?.['list@2x'] || '',
        author_id: String(data.user_id),
        title: data.title,
        beatmaps: (data.beatmaps || []).map((beatmap: any) => {
            return mapOsuBeatmapToDomain({
                ...beatmap,
                beatmapset: data
            });
        })
    };
};

const mapCatboyBeatmapToDomain = (data: any, setObj?: any): IBeatmap => {
    const parentSet = setObj || data.set || {};
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
        cover: parentSet.covers?.cover || (setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg` : ''),
        thumbnail: parentSet.covers?.['list@2x'] || (setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg` : ''),
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
        playcount: Number(data.playcount || 0),
        scores: []
    };
};

const mapCatboyBeatmapsetToDomain = (data: any): IBeatmapset => {
    const rawDiffs = Array.isArray(data.beatmaps) ? data.beatmaps : [];
    const setId = Number(data.id || 0);
    return {
        beatmapset_id: setId,
        playcount: Number(data.play_count || 0),
        artist: data.artist || 'Artista Desconhecido',
        favourite_count: Number(data.favourite_count || 0),
        cover: data.covers?.cover || (setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg` : ''),
        thumbnail: data.covers?.['list@2x'] || (setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg` : ''),
        author_id: String(data.user_id || 0),
        title: data.title || 'Sem título',
        beatmaps: rawDiffs.map((bm: any) => mapCatboyBeatmapToDomain(bm, data))
    };
};

const mapLocalDbToDomain = (row: any): IBeatmap => {
    const setId = Number(row.set_id || 0);
    return {
        artist: row.artist || 'Artista Desconhecido',
        beatmap_id: Number(row.id || 0),
        beatmapset_id: setId,
        beatmap_md5: row.md5 || '',
        title: row.title || 'Sem título',
        mode: 'osu',
        mode_int: Number(row.mode || 0),
        status: 'ranked',
        total_length: Number(row.total_length || 0),
        author_id: 0,
        author_name: row.creator || 'Desconhecido',
        cover: setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg` : '',
        thumbnail: setId > 0 ? `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg` : '',
        diff: row.version || 'Normal',
        star_rating: Number(row.diff || 0),
        bpm: Number(row.bpm || 0),
        od: Number(row.od || 0),
        ar: Number(row.ar || 0),
        cs: Number(row.cs || 0),
        hp: Number(row.hp || 0),
        max_combo: Number(row.max_combo || 0),
        count_circles: 0,
        count_sliders: 0,
        passcount: Number(row.passes || 0),
        playcount: Number(row.plays || 0),
        scores: []
    };
};

const persistBeatmapRecord = async (bmap: IBeatmap) => {
    if (!bmap.beatmap_id || bmap.beatmap_id <= 0) return;
    try {
        const cleanArtist = (bmap.artist || 'Artista Desconhecido').slice(0, 128);
        const cleanTitle = (bmap.title || 'Sem título').slice(0, 128);
        const cleanCreator = (bmap.author_name || 'Desconhecido').slice(0, 19);
        const cleanVersion = (bmap.diff || 'Normal').slice(0, 128);
        const filename = `${cleanArtist} - ${cleanTitle} (${cleanCreator}) [${cleanVersion}].osu`.slice(0, 256);

        await prisma.maps.upsert({
            where: { id: bmap.beatmap_id },
            create: {
                id: bmap.beatmap_id,
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
                diff: Number(bmap.star_rating) || 0,
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
                diff: Number(bmap.star_rating) || 0,
            }
        });
    } catch {
        // Ignora silenciosamente para não interromper a resposta
    }
};

const mapDatabaseToScoreWithoutMap = (row: any): Omit<IScore, 'beatmap'> => {
    return {
        id: Number(row.score_id), 
        score: Number(row.score_val),
        pp: row.score_pp || 0,
        acc: row.score_acc,
        mods_int: row.mods,
        mods: getModString(row.mods),
        n300: row.n300,
        n100: row.n100,
        n50: row.n50,
        nmiss: row.nmiss,
        grade: row.grade,
        perfect: Boolean(row.perfect),
        max_combo: row.max_combo,
        play_time: row.play_time,

        player: {
            id: row.userid,
            name: row.name,
            safe_name: row.safe_name,
            rank: 0, 
            pp: row.user_pp || 0,
            acc: row.user_acc || 0,
            pfp: `https://a.${process.env.DOMAIN}/${row.userid}`,
            banner: `https://assets.${process.env.DOMAIN}/user-profile-covers/${row.userid}.jpg`,

            a_count: row.a_count || 0,
            s_count: row.s_count || 0,
            ss_count: row.x_count || 0,
            sh_count: row.sh_count || 0,
            ssh_count: row.xh_count || 0,
            
            level: 0, 

            total_score: Number(row.user_tscore || 0),
            ranked_score: Number(row.user_rscore || 0),
            max_combo: row.user_max_combo || 0,
            playtime: row.playtime || 0,
            playcount: 0
        }
    };
};

const getBeatmapLB = async (beatmapId: number, knownMd5?: string): Promise<Omit<IScore, 'beatmap'>[]> => {
    let bmap_md5 = knownMd5;
    
    if (!bmap_md5) {
        const localMap = await prisma.maps.findFirst({
            where: { id: beatmapId },
            select: { md5: true }
        });

        if (localMap && localMap.md5) {
            bmap_md5 = localMap.md5;
        } else {
            try {
                const response = await osuApiClient.get(`/beatmaps/${beatmapId}`);
                if (response.data && response.data.checksum) {
                    bmap_md5 = response.data.checksum;
                }
            } catch {
                try {
                    const catboyRes = await axios.get(`https://catboy.best/api/v2/b/${beatmapId}`, {
                        headers: { 'User-Agent': 'Fubika/1.0 (Web API; osu! private server)' },
                        timeout: 5000
                    });
                    if (catboyRes.data?.checksum) {
                        bmap_md5 = catboyRes.data.checksum;
                    }
                } catch {
                    return [];
                }
            }
        }
    }

    if (!bmap_md5) return [];

    const mapLBRaw = await prisma.$queryRaw<any[]>`
        WITH RankedScores AS (
            SELECT 
                s.id as score_id,
                s.userid,
                s.score as score_val,
                s.pp as score_pp,
                s.acc as score_acc,
                s.max_combo,
                s.mods,
                s.n300, s.n100, s.n50, s.nmiss,
                s.grade,
                s.perfect,
                s.map_md5,
                s.mode, 
                s.play_time,
                ROW_NUMBER() OVER (
                    PARTITION BY s.userid 
                    ORDER BY s.score DESC
                ) as rn
            FROM scores s
            WHERE s.map_md5 = ${bmap_md5} AND (s.status = 2 OR s.status = 3) AND (s.mods & 536870912) > 0
        )
        SELECT 
            rs.*,
            u.name, 
            u.safe_name,
            u.latest_activity as last_activity,
            
            st.pp as user_pp,
            st.acc as user_acc,
            st.tscore as user_tscore,
            st.rscore as user_rscore,
            st.max_combo as user_max_combo,
            st.playtime,
            st.x_count, st.xh_count, st.s_count, st.sh_count, st.a_count

        FROM RankedScores rs
        JOIN users u ON rs.userid = u.id
        LEFT JOIN stats st ON u.id = st.id AND st.mode = rs.mode
        WHERE rs.rn = 1 
        ORDER BY rs.score_val DESC
        LIMIT 50;
    `;

    if (!mapLBRaw || mapLBRaw.length === 0) {
        return [];
    }

    return mapLBRaw.map((row) => mapDatabaseToScoreWithoutMap(row));
}

const getBeatmapPlaycount = async (md5: string): Promise<number> => {
    return await prisma.scores.count({
        where: { map_md5: md5 }
    });
};

const getBeatmapPasscount = async (md5: string): Promise<number> => {
    return await prisma.scores.count({
        where: { 
            map_md5: md5,
            grade: { not: 'F' }
        }
    });
};

export const getBeatmap = async (input: SearchBeatmaps): Promise<IBeatmap> => {
    let bmap: IBeatmap | null = null;
    const beatmapId = Number(input.id);

    // 0. Cache / Banco Local MySQL
    const localRow = await prisma.maps.findFirst({
        where: { id: beatmapId }
    });
    if (localRow && localRow.title && localRow.title !== 'Mapa não encontrado') {
        bmap = mapLocalDbToDomain(localRow);
    }

    // --- PLANO A: osu!api oficial (v2) ---
    if (!bmap) {
        try {
            const response = await osuApiClient.get(`/beatmaps/${beatmapId}`);
            if (response.data && (response.data.title || response.data.beatmapset?.title)) {
                bmap = mapOsuBeatmapToDomain(response.data);
                persistBeatmapRecord(bmap);
            }
        } catch {
            // Segue para Plano B
        }
    }

    // --- PLANO B: Catboy v2 Mirror ---
    if (!bmap) {
        try {
            const catboyHeaders = { 'User-Agent': 'Fubika/1.0 (Web API; osu! private server)' };
            const catboyRes = await axios.get(`https://catboy.best/api/v2/b/${beatmapId}`, {
                headers: catboyHeaders,
                timeout: 6000
            });
            if (catboyRes.data && (catboyRes.data.id || catboyRes.data.checksum)) {
                bmap = mapCatboyBeatmapToDomain(catboyRes.data);
                persistBeatmapRecord(bmap);
            }
        } catch {
            // Segue para Plano C
        }
    }

    // --- PLANO C: Sayobot Mirror ---
    if (!bmap) {
        try {
            const sayoRes = await axios.get(`https://api.sayobot.cn/v2/beatmapinfo?K=${beatmapId}`, {
                timeout: 6000
            });
            if (sayoRes.data?.data) {
                const sData = sayoRes.data.data;
                bmap = {
                    artist: sData.artist || 'Artista Desconhecido',
                    beatmap_id: Number(sData.bid || beatmapId),
                    beatmapset_id: Number(sData.sid || 0),
                    beatmap_md5: '',
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
                    playcount: 0,
                    scores: []
                };
                persistBeatmapRecord(bmap);
            }
        } catch {
            // Falha no Plano C
        }
    }

    if (!bmap) {
        throw Errors.NotFound('O beatmap solicitado não foi encontrado.');
    }

    const [map_lb, localPlaycount, localPasscount] = await Promise.all([
        getBeatmapLB(input.id, bmap.beatmap_md5),
        bmap.beatmap_md5 ? getBeatmapPlaycount(bmap.beatmap_md5) : 0,
        bmap.beatmap_md5 ? getBeatmapPasscount(bmap.beatmap_md5) : 0
    ]);

    return { 
        ...bmap,
        playcount: localPlaycount || bmap.playcount || 0,
        passcount: localPasscount || bmap.passcount || 0,
        scores: map_lb 
    };
}

export const getBeatmapset = async (input: SearchBeatmaps): Promise<IBeatmapset> => {
    let bset: IBeatmapset | null = null;
    const setId = Number(input.id);

    // --- PLANO A: osu!api oficial (v2) ---
    try {
        const response = await osuApiClient.get(`/beatmapsets/${setId}`);
        if (response.data && response.data.title) {
            bset = mapOsuBeatmapsetToDomain(response.data);
            for (const bm of bset.beatmaps) {
                persistBeatmapRecord(bm);
            }
        }
    } catch {
        // Segue para Plano B
    }

    // --- PLANO B: Catboy v2 Mirror ---
    if (!bset) {
        try {
            const catboyHeaders = { 'User-Agent': 'Fubika/1.0 (Web API; osu! private server)' };
            const catboyRes = await axios.get(`https://catboy.best/api/v2/s/${setId}`, {
                headers: catboyHeaders,
                timeout: 6000
            });
            if (catboyRes.data && (catboyRes.data.id || catboyRes.data.title)) {
                bset = mapCatboyBeatmapsetToDomain(catboyRes.data);
                for (const bm of bset.beatmaps) {
                    persistBeatmapRecord(bm);
                }
            }
        } catch {
            // Segue para Plano C
        }
    }

    // --- Fallback: Banco local MySQL ---
    if (!bset) {
        const localMaps = await prisma.maps.findMany({
            where: { set_id: setId }
        });
        if (localMaps && localMaps.length > 0) {
            const first = localMaps[0];
            bset = {
                beatmapset_id: setId,
                playcount: localMaps.reduce((acc, m) => acc + (m.plays || 0), 0),
                artist: first.artist || 'Artista Desconhecido',
                favourite_count: 0,
                cover: `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`,
                thumbnail: `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg`,
                author_id: '0',
                title: first.title || 'Sem título',
                beatmaps: localMaps.map((m) => mapLocalDbToDomain(m))
            };
        }
    }

    if (!bset) {
        throw Errors.NotFound('O beatmapset solicitado não foi encontrado.');
    }

    return bset;
}