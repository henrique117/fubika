import { EmbedBuilder, AttachmentBuilder, time, TimestampStyles } from "discord.js"
import { IPlayer } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"
import { scoreGradeToEmoji } from "../utils.export"

export default async function top200EmbedsBuilder(player: IPlayer): Promise<{ embeds: EmbedBuilder[], attachment: AttachmentBuilder }> {

    const options = {
        maximumFractionDigits: 2
    }

    const avatarAttachment = new AttachmentBuilder(player.pfp, { name: 'profile.png' })
    const embeds: EmbedBuilder[] = []
    const scoresPerPage = 10

    if (!player.top_200) {
        throw new Error("Scores data are missing")

    }else if (player.top_200.length === 0) {

        const embed = new EmbedBuilder()
        .setAuthor({
            name: `${player.name}: ${player.pp.toLocaleString('en-US')}pp (#${player.rank})`,
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setColor(COLORS.blue)
        .setThumbnail('attachment:
        .setDescription('Este player ainda não possui scores!')
        .setFooter({
            text: 'Mode: osu!',
            iconURL: URLS.std
        })

        embeds.push(embed)
        return { embeds, attachment: avatarAttachment }
    }

    for (let i = 0; i < player.top_200.length; i += scoresPerPage) {

        const currentScoresChunk = player.top_200.slice(i, i + scoresPerPage)

        const description = currentScoresChunk.map((score, index) => {

            if (!score.beatmap){
                throw new Error("Some score data is missing")
            }

            const position = i + index + 1;
            const displayMiss = score.nmiss > 0 ? `${score.nmiss}${EMOJIS.miss}` : ''
            const displayMods = score.mods === '' ? '' : `+${score.mods}`

            const MAX_TOTAL = 40
            const MAX_DIFF = 18

            let tempTitle = score.beatmap.title
            let tempDiff = score.beatmap.diff

            if (tempTitle.length + tempDiff.length + 3 > MAX_TOTAL) {

                if (tempDiff.length > MAX_DIFF) {
                    tempDiff = tempDiff.substring(0, MAX_DIFF - 3) + "..."
                }

                const spaceForTitle = MAX_TOTAL - (tempDiff.length + 3)

                if (tempTitle.length > spaceForTitle) {
                    tempTitle = tempTitle.substring(0, Math.max(0, spaceForTitle - 3)) + "..."
                }
            }

            const fullDisplay = `${tempTitle} [${tempDiff}]`

            const mapUrl = `https:

            const line1 = `**#${position} [${fullDisplay}](${mapUrl})** [${score.beatmap.star_rating.toLocaleString('en-US', options)}★]`

            const line2 = `${scoreGradeToEmoji(score.grade)} **${score.pp.toLocaleString('en-US', options)}pp** (${score.acc.toLocaleString('en-US', options)}%) [**${score.max_combo}x**/${score.beatmap.max_combo}x] ${displayMiss}**${displayMods} **${time(new Date(score.play_time), TimestampStyles.RelativeTime)}`

            return `${line1}\n${line2}`
        }).join('\n')

        const embed = new EmbedBuilder()
        .setAuthor({
            name: `${player.name}: ${player.pp.toLocaleString('en-US', options)}pp (#${player.rank})`,
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setColor(COLORS.blue)
        .setThumbnail('attachment:
        .setDescription(description)
        .setFooter({
            text: `Page ${Math.floor(i / scoresPerPage) + 1}/${Math.ceil(player.top_200.length / scoresPerPage)} • Mode: osu!`,
            iconURL: URLS.std
        })

        embeds.push(embed)
    }

    return { embeds, attachment: avatarAttachment }
}
