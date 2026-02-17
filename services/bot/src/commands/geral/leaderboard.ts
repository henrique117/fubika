import { getBeatmap } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, leaderboardEmbedsBuilder, embedPagination, defaultEmbedBuilder, extractBeatmapId, parseOnlyBeatmapId, getBeatmapIdFromMessage, fetchLastBeatmapId } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Exibe a leaderboard de um beatmap')
        .addStringOption(option =>
            option.setName('beatmap')
                .setDescription('Link ou ID do beatmap')
                .setRequired(false)
        ),

    aliases: ['lb'],

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const insertedBeatmap = interaction.options.getString('beatmap') // Pega o link ou id do beatmap fornecido (ou não) no comando

        const beatmapId = (insertedBeatmap?.includes('/'))
            ? await extractBeatmapId(insertedBeatmap)
            : insertedBeatmap

        await this.handleLeaderboardCommand(interaction, beatmapId)
    },

    async executePrefix(message: Message) {

        const { beatmapId } = await parseOnlyBeatmapId(message.content)

        let inputBeatmapId = beatmapId // Tenta pegar beatmap inserido

        // Se não foi inserido nada && houver uma mensagem respondida, tenta pegar dela
        if (!inputBeatmapId && message.reference?.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId)

                const replyId = await getBeatmapIdFromMessage(repliedMessage)

                if (replyId)
                    inputBeatmapId = replyId

            } catch (error) {
                console.warn("Erro na leitura da messagem replied:", error)
            }
        }

        await this.handleLeaderboardCommand(message, inputBeatmapId)
    },

    async handleLeaderboardCommand(source: ChatInputCommandInteraction | Message, beatmapId: string | null) {

        try {

            let finalBeatmapId = beatmapId

            if (finalBeatmapId === null) {

                const channelBeatmapId = await fetchLastBeatmapId(source.channel)

                if (channelBeatmapId === null)
                    throw new Error('Mapa não encontrado no canal')

                finalBeatmapId = channelBeatmapId
            }

            const beatmap = await getBeatmap(finalBeatmapId)

            const embeds = await leaderboardEmbedsBuilder(beatmap)

            await embedPagination(source, embeds, "", false, 60000)

        } catch (error) {
            let message
            if (String(error).includes('Not Found'))
                message = 'Beatmap não encontrado!'
            else if (String(error).includes('Mapa não encontrado no canal'))
                message = 'Não foi encontrado nenhum mapa recente no canal!\nForneça o link ou apenas o id do mapa.'
            else
                message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
} 