import { IBeatmap, IPlayer } from "./interfaces.export";

export default interface IScore {
    id: number
    score: number
    
    pp: number
    
    acc: number
    max_combo: number
    mods: string 
    n300: number
    n100: number
    n50: number
    nmiss: number
    play_time: string
    grade: string 
    perfect: boolean
    beatmap?: IBeatmap
    player?: IPlayer
}
