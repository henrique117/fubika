import { executeRanking } from '../logic/ranking.logic'
import { rankingEmbedsBuilder } from '../../utils/utils.export'

export const rankingTool = {
    type: 'function' as const,

    function: {
        name: 'ranking',

        description:
            'Obtém o ranking global do servidor Fubika.',

        parameters: {
            type: 'object',

            properties: {
                gamemode: {
                    type: 'string',

                    enum: [
                        '0',
                        '1',
                        '2',
                        '3'
                    ],

                    description:
                        'Modo de jogo: 0=osu!, 1=taiko, 2=catch, 3=mania'
                }
            },

            required: []
        }
    }
}

export async function executeRankingTool(
    params: { gamemode?: string }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const gamemode = params.gamemode ? Number(params.gamemode) : null
        const result = await executeRanking(gamemode)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar ranking'
            }
        }

        const embeds = await rankingEmbedsBuilder(result.ranking, result.gamemode!)

        return {
            success: true,
            embed: embeds[0]
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}
