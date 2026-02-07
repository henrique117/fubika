import { getPlayer, getRecentScore } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, recentEmbedBuilder, noRecentScoresEmbedBuilder, defaultEmbedBuilder, parseOnlyUsername } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('recent')
        .setDescription('Exibe o score mais recente de um player')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        ),

    aliases: ['r', 'rs', 'recent'],

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando

        await this.handleRecentCommand(interaction, username)
    },

    async executePrefix(message: Message) {

        const { username } = await parseOnlyUsername(message.content)

        await this.handleRecentCommand(message, username)
    },

    async handleRecentCommand(source: ChatInputCommandInteraction | Message, username: string | null) {

        try {

            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const finalUser = username || user.id // Player fornecido || Player não foi fornecido

            const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())

            const [score] = await getRecentScore(finalUser.replace(" ", "_").toLowerCase())

            // Caso o player ainda não possua scores
            if (!score) {

                const { embed, attachment } = await noRecentScoresEmbedBuilder(player)

                reply(source, {
                    embeds: [embed],
                    files: [attachment]
                }
                )

                return
            }

            const embed = await recentEmbedBuilder(player, score)

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