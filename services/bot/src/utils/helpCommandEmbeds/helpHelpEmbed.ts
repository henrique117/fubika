import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpHelpEmbed() {

    return new EmbedBuilder()
        .setDescription("```/help```\n**Lista informações gerais, ou de um comando em específico.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`command`: Nome ou nome alternativo do comando desejado.",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!help [command]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!help`\n`!help compare`\n`!h c`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`h`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}