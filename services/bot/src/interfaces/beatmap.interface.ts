import { IScore } from "./interfaces.export"

export default interface IBeatmap {
    artist: string;
    beatmap_id: number
    beatmapset_id: number
    url: string
    thumbnail: string
    title: string
    diff: string
    mode: string
    star_rating: number
    max_combo: number
    total_length: number
    bpm: number
    cs: number
    ar: number
    od: number
    hp: number
    author_name: string
    status: string
    scores?: Omit<IScore, 'beatmap'>[]
}
