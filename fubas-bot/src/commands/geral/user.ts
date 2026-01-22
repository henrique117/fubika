import { getPlayer } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { userEmbedBuilder, defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Exibe um perfil de osu! no Fubika')
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

            const { embed, attachment } = await userEmbedBuilder(player)     

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            })

        }catch(error){
            let message
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                message = `Player \`${interaction.options.getString('player')}\` não encontrado!`
            else
                message = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(message)

            await interaction.editReply({ embeds: [embed] })
        }
    }
}