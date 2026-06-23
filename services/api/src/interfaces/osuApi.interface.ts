export interface OsuCovers {
    cover?: string;
    "list@2x"?: string;
}

export interface OsuBeatmapset {
    id: number;
    artist: string;
    title: string;
    creator?: string;
    user_id: number;
    covers?: OsuCovers;
    play_count: number;
    favourite_count: number;
    tags?: string;
    beatmaps?: OsuBeatmap[];
}

export interface OsuBeatmap {
    id: number;
    beatmapset_id: number;
    checksum: string;
    artist?: string;
    mode: string;
    mode_int: number;
    status: string;
    total_length: number;
    user_id: number;
    version: string;
    difficulty_rating: number;
    bpm: number;
    accuracy: number;
    ar: number;
    cs: number;
    drain: number;
    max_combo: number;
    count_circles: number;
    count_sliders: number;
    passcount: number;
    playcount: number;
    beatmapset?: OsuBeatmapset;
}

export interface OsuBeatmapsListResponse {
    beatmaps?: OsuBeatmap[];
}

export interface OsuTokenResponse {
    access_token: string;
    expires_in: number;
}
