import IScore from "./score.interface";

export default interface IPlayer {
    id: number;
    name: string;
    safe_name: string;
    country?: string;
    rank: number;
    pp: number;
    acc: number;
    pfp?: string;
    banner?: string;

    a_count: number;
    s_count: number;
    ss_count: number;
    sh_count: number;
    ssh_count: number;

    level: number;

    total_score: number;
    ranked_score: number;
    max_combo: number;
    playtime: number;
    playcount: number;
    total_hits?: number;
    replay_views?: number;

    last_activity?: string;

    rank_history?: { date: string; rank: number; pp: number }[];
    top_200?: Omit<IScore, 'player'>[];
}