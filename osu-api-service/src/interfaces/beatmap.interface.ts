import IScore from "./score.interface";

export default interface IBeatmap {
    artist: string;
    beatmap_id: number;
    beatmapset_id: number;
    beatmap_md5: string;
    title: string;

    mode: string;
    mode_int: number;
    status: string;
    total_length: number;
    author_id: number;
    author_name: string;
    diff: string;
    cover: string;
    thumbnail: string;

    star_rating: number;
    bpm: number;
    od: number;
    ar: number;
    cs: number;
    hp: number;
    max_combo: number;

    scores?: Omit<IScore, 'beatmap'>[];
}