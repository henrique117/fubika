import { EmbedBuilder, time, TimestampStyles } from "discord.js"
import { IBeatmap } from "../../interfaces/interfaces.export"
import { URLS, EMOJIS, COLORS } from "../../constants"
import { scoreGradeToEmoji } from "../utils.export"

export default async function leaderboardEmbedsBuilder(beatmap: IBeatmap): Promise<Array<EmbedBuilder>> {
    
    const options = {
        maximumFractionDigits: 2
    }

    const embeds: EmbedBuilder[] = []
    const scoresPerPage = 10

    if (!beatmap.scores) { // Caso não haja o array de scores
        throw new Error("Scores data are missing")

    }else if (beatmap.scores.length === 0) { // Caso o array de scores seja vazio

        const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`,
            iconURL: URLS.fubikaIcon,
            url: beatmap.url
        })
        .setColor(COLORS.blue)
        .setThumbnail(beatmap.thumbnail)
        .setDescription('Ainda não há scores nesse beatmap!')
        .setFooter({ 
            text: 'Mode: osu!',
            iconURL: URLS.std
        });

        embeds.push(embed)
        return embeds
    }

    for (let i = 0; i < beatmap.scores.length; i += scoresPerPage) {

        const currentScoresChunk = beatmap.scores.slice(i, i + scoresPerPage)

        // Lógica de formatação dos scores
        const description = currentScoresChunk.map((score, index) => {

            if (!score.player) {
                throw new Error("Some player data are missing")
            }

            const position = i + index + 1; // Posição do score
            const displayMods = score.mods === '' ? '' : `+${score.mods}`
            const displayMiss = score.nmiss > 0 ? `${score.nmiss}${EMOJIS.miss}` : ''
            // Linha 1: #Número Usuário: Score [Combo] Mods  VVV **[${score.player.name}](${score.player.url}):** <--- Mudar
            const line1 = `**#${position}** **${score.player.name}:** ${score.score.toLocaleString('en-US')} [**${score.max_combo}x**/${beatmap.max_combo}x] **${displayMods} **`
            // Linha 2: Rank PP/maxPP • Acc • Miss Tempo 
            const line2 = `${scoreGradeToEmoji(score.grade)} **${score.pp.toLocaleString('en-US', options)}pp** • ${score.acc.toLocaleString('en-US', options)}% • ${displayMiss}${time(new Date(score.play_time), TimestampStyles.RelativeTime)}`
            // Junta as duas linhas
            return `${line1}\n${line2}`
        }).join('\n'); // Junta todos os scores
        
        const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`,
            iconURL: URLS.fubikaIcon,
            url: beatmap.url
        })
        .setColor(COLORS.blue)
        .setThumbnail(beatmap.thumbnail)
        .setDescription(description)
        .setFooter({ 
            text: `Page ${Math.floor(i / scoresPerPage) + 1}/${Math.ceil(beatmap.scores.length / scoresPerPage)} • Mode: osu!`,
            iconURL: URLS.std
        });
        
        embeds.push(embed); // Adiciona à lista de embeds
    }

    return embeds
}