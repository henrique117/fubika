import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpRecentListEmbed() {

    return new EmbedBuilder()
        .setDescription("```/recentlist```\n**Lista os scores mais recentes de um player.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`player`: Username do player. Caso não fornecido, será você.",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!rl [username]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!recentlist`\n`!rl`\n`!rl +iccy`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`rl`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}