import { executeTopScores } from '../logic/topScores.logic'
import { top200EmbedsBuilder, topIndexEmbedBuilder, noIndexScoresEmbedBuilder, defaultEmbedBuilder } from '../../utils/utils.export'

export const topScoresTool = {
    type: 'function',

    function: {
        name: 'top_scores',

        description:
            'Obtém os melhores scores (top plays) de um jogador do osu!',

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
                        'Posição específica no top plays (1-200)'
                }
            },

            required: []
        }
    }
}

export async function executeTopScoresTool(
    userId: string,
    params: { username?: string; index?: number }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const result = await executeTopScores(params.username || null, userId, params.index || null)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar top scores'
            }
        }

        if (result.index === null) {
            const { embeds } = await top200EmbedsBuilder(result.player)
            return {
                success: true,
                embed: embeds[0]
            }
        }

        if (!result.hasScoreAtIndex) {
            const { embed } = await noIndexScoresEmbedBuilder(result.player)
            return {
                success: true,
                embed
            }
        }

        const score = result.player.top_200[result.index! - 1]
        const embed = await topIndexEmbedBuilder(result.player, score, result.index!)

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
