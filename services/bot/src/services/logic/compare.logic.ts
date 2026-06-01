import { getBeatmap, getPlayer } from "../apiCalls"

export interface CompareResult {
    success: boolean
    beatmap?: any
    player?: any
    error?: string
}

export async function executeCompare(beatmapId: string | null, username: string | null, userId: string): Promise<CompareResult> {
    try {
        if (!beatmapId) {
            return {
                success: false,
                error: 'Beatmap ID is required'
            }
        }

        const finalUser = username || userId
        const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())
        const beatmap = await getBeatmap(beatmapId)

        return {
            success: true,
            beatmap,
            player
        }
    } catch (error) {
        let errorMsg = String(error)
        if (errorMsg.includes('Usuário não encontrado')) {
            errorMsg = `Player \`${username}\` não encontrado!`
        } else if (errorMsg.includes('Not Found')) {
            errorMsg = 'Beatmap não encontrado!'
        }
        return {
            success: false,
            error: errorMsg
        }
    }
}

