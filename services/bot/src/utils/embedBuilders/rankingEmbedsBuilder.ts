import { EmbedBuilder } from "discord.js"
import { IPlayer } from "../../interfaces/interfaces.export"
import { URLS, COLORS } from "../../constants"

function getModeName(mode: number): string {
    switch (mode) {
        case 0: return "osu!"
        case 1: return "Taiko"
        case 2: return "Catch"
        case 3: return "Mania"
        default: return "Osu!"
    }
}

function getModeIcon(mode: number): string {
    switch (mode) {
        case 0: return URLS.std
        case 1: return URLS.taiko
        case 2: return URLS.ctb
        case 3: return URLS.mania
        default: return URLS.std
    }
}

export default async function leaderboardEmbedsBuilder(players: Array<IPlayer>, mode: number): Promise<Array<EmbedBuilder>> {

    const embeds: EmbedBuilder[] = []
    const playersPerPage = 20

    // Se não tiver jogadores
    if (!players || players.length === 0) {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Performance Ranking for ${getModeName(mode)}`,
                iconURL: URLS.fubikaIcon,
                url: 'https://fubika.com.br/ranking'
            })
            .setColor(COLORS.blue)
            .setDescription("Ainda não há jogadores neste ranking!")
            .setFooter({
                text: `Page 1/1`, 
                iconURL: getModeIcon(mode)
            })
        embeds.push(embed)
        return embeds
    }

    for (let i = 0; i < players.length; i += playersPerPage) {
        
        const pagePlayers = players.slice(i, i + playersPerPage)
        
        const leftSide = pagePlayers.slice(0, 10)
        const rightSide = pagePlayers.slice(10, 20)

        const maxRankLength = String(pagePlayers[pagePlayers.length - 1]?.rank).length
        const maxNameLenLeft = Math.max(...leftSide.map(p => p.name.length))
        const maxNameLenRight = rightSide.length > 0 ? Math.max(...rightSide.map(p => p.name.length)) : 0
        const maxPpLenLeft = Math.max(...leftSide.map(p => p.pp.toLocaleString('en-US').length))
        const maxPpLenRight = rightSide.length > 0 ? Math.max(...rightSide.map(p => p.pp.toLocaleString('en-US').length)) : 0

        const lines = leftSide.map((playerLeft, index) => {
            const playerRight = rightSide[index]

            const rankL = `#${playerLeft.rank}`.padEnd(maxRankLength + 1, ' ')
            const nameL = playerLeft.name.padEnd(maxNameLenLeft, ' ')
            const ppL = `${playerLeft.pp.toLocaleString('en-US').padStart(maxPpLenLeft, ' ')}pp`

            let line = `\` ${rankL} \` \` ${nameL} \` \`${ppL}\``

            if (playerRight) {
                const rankR = `#${playerRight.rank}`.padEnd(maxRankLength + 1, ' ')
                const nameR = playerRight.name.padEnd(maxNameLenRight, ' ')
                const ppR = `${playerRight.pp.toLocaleString('en-US').padStart(maxPpLenRight, ' ')}pp`

                line += ` | \` ${rankR} \` \` ${nameR} \` \`${ppR}\``
            }

            return line
        })

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Performance Ranking for ${getModeName(mode)}`,
                url: 'https://fubika.com.br/ranking',
                iconURL: URLS.fubikaIcon
            })
            .setColor(COLORS.blue)
            .setDescription(lines.join('\n'))
            .setFooter({
                text: `Page ${Math.floor(i / playersPerPage) + 1}/${Math.ceil(players.length / playersPerPage)}`, 
                iconURL: getModeIcon(mode)
            })

        embeds.push(embed)
    }

    return embeds
}