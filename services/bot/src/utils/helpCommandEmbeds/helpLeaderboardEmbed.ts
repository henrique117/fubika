import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpLeaderboardEmbed() {

    return new EmbedBuilder()
        .setDescription("```/leaderboard```\n**Exibe a leaderboard de um mapa.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`beatmap`: Url ou Id do mapa fornecido no uso do comando, ou numa mensagem marcada, ou contida no chat.",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!lb [bmap url / id]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!leaderboard`\n`!lb https://fubika.com.br/\nbeatmap/70077`\n`!lb 70077`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`lb`",
                inline: true
            },
        )

        .setColor(COLORS.blue)
}