import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import {
    reply,
    defaultHelpEmbed,
    helpCompareEmbed,
    helpHelpEmbed,
    helpLeaderboardEmbed,
    helpRankingEmbed,
    helpRecentEmbed,
    helpRecentListEmbed,
    helpTopEmbed,
    helpUserEmbed,
    defaultEmbedBuilder,
} from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lista informações sobre o bot e seus comandos')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Informações de um comando específico')
                .setRequired(false)
                .addChoices(
                    { name: 'compare', value: 'compare' },
                    { name: 'help', value: 'help' },
                    { name: 'leaderboard', value: 'leaderboard' },
                    { name: 'ranking', value: 'ranking' },
                    { name: 'recent', value: 'recent' },
                    { name: 'recentlist', value: 'recentlist' },
                    { name: 'top', value: 'top' },
                    { name: 'user', value: 'user' },
                )
        ),

    aliases: ['h'],

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const selectedCommand = interaction.options.getString('command') // Pega o comando fornecido (ou não)

        await this.handleHelpCommand(interaction, selectedCommand)
    },

    async executePrefix(message: Message, _index: any, args: string[]) {

        const commandAliases: Record<string, string> = {

            'c': 'compare', 'mog': 'compare', 'compare': 'compare', // Compare

            'h': 'help', 'help': 'help', // Help

            'lb': 'leaderboard', 'leaderboard': 'leaderboard', // Leaderboard

            'ppr': 'ranking', 'ppranking': 'ranking', // Ranking 
            'pplb': 'ranking', 'ppleaderboard': 'ranking', 'ranking': 'ranking',

            'r': 'recent', 'rs': 'recent', 'recent': 'recent', // Recent

            'rl': 'recentlist', 'recentlist': 'recentlist', // Recent List

            't': 'top', 'top': 'top', // Top

            'std': 'user', 'osu': 'user', 'u': 'user', 'user': 'user' // User
        }

        const selectedCommand = commandAliases[args[0]?.toLowerCase() ?? ''] ?? null

        await this.handleHelpCommand(message, selectedCommand)
    },

    async handleHelpCommand(source: ChatInputCommandInteraction | Message, selectedCommand: string | null) {

        try {

            let embed
            if (!selectedCommand) {

                embed = defaultHelpEmbed()

            } else {

                switch (selectedCommand) {
                    case 'compare': embed = helpCompareEmbed(); break
                    case 'help': embed = helpHelpEmbed(); break
                    case 'leaderboard': embed = helpLeaderboardEmbed(); break
                    case 'ranking': embed = helpRankingEmbed(); break
                    case 'recent': embed = helpRecentEmbed(); break
                    case 'recentlist': embed = helpRecentListEmbed(); break
                    case 'top': embed = helpTopEmbed(); break
                    case 'user': embed = helpUserEmbed(); break
                }
            }

            await reply(source, { embeds: [embed], allowedMentions: { parse: [] } })

        } catch (error) {
            const message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
}