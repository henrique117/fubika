import { executeRecent } from '../logic/recent.logic'
import { recentEmbedBuilder, noRecentScoresEmbedBuilder, defaultEmbedBuilder } from '../../utils/utils.export'

export const recentTool = {
    type: 'function',

    function: {
        name: 'recent_scores',

        description:
            'Obtém o score mais recente de um jogador do osu!',

        parameters: {
            type: 'object',

            properties: {
                username: {
                    type: 'string',

                    description:
                        'Nome do jogador'
                },

                index: {
                    type: 'number',

                    description:
                        'Posição na lista de scores recentes (1-200)'
                }
            },

            required: []
        }
    }
}

export async function executeRecentTool(
    userId: string,
    params: { username?: string; index?: number }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const result = await executeRecent(params.username || null, userId, params.index || null)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar scores recentes'
            }
        }

        if (!result.hasScores) {
            const { embed } = await noRecentScoresEmbedBuilder(result.player)
            return {
                success: true,
                embed
            }
        }

        const embed = await recentEmbedBuilder(result.player, result.score)

        return {
            success: true,
            embed
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}
