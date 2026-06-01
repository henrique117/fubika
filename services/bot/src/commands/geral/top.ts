import { executeTopScores } from "../../services/logic/topScores.logic"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, top200EmbedsBuilder, embedPagination, topIndexEmbedBuilder, defaultEmbedBuilder, noIndexScoresEmbedBuilder, parseOnlyUsername } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Exibe o top 200 de um player')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option.setName('index')
                .setDescription('Ranking da play')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(200)
        ),

    aliases: ['t'],

    isAdmin: false,
    isDestructive: false,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player')
        const index = interaction.options.getNumber('index')

        await this.handleTopCommand(interaction, username, index)
    },

    async executePrefix(message: Message, index: number | null) {

        const { username } = await parseOnlyUsername(message.content)

        await this.handleTopCommand(message, username, index)
    },

    async handleTopCommand(source: ChatInputCommandInteraction | Message, username: string | null, index: number | null) {

        try {

            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const result = await executeTopScores(username, user.id, index)

            if (!result.success) {
                const embed = await defaultEmbedBuilder(result.error || 'Erro ao buscar top')
                await reply(source, { embeds: [embed] })
                return
            }

            if (index === null) {
                const { embeds, attachment } = await top200EmbedsBuilder(result.player)
                await embedPagination(source, embeds, "", false, 60000, attachment)

            } else if (!result.hasScoreAtIndex) {
                const { embed, attachment } = await noIndexScoresEmbedBuilder(result.player)
                await reply(source, {
                    embeds: [embed],
                    files: [attachment]
                })
                return

            } else {
                const score = result.player.top_200[result.index! - 1]
                const embed = await topIndexEmbedBuilder(result.player, score, result.index!)
                await reply(source, { embeds: [embed] })
            }

        } catch (error) {
            const embed = await defaultEmbedBuilder(String(error))
            await reply(source, { embeds: [embed] })
        }
    }
}
