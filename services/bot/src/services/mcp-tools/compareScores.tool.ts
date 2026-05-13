import { executeCompare } from '../logic/compare.logic'
import { compareEmbedBuilder } from '../../utils/utils.export'

export const compareTool = {
    type: 'function' as const,

    function: {
        name: 'compare_scores',

        description:
            'Compara o score de um jogador em um beatmap específico do osu!',

        parameters: {
            type: 'object',

            properties: {
                beatmapId: {
                    type: 'string',

                    description:
                        'ID ou link do beatmap'
                },

                username: {
                    type: 'string',

                    description:
                        'Nome do jogador'
                }
            },

            required: ['beatmapId']
        }
    }
}

export async function executeCompareTool(
    userId: string,
    params: { beatmapId: string; username?: string }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const result = await executeCompare(params.beatmapId, params.username || null, userId)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao comparar scores'
            }
        }

        const embed = await compareEmbedBuilder(result.beatmap, result.player)

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
