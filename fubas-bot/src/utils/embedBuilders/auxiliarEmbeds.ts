import { EmbedBuilder, AttachmentBuilder, Attachment } from "discord.js"
import { IPlayer } from "../../interfaces/interfaces.export"
import { URLS, COLORS } from "../../constants"

export async function defaultEmbedBuilder(description: string): Promise<EmbedBuilder> {

    return new EmbedBuilder()
        .setAuthor({
            name: 'osu! Fubika Server',
            iconURL: URLS.fubikaIcon
        })
        .setColor(COLORS.blue)
        .setDescription(description)
}

export async function noRecentScoresEmbedBuilder(player: IPlayer): Promise<{ embed: EmbedBuilder, attachment: AttachmentBuilder }> {
    
    const avatarAttachment = new AttachmentBuilder(player.pfp, { name: 'profile.png' })

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `${player.name}: ${player.pp.toLocaleString('en-US')}pp (#${player.rank})`, 
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setColor(COLORS.blue)
        .setThumbnail('attachment://profile.png')
        .setDescription('Este player ainda não possui scores!')

    return { embed, attachment: avatarAttachment }
}

export async function noIndexScoresEmbedBuilder(player: IPlayer): Promise<{ embed: EmbedBuilder, attachment: AttachmentBuilder }> {
    
    const avatarAttachment = new AttachmentBuilder(player.pfp, { name: 'profile.png' })

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `${player.name}: ${player.pp.toLocaleString('en-US')}pp (#${player.rank})`, 
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setColor(COLORS.blue)
        .setThumbnail('attachment://profile.png')
        .setDescription('Este player ainda não possui scores no index!')

    return { embed, attachment: avatarAttachment }
}

export async function changeAvatarEmbedBuilder(attachment: Attachment) {
    
    return new EmbedBuilder()
        .setAuthor({
            name: 'osu! Fubika Server',
            iconURL: URLS.fubikaIcon
        })
        .setColor(COLORS.blue)
        .setThumbnail(attachment.url)
        .setDescription('A sua foto de perfil foi alterada com sucesso.')
        .setFooter({ text: 'Reinicie o jogo para visualizar a alteração!'})
}