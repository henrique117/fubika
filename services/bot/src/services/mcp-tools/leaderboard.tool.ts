import { executeLeaderboard } from '../logic/leaderboard.logic'
import { leaderboardEmbedsBuilder } from '../../utils/utils.export'

export const leaderboardTool = {
    type: 'function' as const,

    function: {
        name: 'leaderboard',

        description:
            'Obtém a leaderboard de um beatmap do osu!',

        parameters: {
            type: 'object',

            properties: {
                beatmapId: {
                    type: 'string',

                    description:
                        'ID ou link do beatmap'
                }
            },

            required: ['beatmapId']
        }
    }
}

export async function executeLeaderboardTool(
    params: { beatmapId: string }
): Promise<{ success: boolean; embeds?: any[]; message?: string; error?: string }> {
    try {
        const result = await executeLeaderboard(params.beatmapId)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar leaderboard'
            }
        }

        const embeds = await leaderboardEmbedsBuilder(result.beatmap)

        return {
            success: true,
            embeds: embeds.slice(0, 1)
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}

