import { executeCompare } from "../../services/logic/compare.logic"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, compareEmbedBuilder, defaultEmbedBuilder, extractBeatmapId, parseCompareArguments, getBeatmapIdFromMessage, fetchLastBeatmapId } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Compara o score de um player em um beatmap')
        .addStringOption(option =>
            option.setName('beatmap')
                .setDescription('Link ou ID do beatmap')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        ),

    aliases: ['c', 'gap'],

    isAdmin: false,
    isDestructive: false,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player')

        const insertedBeatmap = interaction.options.getString('beatmap')

        const beatmapId = (insertedBeatmap?.includes('/'))
            ? await extractBeatmapId(insertedBeatmap)
            : insertedBeatmap

        await this.handleCompareCommand(interaction, beatmapId, username)
    },

    async executePrefix(message: Message) {

        const { beatmapId, username } = await parseCompareArguments(message.content)

        let inputBeatmapId = beatmapId

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

        await this.handleCompareCommand(message, inputBeatmapId, username)
    },

    async handleCompareCommand(source: ChatInputCommandInteraction | Message, beatmapId: string | null, username: string | null) {

        try {

            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            let finalBeatmapId = beatmapId

            if (finalBeatmapId === null) {

                const channelBeatmapId = await fetchLastBeatmapId(source.channel)

                if (channelBeatmapId === null)
                    throw new Error('Mapa não encontrado no canal')

                finalBeatmapId = channelBeatmapId
            }

            const result = await executeCompare(finalBeatmapId, username, user.id)

            if (!result.success) {
                let errorMsg = result.error || 'Erro desconhecido'
                if (errorMsg.includes('Mapa não encontrado no canal')) {
                    errorMsg = 'Não foi encontrado nenhum mapa recente no canal!\nForneça o link ou apenas o id do mapa.'
                }
                const embed = await defaultEmbedBuilder(errorMsg)
                await reply(source, { embeds: [embed] })
                return
            }

            const embed = await compareEmbedBuilder(result.beatmap, result.player)

            await reply(source, { embeds: [embed] })

        } catch (error) {
            let message
            if (String(error).includes('Mapa não encontrado no canal'))
                message = 'Não foi encontrado nenhum mapa recente no canal!\nForneça o link ou apenas o id do mapa.'
            else
                message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
}
