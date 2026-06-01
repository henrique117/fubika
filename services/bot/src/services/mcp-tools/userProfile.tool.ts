import { executeUserProfile } from '../logic/userProfile.logic'
import { userEmbedBuilder } from '../../utils/utils.export'

export const userProfileTool = {
    type: 'function' as const,

    function: {
        name: 'user_profile',

        description:
            'Obtém o perfil de um jogador no servidor osu! Fubika.',

        parameters: {
            type: 'object',

            properties: {
                username: {
                    type: 'string',

                    description:
                        'Nome do jogador no Fubika'
                }
            },

            required: []
        }
    }
}

export async function executeUserProfileTool(
    userId: string,
    params: { username?: string }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const result = await executeUserProfile(params.username || null, userId)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar perfil'
            }
        }

        const { embed } = await userEmbedBuilder(result.player)

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

