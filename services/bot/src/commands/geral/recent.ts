import { executeRecent } from "../../services/logic/recent.logic"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, recentEmbedBuilder, noRecentScoresEmbedBuilder, noIndexScoresEmbedBuilder, defaultEmbedBuilder, parseOnlyUsername } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('recent')
        .setDescription('Exibe o score mais recente de um player')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option.setName('index')
                .setDescription('Posição do score na lista de recentes')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(200)
        ),

    aliases: ['r', 'rs'],

    isAdmin: false,
    isDestructive: false,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player')
        const index = interaction.options.getNumber('index')

        await this.handleRecentCommand(interaction, username, index)
    },

    async executePrefix(message: Message, index: number | null) {

        const { username } = await parseOnlyUsername(message.content)

        await this.handleRecentCommand(message, username, index)
    },

    async handleRecentCommand(source: ChatInputCommandInteraction | Message, username: string | null, index: number | null) {

        try {

            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const result = await executeRecent(username, user.id, index)

            if (!result.success) {
                const embed = await defaultEmbedBuilder(result.error || 'Erro ao buscar recent')
                await reply(source, { embeds: [embed] })
                return
            }

            if (!result.hasScores) {
                const { embed, attachment } = await noRecentScoresEmbedBuilder(result.player)
                await reply(source, {
                    embeds: [embed],
                    files: [attachment]
                })
                return
            }

            if (!result.score && index !== null) {
                const { embed, attachment } = await noIndexScoresEmbedBuilder(result.player)
                await reply(source, {
                    embeds: [embed],
                    files: [attachment]
                })
                return
            }

            const embed = await recentEmbedBuilder(result.player, result.score)
            await reply(source, { embeds: [embed] })

        } catch (error) {
            const embed = await defaultEmbedBuilder(String(error))
            await reply(source, { embeds: [embed] })
        }
    }
}
