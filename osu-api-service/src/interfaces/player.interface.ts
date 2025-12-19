import IScore from "./score.interface";

export default interface IPlayer {
    id: number;
    name: string;
    safe_name: string;
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

    total_score: number;
    ranked_score: number;
    max_combo: number;
    playtime: number;

    top_100?: Omit<IScore, 'player'>[];
}