import { EmbedBuilder } from "discord.js"
import { URLS, COLORS } from "../../constants"

export default function defaultHelpEmbed() {

    
    const fubasId = '1450602338925543537'
    const loopyngId = '332172346159005746'
    const iccyId = '520994132458471438'

    
    const perguntasFrequentesId = '1450677083297812552'
    const suporteId = '1450659150257459292'
    const sugestoesId = '1450668789799587842'
    const reportarBugsId = '1450670486974496878'
    const anunciosId = '1450678501903437988'
    const desenvolvimentoId = '1450677331000688745'

    return new EmbedBuilder()
        .setAuthor({
            name: "Bot Fubas",
            iconURL: URLS.fubikaIcon,
        })
        .setDescription(`O <@${fubasId}> é um bot desenvolvido por <@${loopyngId}> e <@${iccyId}> escpecificamente para o **Fubika** para permitir integrações diretas do servidor com o Discord.`)
        .addFields(
            {
                name: "Lista de Comandos 💬",
                value: "`compare` `help` `leaderboard` `ranking` `recent` `recent-list` `top` `user` `/change-avatar`",
                inline: false
            },
            {
                name: "Quer mais informações de algum comando? 💭",
                value: "Especifique o nome dele com `/help command:_` ou `!help [command]`",
                inline: false
            },
            {
                name: "Dúvida ou Suporte ❓",
                value: `Confira <#${perguntasFrequentesId}>\ne <#${suporteId}>!`,
                inline: true
            },
            {
                name: "Bugs e Sugestões 💡",
                value: `Sinta-se livre para mandar em <#${sugestoesId}> ou <#${reportarBugsId}>`,
                inline: true
            },
            {
                name: "Novidades 👀",
                value: `Fique de olho em <#${anunciosId}> e <#${desenvolvimentoId}>!`,
                inline: true
            },
        )
        .setColor(COLORS.blue)
}
