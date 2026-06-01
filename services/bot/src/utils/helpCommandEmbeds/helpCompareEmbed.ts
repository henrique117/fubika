import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpCompareEmbed() {

    return new EmbedBuilder()
        .setDescription("```/compare```\n**Dado um player e um mapa, exibe sua melhor score no mapa.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`player`: Username do player. Caso não fornecido, será você.\n`beatmap`: Url ou Id do mapa fornecido no uso do comando, ou numa mensagem marcada, ou contida no chat.",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!c [username] \n[bmap url / id]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!compare +iccy`\n`!c +iccy https://fubika.com.br/\nbeatmap/70077`\n`!gap`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`c`, `gap`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}