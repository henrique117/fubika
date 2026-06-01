import { EmbedBuilder, time, TimestampStyles } from "discord.js"
import { IPlayer, IScore } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"
import { scoreGradeToEmoji, applyModsToStats, formatTime, capitalizeFirstLetter } from "../utils.export"

export default async function topIndexEmbedBuilder(player: IPlayer, score: IScore, index: number): Promise<EmbedBuilder> {

    if (!score.beatmap)
        throw new Error("Score's beatmap data are missing")

    const tab = "\u2003"
    const options = {
        maximumFractionDigits: 2
    }

    const beatmap = score.beatmap
    const { bpm, length } = applyModsToStats(beatmap.bpm, beatmap.total_length, score.mods)
    // DEFINIR DEPOIS COMO VÃO SER CALCULADOS CS, AR, OD, HP DO SCORE
    // + OTHERS SCORES ON THE BEATMAP POSTERIORMENTE
    const displayMods = score.mods === '' ? '' : `+${score.mods}`

    const mapUrl = `https://fubika.com.br/beatmap/${beatmap.beatmap_id}`
    const hidden_link = `[\u2800](https://osu.ppy.sh/b/${beatmap.beatmap_id})`

    return new EmbedBuilder()
        .setAuthor({ 
            name: `${player.name}: ${player.pp}pp (#${player.rank})`, 
            iconURL: URLS.fubikaIcon,
            url: player.url
        }) //                                       Mudar --->  score.star_rating.toLocaleString('en-US', options)}
        .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
        .setURL(mapUrl)
        .setColor(COLORS.blue)
        .setThumbnail(beatmap.thumbnail)
        .setDescription(`
### __Personal Best #${index}__
${scoreGradeToEmoji(score.grade)} **${displayMods}${tab}${score.score.toLocaleString('en-US')}${tab}${score.acc.toLocaleString('en-US', options)}%**${tab}${time(new Date(score.play_time), TimestampStyles.RelativeTime)}
**${score.pp.toLocaleString('en-US', options)}PP** • **${score.max_combo}x**/${beatmap.max_combo}x • ${score.nmiss}${EMOJIS.miss}
\`${formatTime(length)}\` • \`${bpm}\` BPM • \`CS: ${beatmap.cs} AR: ${beatmap.ar} OD: ${beatmap.od} HP: ${beatmap.hp}\`${hidden_link}
        `) // Mudar o campo do PP para **${score.pp.toLocaleString('en-US', options)}**/${score.maxPP.toLocaleString('en-US', options)}PP quando tiver maxPP no objeto score
        .setFooter({ 
            text: `Mapset by ${beatmap.author_name} • ${capitalizeFirstLetter(beatmap.status)}`,
            iconURL: URLS.std
        })
}