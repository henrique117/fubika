import { getPlayer, getRecentScores } from "../apiCalls"

export interface RecentResult {
    success: boolean
    player?: any
    score?: any
    index?: number | null
    hasScores?: boolean
    error?: string
}

export async function executeRecent(username: string | null, userId: string, index: number | null): Promise<RecentResult> {
    try {
        const finalUser = username || userId
        const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())
        const scores = await getRecentScores(finalUser.replace(" ", "_").toLowerCase())

        const hasScores = !!scores && scores.length > 0

        if (!hasScores) {
            return {
                success: true,
                player,
                hasScores: false,
                index: index ?? 1
            }
        }

        if (index !== null && (index < 1 || index > 200)) {
            return {
                success: false,
                error: 'Insira um index válido!'
            }
        }

        const selectedIndex = index ?? 1
        const score = scores[selectedIndex - 1]

        if (!score && index !== null) {
            return {
                success: true,
                player,
                hasScores: false,
                index: selectedIndex
            }
        }

        return {
            success: true,
            player,
            score,
            index: selectedIndex,
            hasScores: true
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

