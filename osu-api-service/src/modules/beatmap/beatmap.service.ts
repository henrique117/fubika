import IBeatmap from "../../interfaces/beatmap.interface";
import IBeatmapset from "../../interfaces/beatmapset.interface";
import IScore from "../../interfaces/score.interface";
import osuApiClient from "../../utils/axios";
import { getModString } from "../../utils/getModString";
import { calculateLevel } from "../../utils/level";
import prisma from "../../utils/prisma";
import { getLastActivity, getPlayerPlaycount } from "../user/user.service";
import { SearchBeatmaps } from "./beatmap.schema";

const mapOsuBeatmapToDomain = (data: any): IBeatmap => {
    return {
        beatmap_id: data.id,
        beatmapset_id: data.beatmapset_id,
        beatmap_md5: data.checksum,
        title: data.beatmapset?.title || 'Sem título', 
        mode: data.mode,
        mode_int: data.mode_int,
        status: data.status,
        total_lenght: data.total_length,
        author_id: data.user_id,
        author_name: data.beatmapset?.creator || 'Desconhecido',
        cover: data.beatmapset.covers.cover,
        diff: data.version,
        star_rating: data.difficulty_rating,
        bpm: data.bpm,
        od: data.accuracy,
        ar: data.ar,
        cs: data.cs,
        hp: data.drain,
        max_combo: data.max_combo,
        scores: [] 
    };
};

const mapOsuBeatmapsetToDomain = (data: any): IBeatmapset => {
    return {
        beatmapset_id: data.id,
        playcount: data.play_count,
        favourite_count: data.favourite_count,
        cover: data.covers?.cover || '',
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

const getBeatmapLB = async (beatmapId: number, knownMd5?: string): Promise<IScore[]> => {
    
    let bmap_md5 = knownMd5;
    
    if (!bmap_md5) {
        const localMap = await prisma.maps.findFirst({
            where: { id: beatmapId },
            select: { md5: true }
        });

        if (localMap) {
            bmap_md5 = localMap.md5;
        } else {
            try {
                const response = await osuApiClient.get(`/beatmaps/${beatmapId}`);
                if (response.data && response.data.checksum) {
                    bmap_md5 = response.data.checksum;
                } else {
                    return [];
                }
            } catch (e) {
                return [];
            }
        }
    }

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
            u.last_activity,
            st.pp as user_pp,
            st.acc as user_acc,
            st.tscore as user_tscore,
            st.rscore as user_rscore,
            st.max_combo as user_max_combo,
            st.playtime,
            st.x_count,    
            st.xh_count,   
            st.s_count,    
            st.sh_count,   
            st.a_count     
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

    return await Promise.all(mapLBRaw.map((row) => mapDatabaseToScore(row)));
}

export const getBeatmap = async (input: SearchBeatmaps): Promise<IBeatmap> => {
    try {
        const response = await osuApiClient.get(`/beatmaps/${input.id}`);

        if (!response.data) {
            throw new Error('Beatmap não encontrado na API');
        }

        const bmap = mapOsuBeatmapToDomain(response.data);

        const map_lb = await getBeatmapLB(input.id, bmap.beatmap_md5);

        return { 
            ...bmap,
            scores: map_lb 
        };
        
    } catch (err) {
        console.error("Erro no getBeatmap:", err);
        throw err;
    }
}

export const getBeatmapset = async (input: SearchBeatmaps): Promise<IBeatmapset> => {
    try {
        const response = await osuApiClient.get(`/beatmapsets/${input.id}`);

        if (!response.data) {
            throw new Error('Beatmapset não encontrado na API');
        }

        return mapOsuBeatmapsetToDomain(response.data);
        
    } catch (err) {
        console.error("Erro no getBeatmapset:", err);
        throw err;
    }
}

export const mapDatabaseToScore = async (row: any): Promise<IScore> => {
    const totalScoreNumber = Number(row.user_tscore);

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
        map_md5: row.map_md5,

        player: {
            id: row.userid,
            name: row.name,
            safe_name: row.safe_name,
            rank: 0, 
            pp: row.user_pp || 0,
            acc: row.user_acc || 0,
            pfp: `https://a.${process.env.DOMAIN}/${row.userid}`,

            a_count: row.a_count || 0,
            s_count: row.s_count || 0,
            ss_count: row.x_count || 0,
            sh_count: row.sh_count || 0,
            ssh_count: row.xh_count || 0,

            level: calculateLevel(totalScoreNumber),

            total_score: Number(row.user_tscore || 0),
            ranked_score: Number(row.user_rscore || 0),
            max_combo: row.user_max_combo || 0,
            playtime: row.playtime || 0,
            playcount: await getPlayerPlaycount(row.userid),

            last_activity: getLastActivity(row.last_activity)
        }
    };
};