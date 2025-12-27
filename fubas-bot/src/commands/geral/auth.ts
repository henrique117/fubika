import { postCheckLink } from "../../services/apiCalls";
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js"
import { defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('auth')
        .setDescription('Verifica um código gerado para linkagem ao discord')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('Código gerado')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        try{
            
            const insertedCode = interaction.options.getString('code', true); // Pega o code fornecido no comando
            const { sucess, message } = await postCheckLink(interaction.user.id, insertedCode)

            const messageComplement = sucess ? '!' : ''

            const embed = await defaultEmbedBuilder(message + messageComplement)

            await interaction.followUp({
                ephemeral: true,
                embeds: [embed]
            })

        }catch(error){
            const message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await interaction.followUp({
                ephemeral: true,
                embeds: [embed]
            })
        }
    }
}