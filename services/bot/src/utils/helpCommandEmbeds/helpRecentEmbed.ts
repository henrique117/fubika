import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpRecentEmbed() {

    return new EmbedBuilder()
        .setDescription("```/recent```\n**Exibe o score mais recente de um player.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`player`: Username do player. Caso não fornecido, será você.\n`index`: Posição do score na sua lista de recentes (`!r2` exibe o 2º score mais recente)",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!rs [username]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!recent`\n`!rs +iccy`\n`!r2 +iccy`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`r`, `rs`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}
