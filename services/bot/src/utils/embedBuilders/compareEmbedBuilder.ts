import { EmbedBuilder, time, TimestampStyles } from "discord.js"
import { IBeatmap, IPlayer } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"
import { scoreGradeToEmoji, applyModsToStats, formatTime, capitalizeFirstLetter } from "../utils.export"

export default async function compareEmbedBuilder(beatmap: IBeatmap, player: IPlayer): Promise<EmbedBuilder> {

    const tab = "\u2003"
    const options = {
        maximumFractionDigits: 2
    }

    if (!beatmap.scores)
        throw new Error("Beatmap scores data are missing")

    const score = beatmap.scores.find(score => {

        if (!score.player)
            throw new Error("Player data are missing")

        return score.player.id === player.id
    })

    const mapUrl = `https:
    const hidden_link = `[\u2800](https:

    if (!score)
        return new EmbedBuilder()
            .setAuthor({
                name: `${player.name}: ${player.pp.toLocaleString('en-US')}pp (#${player.rank})`,
                iconURL: URLS.fubikaIcon,
                url: player.url
            })
            .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
            .setURL(mapUrl)
            .setColor(COLORS.blue)
            .setThumbnail(beatmap.thumbnail)
            .setDescription(`Este player ainda não possui scores no mapa!${hidden_link}`)
            .setFooter({
                text: `Mapset by ${beatmap.author_name} • ${capitalizeFirstLetter(beatmap.status)}`,
            })

    if (!score.player)
        throw new Error("Player data are missing")

    const { bpm, length } = applyModsToStats(beatmap.bpm, beatmap.total_length, score.mods)

    const scoreRankPosition = player.top_200
        ? player.top_200.filter(s => Number(s.pp) > Number(score.pp)).length + 1
        : 0
    const displayIfRanked = beatmap.status !== 'ranked' ? ' (if ranked)' : ''
    const displayPersonalBest = scoreRankPosition <= 50 && score.grade !== 'F'
        ? `### __Personal Best #${scoreRankPosition}${displayIfRanked}__`
        : ''
    const displayMods = score.mods === '' ? '' : `+${score.mods}`

    return new EmbedBuilder()
        .setAuthor({
            name: `${player.name}: ${player.pp}pp (#${player.rank})`,
            iconURL: URLS.fubikaIcon,
            url: player.url
        })
        .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
        .setURL(mapUrl)
        .setColor(COLORS.blue)
        .setThumbnail(beatmap.thumbnail)
        .setDescription(`
${displayPersonalBest}
${scoreGradeToEmoji(score.grade)} **${displayMods}${tab}${score.score.toLocaleString('en-US')}${tab}${score.acc.toLocaleString('en-US', options)}%**${tab}${time(new Date(score.play_time), TimestampStyles.RelativeTime)}
**${score.pp.toLocaleString('en-US', options)}PP** • **${score.max_combo}x**/${beatmap.max_combo}x • ${score.nmiss}${EMOJIS.miss}
\`${formatTime(length)}\` • \`${bpm}\` BPM • \`CS: ${beatmap.cs} AR: ${beatmap.ar} OD: ${beatmap.od} HP: ${beatmap.hp}\`${hidden_link}
        `)
        .setFooter({
            text: `Mapset by ${beatmap.author_name} • ${capitalizeFirstLetter(beatmap.status)}`,
            iconURL: URLS.std
        })
}
