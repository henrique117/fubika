import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpRankingEmbed() {

    return new EmbedBuilder()
        .setDescription("```/ranking```\n**Exibe o pp ranking do servidor de um determinado modo.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`gamemode`:  Modo de jogo desejado (taiko, ctb, mania ou std por padrão).",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!ranking [gamemode]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!ranking`\n`!ppr mania`\n`!ppr m`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`ppr`, `pplb`,\n`ppranking`,\n`ppleaderboard`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}