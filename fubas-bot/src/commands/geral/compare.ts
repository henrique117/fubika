import { getBeatmap, getPlayer } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { compareEmbedBuilder, defaultEmbedBuilder, extractBeatmapId, fetchLastBeatmapId } from "../../utils/utils.export"

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

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()
        
        try{
            
            const insertedPlayer = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando
            const player = (insertedPlayer === null)
                ? await getPlayer(interaction.user.id) // Player não foi fornecido
                : await getPlayer(insertedPlayer.replace(" ", "_").toLowerCase()) // Player fornecido

            const insertedBeatmap = interaction.options.getString('beatmap') // Pega o link ou id do beatmap fornecido (ou não) no comando
            
            let beatmap
            if (insertedBeatmap === null) {
                
                const channelBeatmapId = await fetchLastBeatmapId(interaction.channel)

                if (channelBeatmapId === null)
                    throw new Error('Mapa não encontrado no canal')

                beatmap = await getBeatmap(channelBeatmapId)

            } else {

                beatmap = (insertedBeatmap.includes('/'))
                    ? await getBeatmap(await extractBeatmapId(insertedBeatmap)) // Extrai ID caso seja link
                    : await getBeatmap(insertedBeatmap) // Já é o ID
            }
            
            const embed = await compareEmbedBuilder(beatmap, player)

            await interaction.editReply({ embeds: [embed] })
    
        }catch(error){
            let message
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                message = `Player \`${interaction.options.getString('player')}\` não encontrado!`
            else if (String(error).includes('Not Found')) // Beatmap não encontrado
                message = 'Beatmap não encontrado!'
            else if (String(error).includes('Mapa não encontrado no canal'))
                message = 'Não foi encontrado nenhum mapa recente no canal!\nForneça o link ou apenas o id do mapa.'
            else
                message = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(message)

            await interaction.editReply({ embeds: [embed] })
        }
    }
}