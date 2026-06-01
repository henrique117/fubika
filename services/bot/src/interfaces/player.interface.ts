import { IScore } from "./interfaces.export"

export default interface IPlayer {
    id: number
    name: string
    url: string
    pfp: string
    rank: number
    pp: number
    acc: number
    playcount: number
    playtime: number
    level: number
    ssh_count: number
    ss_count: number
    sh_count: number
    s_count: number
    a_count: number
    last_activity: string
    top_200?: Omit<IScore, 'player'>[] 
}