import { postChangeAvatar } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Attachment, MessageFlags } from "discord.js"
import axios from "axios"
import { defaultEmbedBuilder, changeAvatarEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('change-avatar')
        .setDescription('Atualiza a sua foto de perfil no servidor de osu!')
        .addAttachmentOption(option => 
            option.setName('imagem')
                .setDescription('A nova imagem para o seu perfil (PNG/JPG)')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

        const attachment = interaction.options.getAttachment('imagem') as Attachment
        const MAX_SIZE = 2 * 1024 * 1024;

        if (!attachment.contentType?.startsWith('image/')) {
            const embed = await defaultEmbedBuilder('O arquivo enviado não é uma imagem válida!')
            await interaction.editReply({ embeds: [embed] })
            return
        }

        if (attachment.size > MAX_SIZE) {
            const embed = await defaultEmbedBuilder(`A imagem é muito grande! O limite é de **2MB**. (A sua tem ${(attachment.size / (1024 * 1024)).toFixed(2)}MB)`)
            await interaction.editReply({ embeds: [embed] })
            return
        }

        try {
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' })
            const buffer = Buffer.from(response.data)

            await postChangeAvatar(interaction.user.id, buffer)

            const successEmbed = await changeAvatarEmbedBuilder(attachment)

            await interaction.editReply({ embeds: [successEmbed] })

        } catch (error: any) {            
            const errorMsg = error.response?.data?.message || 'Erro interno ao processar o upload.'

            const embed = await defaultEmbedBuilder(`Falha ao atualizar avatar: **${errorMsg}**`)

            await interaction.editReply({ embeds: [embed] })
        }
    },
}