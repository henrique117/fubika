import { postCreateLink } from "../../services/apiCalls";
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js"
import { defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('osu-link')
        .setDescription('Manda um código de autorização para sua DM em jogo')
        .addStringOption(option => 
            option.setName('nick')
                .setDescription('Nick do Fubika para linkar ao seu discord')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        try{
            
            const insertedNick = interaction.options.getString('nick', true); // Pega o nick fornecido no comando
            const { success, message } = await postCreateLink(interaction.user.id, insertedNick)
            
            const messageComplement = success ? '\nProssiga utilizando \`/auth\` para inserir o código!' : ''

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