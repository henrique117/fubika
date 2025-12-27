import { postInvite } from "../../services/apiCalls"
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, MessageFlags } from "discord.js"
import { URLS, COLORS } from "../../constants"

export default {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Cria um código de invite para o server do Fubika'),

    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        
        try{

            const { code } = await postInvite(interaction.user.id)    

            await interaction.user.send("Seu código é: " + code)
            
            const embed = new EmbedBuilder()
            .setColor(COLORS.blue)
            .setDescription('O código foi enviado para sua DM!')
            .setFooter({ 
                text: 'osu! Fubika Server',
                iconURL: URLS.fubikaIcon
            });

            await interaction.followUp({
                ephemeral: true,
                embeds: [embed]
            })

        }catch(error){

            await interaction.followUp(String(error))
        }
    }
}