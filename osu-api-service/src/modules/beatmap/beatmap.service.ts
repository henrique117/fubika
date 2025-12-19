import IBeatmap from "../../interfaces/beatmap.interface";
import IBeatmapset from "../../interfaces/beatmapset.interface";
import osuApiClient from "../../utils/axios";
import { SearchBeatmaps } from "./beatmap.schema";

const mapOsuBeatmapToDomain = (data: any): IBeatmap => {
    return {
        beatmap_id: data.id,
        beatmapset_id: data.beatmapset_id,
        title: data.beatmapset?.title || 'Sem título', 
        mode: data.mode,
        mode_int: data.mode_int,
        status: data.status,
        total_lenght: data.total_length,
        author_id: data.user_id,
        author_name: data.beatmapset?.creator || 'Desconhecido',
        diff: data.version,
        star_rating: data.difficulty_rating,
        bpm: data.bpm,
        od: data.accuracy,
        ar: data.ar,
        cs: data.cs,
        hp: data.drain,
        max_combo: data.max_combo,
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

export const getBeatmap = async (input: SearchBeatmaps) => {
    try {
        const response = await osuApiClient.get(`/beatmaps/${input.id}`);

        if (!response.data) {
            throw new Error('Beatmap não encontrado na API');
        }

        return mapOsuBeatmapToDomain(response.data);
        
    } catch (err) {
        console.error("Erro no getBeatmap:", err);
        throw err;
    }
}

export const getBeatmapset = async (input: SearchBeatmaps) => {
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