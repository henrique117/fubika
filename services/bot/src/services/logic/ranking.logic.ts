import { getGlobalRanking } from "../apiCalls"

export interface RankingResult {
    success: boolean
    ranking?: any
    gamemode?: number
    error?: string
}

export async function executeRanking(gamemode: number | null): Promise<RankingResult> {
    try {
        const selectedGamemode = gamemode ?? 0
        const ranking = await getGlobalRanking(selectedGamemode)
        return {
            success: true,
            ranking,
            gamemode: selectedGamemode
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}
