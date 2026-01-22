import { IScore } from "./interfaces.export"

export default interface IBeatmap {
    beatmap_id: number
    beatmapset_id: number
    url: string
    thumbnail: string
    title: string
    diff: string
    mode: string
    star_rating: number
    max_combo: number
    total_length: number // em segundos
    bpm: number
    cs: number
    ar: number
    od: number
    hp: number
    author_name: string
    status: string // Ranked, Loved, etc
    scores?: Omit<IScore, 'beatmap'>[]
}