import { EmbedBuilder, AttachmentBuilder } from "discord.js"
import { IPlayer } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"

export default async function userEmbedBuilder(player: IPlayer): Promise<{ embed: EmbedBuilder, attachment: AttachmentBuilder }> {

    const options = {
        maximumFractionDigits: 2 
    };

    const avatarAttachment = new AttachmentBuilder(player.pfp, { name: 'profile.png' })
    const displayLastActivity = player.last_activity === "Online" ? "Online no Fubika" : `Última vez online ${player.last_activity} no Fubika`
    const displayLastActivityIcon = player.last_activity === "Online" ? URLS.greenDot  : URLS.redDot
    let displayPlaytime
    if (player.playtime < 3600)
        displayPlaytime = `${Math.round(player.playtime / 60)} mins`
    else if (Math.round(player.playtime / 3600) === 1)
        displayPlaytime = '1 hr'
    else 
        displayPlaytime = `${Math.round(player.playtime / 3600).toLocaleString('en-US')} hrs`

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `osu! Standard Profile for ${player.name}`, 
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setColor(COLORS.blue)
        .setThumbnail('attachment://profile.png')
        .setDescription(`
• **Fubika Rank:** \`#${player.rank}\`
• **PP:** \`${player.pp.toLocaleString('en-US')}\` • **Acc:** \`${player.acc.toLocaleString('en-US', options)}%\`
• **Level:** \`${player.level.toLocaleString('en-US', options)}%\`
• **Playcount:** \`${player.playcount.toLocaleString('en-US')}\` (\`${displayPlaytime}\`)
•  ${EMOJIS.rankXH} \`${player.ssh_count}\` ${EMOJIS.rankX} \`${player.ss_count}\` ${EMOJIS.rankSH} \`${player.sh_count}\` ${EMOJIS.rankS} \`${player.s_count}\` ${EMOJIS.rankA} \`${player.a_count}\`
        `)
        .setFooter({ 
            text: displayLastActivity, 
            iconURL: displayLastActivityIcon
        });

    return { embed, attachment: avatarAttachment }
}