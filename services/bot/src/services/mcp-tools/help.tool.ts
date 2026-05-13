import { executeHelp } from '../logic/help.logic'
import {
    defaultHelpEmbed,
    helpCompareEmbed,
    helpHelpEmbed,
    helpLeaderboardEmbed,
    helpRankingEmbed,
    helpRecentEmbed,
    helpTopEmbed,
    helpUserEmbed,
    defaultEmbedBuilder,
} from '../../utils/utils.export'

export const helpTool = {
    type: 'function',

    function: {
        name: 'help',

        description:
            'Obtém informações sobre os comandos disponíveis do bot.',

        parameters: {
            type: 'object',

            properties: {
                command: {
                    type: 'string',

                    enum: [
                        'compare',
                        'help',
                        'leaderboard',
                        'ranking',
                        'recent',
                        'top',
                        'user'
                    ],

                    description:
                        'Comando específico para obter ajuda'
                }
            },

            required: []
        }
    }
}

export async function executeHelpTool(
    params: { command?: string }
): Promise<{ success: boolean; embed?: any; message?: string; error?: string }> {
    try {
        const result = await executeHelp(params.command || null)

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Erro ao buscar ajuda'
            }
        }

        let embed
        if (!result.command) {
            embed = defaultHelpEmbed()
        } else {
            switch (result.command) {
                case 'compare':     embed = helpCompareEmbed();     break
                case 'help':        embed = helpHelpEmbed();        break
                case 'leaderboard': embed = helpLeaderboardEmbed(); break
                case 'ranking':     embed = helpRankingEmbed();     break
                case 'recent':      embed = helpRecentEmbed();      break
                case 'top':         embed = helpTopEmbed();         break
                case 'user':        embed = helpUserEmbed();        break
            }
        }

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
