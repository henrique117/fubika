import { getPlayer } from "../apiCalls"

export interface TopScoresResult {
    success: boolean
    player?: any
    index?: number | null
    hasScoreAtIndex?: boolean
    error?: string
}

export async function executeTopScores(username: string | null, userId: string, index: number | null): Promise<TopScoresResult> {
    try {
        const finalUser = username || userId
        const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())

        if (index !== null && (index < 1 || index > 200)) {
            return {
                success: false,
                error: 'Insira um index válido!'
            }
        }

        if (index !== null && !player.top_200) {
            return {
                success: false,
                error: "Scores data are missing"
            }
        }

        if (index !== null) {
            const score = player.top_200?.[index - 1]
            return {
                success: true,
                player,
                index,
                hasScoreAtIndex: !!score
            }
        }

        return {
            success: true,
            player,
            index: null,
            hasScoreAtIndex: !!player.top_200
        }
    } catch (error) {
        let errorMsg = String(error)
        if (errorMsg.includes('Usuário não encontrado')) {
            errorMsg = `Player \`${username}\` não encontrado!`
        }
        return {
            success: false,
            error: errorMsg
        }
    }
}

