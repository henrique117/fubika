import { getBeatmap, getPlayer } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { compareEmbedBuilder, defaultEmbedBuilder, extractBeatmapId } from "../../utils/utils.export";

export default {
    data: new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Compara o score de um player em um beatmap')
        .addStringOption(option => 
            option.setName('beatmap')
            .setDescription('Link ou ID do beatmap')
            .setRequired(true)
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
                : await getPlayer(insertedPlayer) // Player fornecido

            const insertedBeatmap = interaction.options.getString('beatmap', true) // Pega o link ou id do beatmap fornecido no comando
            const beatmap = (insertedBeatmap.includes('/'))
                ? await getBeatmap(await extractBeatmapId(insertedBeatmap)) // Extrai ID caso seja link
                : await getBeatmap(insertedBeatmap) // Já é o ID

            const embed = await compareEmbedBuilder(beatmap, player)

            await interaction.editReply({ embeds: [embed] })
    
        }catch(error){
            let mensagem
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                mensagem = `Player \`${interaction.options.getString('player')}\` não encontrado!`
            else if (String(error).includes('Not Found')) // Beatmap não encontrado
                mensagem = 'Beatmap não encontrado!'
            else
                mensagem = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(mensagem)

            await interaction.editReply({ embeds: [embed] })
        }
    }
}