import IBeatmap from "./beatmap.interface";

export default interface IBeatmapset {
    beatmapset_id: number;
    title: string;
    artist: string;

    playcount: number;
    favourite_count: number;

    cover: string;
    thumbnail: string;
    author_id: string;
    beatmaps: IBeatmap[];
}