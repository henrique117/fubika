import { getPlayer, getRecentScores } from "../../services/apiCalls"
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

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando

        const index = interaction.options.getNumber('index') // Pega o index fornecido (ou não) no comando

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

            const finalUser = username || user.id // Player fornecido || Player não foi fornecido

            const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())

            const scores = await getRecentScores(finalUser.replace(" ", "_").toLowerCase())

            // Caso o player ainda não possua scores
            if (!scores[0]) {

                const { embed, attachment } = await noRecentScoresEmbedBuilder(player)

                reply(source, {
                    embeds: [embed],
                    files: [attachment]
                }
                )

                return
            }

            let embed
            if (index === null) {

                embed = await recentEmbedBuilder(player, scores[0])

            } else if (1 > index || index > 200) {

                embed = await defaultEmbedBuilder('Insira um index válido!')

            } else {

                const score = scores[index - 1]

                if (!score) {
                    const { embed, attachment } = await noIndexScoresEmbedBuilder(player)
                    await reply(source, {
                        embeds: [embed],
                        files: [attachment]
                    })
                    return
                }

                embed = await recentEmbedBuilder(player, score)
            }

            reply(source, { embeds: [embed] })

        } catch (error) {
            let message
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                message = `Player \`${username}\` não encontrado!`
            else
                message = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(message)

            reply(source, { embeds: [embed] })
        }
    }
}