export interface ProfileScoreRow {
    score_id: number | bigint;
    score_val: number | bigint;
    score_pp: number | null;
    score_acc: number;
    max_combo: number;
    mods: number;
    n300: number;
    n100: number;
    n50: number;
    nmiss: number;
    grade: string;
    perfect: number;
    play_time: Date;
    map_id: number;
    map_set_id: number | null;
    map_md5: string;
    artist?: string | null;
}

export interface BeatmapScoreRow {
    score_id: number | bigint;
    userid: number;
    name: string;
    safe_name: string;
    score_val: number | bigint;
    score_pp: number | null;
    score_acc: number;
    max_combo: number;
    mods: number;
    n300: number;
    n100: number;
    n50: number;
    nmiss: number;
    grade: string;
    perfect: number;
    play_time: Date;
    user_pp: number | null;
    user_acc: number | null;
    user_tscore: number | bigint | null;
    user_rscore: number | bigint | null;
    user_max_combo: number | null;
    playtime: number | null;
    x_count: number | null;
    xh_count: number | null;
    s_count: number | null;
    sh_count: number | null;
    a_count: number | null;
}
