import { getBeatmap } from "../apiCalls"

export interface LeaderboardResult {
    success: boolean
    beatmap?: any
    error?: string
}

export async function executeLeaderboard(beatmapId: string | null): Promise<LeaderboardResult> {
    try {
        if (!beatmapId) {
            return {
                success: false,
                error: 'Beatmap ID is required'
            }
        }

        const beatmap = await getBeatmap(beatmapId)
        return {
            success: true,
            beatmap
        }
    } catch (error) {
        let errorMsg = String(error)
        if (errorMsg.includes('Not Found')) {
            errorMsg = 'Beatmap não encontrado!'
        }
        return {
            success: false,
            error: errorMsg
        }
    }
}

