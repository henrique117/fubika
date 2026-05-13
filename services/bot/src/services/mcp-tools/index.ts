import {
    userProfileTool,
    executeUserProfileTool
} from './userProfile.tool'
import {
    leaderboardTool,
    executeLeaderboardTool
} from './leaderboard.tool'
import {
    rankingTool,
    executeRankingTool
} from './ranking.tool'
import {
    recentTool,
    executeRecentTool
} from './recentScores.tool'
import {
    topScoresTool,
    executeTopScoresTool
} from './topScores.tool'
import {
    compareTool,
    executeCompareTool
} from './compareScores.tool'
import {
    helpTool,
    executeHelpTool
} from './help.tool'

/**
 * Exporta todas as definições de ferramentas para o Groq
 */
export const allTools = [
    userProfileTool,
    leaderboardTool,
    rankingTool,
    recentTool,
    topScoresTool,
    compareTool,
    helpTool,
]

/**
 * Map de executores de ferramentas para fácil acesso
 */
export const toolExecutors: Record<string, Function> = {
    userProfile: (userId: string, params: any) => executeUserProfileTool(userId, params),
    leaderboard: (params: any) => executeLeaderboardTool(params),
    ranking: (params: any) => executeRankingTool(params),
    recentScores: (userId: string, params: any) => executeRecentTool(userId, params),
    topScores: (userId: string, params: any) => executeTopScoresTool(userId, params),
    compareScores: (userId: string, params: any) => executeCompareTool(userId, params),
    help: (params: any) => executeHelpTool(params),
}

/**
 * Executa um tool baseado em seu nome
 */
export async function executeTool(
    toolName: string,
    params: any,
    userId?: string
): Promise<any> {
    const executor = toolExecutors[toolName]

    if (!executor) {
        return {
            success: false,
            error: `Tool desconhecida: ${toolName}`
        }
    }

    try {
        if (userId) {
            return await executor(userId, params)
        } else {
            return await executor(params)
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}
