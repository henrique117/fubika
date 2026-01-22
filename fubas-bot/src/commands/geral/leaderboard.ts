import { getBeatmap } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { leaderboardEmbedsBuilder, embedPagination, defaultEmbedBuilder, extractBeatmapId } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Exibe a leaderboard de um beatmap')
        .addStringOption(option => 
            option.setName('beatmap')
                .setDescription('Link ou ID do beatmap')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()
        
        try{
        
            const insertedBeatmap = interaction.options.getString('beatmap', true) // Pega o link ou id do beatmap fornecido no comando
            const beatmap = (insertedBeatmap.includes('/'))
                ? await getBeatmap(await extractBeatmapId(insertedBeatmap)) // Extrai ID caso seja link
                : await getBeatmap(insertedBeatmap) // Já é o ID

            const embeds = await leaderboardEmbedsBuilder(beatmap)

            await embedPagination(interaction, embeds, "", false, 60000)
        
        }catch(error){
            let message
            if (String(error).includes('Not Found'))
                message = 'Beatmap não encontrado!'
            else
                message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await interaction.editReply({ embeds: [embed] })
        }
    }
} 