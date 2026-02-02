import { getBeatmap, getPlayer } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, compareEmbedBuilder,defaultEmbedBuilder, extractBeatmapId, parseCompareArguments, getBeatmapIdFromMessage, fetchLastBeatmapId } from "../../utils/utils.export"

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
    
    aliases: ['c', 'compare'],

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando
        
        const insertedBeatmap = interaction.options.getString('beatmap') // Pega o link ou id do beatmap fornecido (ou não) no comando
        
        const beatmapId = (insertedBeatmap?.includes('/'))
            ? await extractBeatmapId(insertedBeatmap)
            : insertedBeatmap

        await this.handleCompareCommand(interaction, beatmapId, username)
    },
    
    async executePrefix(message: Message){

        const { beatmapId, username } = await parseCompareArguments(message.content)

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

        await this.handleCompareCommand(message, inputBeatmapId, username)
    },

    async handleCompareCommand(source: ChatInputCommandInteraction | Message, beatmapId: string | null, username: string | null){
        
        try{
        
            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const finalUser = username || user.id // Player fornecido || Player não foi fornecido

            const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())

            let finalBeatmapId = beatmapId

            if(finalBeatmapId === null) {
                
                const channelBeatmapId = await fetchLastBeatmapId(source.channel)

                if (channelBeatmapId === null)
                    throw new Error('Mapa não encontrado no canal')

                finalBeatmapId = channelBeatmapId
            }

            const beatmap = await getBeatmap(finalBeatmapId)

            const embed = await compareEmbedBuilder(beatmap, player)

            await reply(source, { embeds: [embed] })

        } catch (error) {
            let message
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                message = `Player \`${username}\` não encontrado!`
            else if (String(error).includes('Not Found')) // Beatmap não encontrado
                message = 'Beatmap não encontrado!'
            else if (String(error).includes('Mapa não encontrado no canal'))
                message = 'Não foi encontrado nenhum mapa recente no canal!\nForneça o link ou apenas o id do mapa.'
            else
                message = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
}