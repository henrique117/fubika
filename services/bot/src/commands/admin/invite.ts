import { postCreateInvite } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js"
import { defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Cria um código de invite para o server do Fubika')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('Usuário que receberá o invite')
            .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        
        try{
            
            const { code } = await postCreateInvite(interaction.user.id)
            const inviteEmbed = await defaultEmbedBuilder(`▸**Chave de acesso:** ||**${code}**||`)
            
            let followUpEmbed
            const targetUser = interaction.options.getUser('user')
            if (targetUser === null) {

                await interaction.user.send({ embeds: [inviteEmbed] })
                followUpEmbed = await defaultEmbedBuilder(`O código foi enviado para a sua DM!`)
            
            }else{

                await targetUser.send({ embeds: [inviteEmbed] })
                followUpEmbed = await defaultEmbedBuilder(`O código foi enviado para a DM de \`${targetUser.tag}\`!`)
            }
            
            await interaction.followUp({
                ephemeral: true,
                embeds: [followUpEmbed]
            })

        }catch(error){

            await interaction.followUp(String(error))
        }
    }
}