import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpTopEmbed() {

    return new EmbedBuilder()
        .setDescription("```/top```\n**Lista as top plays de um player. **")
        .addFields(
            {
                name: "Parâmetros",
                value: "`player`: Username do player. Caso não fornecido, será você.\n`index`: Posição do score na sua lista de top plays (`!top2` exibe a 2ª top play)",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!top [username]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!top`\n`!t +iccy`\n`!t2 +iccy`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`t`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}
