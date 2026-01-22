import { EmbedBuilder, time, TimestampStyles } from "discord.js"
import { IPlayer, IScore } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"
import { scoreGradeToEmoji, applyModsToStats, formatTime, capitalizeFirstLetter } from "../utils.export"

export default async function recentEmbedBuilder(player: IPlayer, score: IScore): Promise<EmbedBuilder> {
    if (!score.beatmap)
        throw new Error("Beatmap data is missing")

    const tab = "\u2003"
    const options = {
        maximumFractionDigits: 2
    }

    const beatmap = score.beatmap
    const { bpm, length } = applyModsToStats(beatmap.bpm, beatmap.total_length, score.mods)
    // DEFINIR DEPOIS COMO VÃO SER CALCULADOS CS, AR, OD, HP DO SCORE
    const scoreRankPosition = player.top_200
        ? player.top_200.filter(s => Number(s.pp) > Number(score.pp)).length + 1
        : 0
    const displayIfRanked = beatmap.status !== 'ranked' ? ' (if ranked)' : ''
    const displayPersonalBest = scoreRankPosition <= 100 && score.grade !== 'F'
        ? `### __Personal Best #${scoreRankPosition}${displayIfRanked}__`
        : ''
    const displayMods = score.mods === '' ? '' : `+${score.mods}`
    const displayPP = score.grade === 'F'
        ? `~~${score.pp.toLocaleString('en-US', options)}PP~~` // Crossed
        : `${score.pp.toLocaleString('en-US', options)}PP`

    return new EmbedBuilder()
        .setAuthor({
            name: `${player.name}: ${player.pp.toLocaleString('en-US')}pp (#${player.rank})`,
            iconURL: URLS.fubikaIcon,
            url: player.url
        }) //                                           Mudar --->  beatmap.star_rating.toLocaleString('en-US', options)}
        .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
        .setURL(beatmap.url)
        .setColor(COLORS.blue)
        .setThumbnail(beatmap.thumbnail)
        .setDescription(`
${displayPersonalBest}
${scoreGradeToEmoji(score.grade)} **${displayMods}${tab}${score.score.toLocaleString('en-US')}${tab}${score.acc.toLocaleString('en-US', options)}%**${tab}${time(new Date(score.play_time), TimestampStyles.RelativeTime)}
**${displayPP}** • **${score.max_combo}x**/${beatmap.max_combo}x • ${score.nmiss}${EMOJIS.miss}
\`${formatTime(length)}\` • \`${bpm}\` BPM • \`CS: ${beatmap.cs} AR: ${beatmap.ar} OD: ${beatmap.od} HP: ${beatmap.hp}\`
        `) // Mudar o campo do PP para **${score.pp.toLocaleString('en-US', options)}**/${score.maxPP.toLocaleString('en-US', options)}PP quando tiver maxPP no objeto score
        .setFooter({
            text: `Mapset by ${beatmap.author_name} • ${capitalizeFirstLetter(beatmap.status)}`,
            iconURL: URLS.std
        });
}