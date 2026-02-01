import { TextBasedChannel } from "discord.js"

export async function extractBeatmapId(beatmapLink: string): Promise<string> {
    
    const parts = beatmapLink.split('/').filter(part => part.trim() !== "")
    return String(parts[parts.length - 1])
}

const OSU_URL_REGEX = /(?:https?:\/\/)?osu\.ppy\.sh\/(?:b\/|beatmaps\/|beatmapsets\/\d+#(?:osu|taiko|fruits|mania)\/)(\d+)/
const FUBIKA_URL_REGEX = /(?:https?:\/\/)?fubika\.com\.br\/beatmap\/(\d+)/
const RAW_ID_REGEX = /^\s*(\d+)\s*$/

export async function fetchLastBeatmapId(channel: TextBasedChannel | null): Promise<string | null> {

    if (!channel)
        return null

    try{
        const messages = await channel.messages.fetch({ limit: 50 })
        
        for (const [_, msg] of messages) { // Itera das mais recentes para mais antigas

            const content = msg.content

            // 1. Verifica links na mensagem
            const osuMatch = content.match(OSU_URL_REGEX)
            if (osuMatch)
                return osuMatch[1] ?? null

            const fubikaMatch = content.match(FUBIKA_URL_REGEX)
            if (fubikaMatch)
                return fubikaMatch[1] ?? null

            // 2. Verifica dentro de embeds
            if (msg.embeds.length > 0) {
                for (const embed of msg.embeds) {

                    const contentToCheck = [embed.url, embed.author?.url, embed.description].join(' ')

                    const embedOsu = contentToCheck.match(OSU_URL_REGEX)
                    if (embedOsu)
                        return embedOsu[1] ?? null

                    const embedFubika = contentToCheck.match(FUBIKA_URL_REGEX)
                    if (embedFubika)
                        return embedFubika[1] ?? null
                }
            }

            // 3. Verifica id puro com pelo menos 5 dígitos
            const rawIdMatch = content.match(RAW_ID_REGEX)
            if (rawIdMatch && rawIdMatch[1]) {

                const potentialId = rawIdMatch[1]

                if (potentialId.length >= 5)
                return rawIdMatch[1] ?? null
            }
        }

    }catch(error){
        console.error("Erro ao buscar histórico de mensagens:", error)
    }

    return null
}