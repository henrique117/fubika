import { EmbedBuilder } from "discord.js"
import { COLORS } from "../../constants"

export default function helpUserEmbed() {

    return new EmbedBuilder()
        .setDescription("```/user```\n**Exibe as estatísticas do perfil de um player.**")
        .addFields(
            {
                name: "Parâmetros",
                value: "`player`: Username do player. Caso não fornecido, será você.",
                inline: false
            },
            {
                name: "Como usar",
                value: "`!user [username]`",
                inline: true
            },
            {
                name: "Exemplos",
                value: "`!user`\n`!osu +iccy`\n`!u +iccy`",
                inline: true
            },
            {
                name: "Alternativas",
                value: "`std`, `osu`, `u`",
                inline: true
            },
        )
        .setColor(COLORS.blue)
}