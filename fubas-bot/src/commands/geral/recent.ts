import { getPlayer, getRecentScore } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { recentEmbedBuilder, noRecentScoresEmbedBuilder, defaultEmbedBuilder } from "../../utils/utils.export";

export default {
    data: new SlashCommandBuilder()
        .setName('recent')
        .setDescription('Exibe o score mais recente de um player')
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

            const [ score ] = (insertedPlayer === null)
                ? await getRecentScore(interaction.user.id) // Player não foi fornecido
                : await getRecentScore(insertedPlayer) // Player fornecido

            // Caso o player ainda não possua scores
            if (!score) { 

                const { embed, attachment } = await noRecentScoresEmbedBuilder(player);        

                await interaction.editReply({
                    embeds: [embed],
                    files: [attachment]
                })
                return
            }
            
            const embed = await recentEmbedBuilder(player, score)

            await interaction.editReply({ embeds: [embed] })
    
        }catch(error){
            let mensagem
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                mensagem = `Player \`${interaction.options.getString('player')}\` não encontrado!`
            else
                mensagem = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(mensagem)

            await interaction.editReply({ embeds: [embed] })
        }
    }
}