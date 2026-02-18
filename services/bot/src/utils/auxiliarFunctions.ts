import { ChatInputCommandInteraction, Message, PartialGroupDMChannel, TextBasedChannel } from "discord.js"
import { REGEX } from "../constants"

export async function reply(source: ChatInputCommandInteraction | Message, content: any) {

    if (source instanceof ChatInputCommandInteraction)
        return await source.editReply(content)
    else if (!(source.channel instanceof PartialGroupDMChannel))
        return await source.channel.send(content)
    return
}

export async function extractBeatmapId(beatmapLink: string): Promise<string> {
    
    const parts = beatmapLink.split('/').filter(part => part.trim() !== "")
    return String(parts[parts.length - 1])
}

export async function getBeatmapIdFromMessage(msg: Message) {
    
    const content = msg.content

    // 1. Verifica links na mensagem
    const osuMatch = content.match(REGEX.osuUrl)
    if (osuMatch)
        return osuMatch[1] ?? null

    const fubikaMatch = content.match(REGEX.fubikaUrl)
    if (fubikaMatch)
        return fubikaMatch[1] ?? null

    // 2. Verifica dentro de embeds
    if (msg.embeds.length > 0) {
        for (const embed of msg.embeds) {

            const contentToCheck = [embed.url, embed.author?.url, embed.description].join(' ')

            const embedOsu = contentToCheck.match(REGEX.osuUrl)
            if (embedOsu)
                return embedOsu[1] ?? null

            const embedFubika = contentToCheck.match(REGEX.fubikaUrl)
            if (embedFubika)
                return embedFubika[1] ?? null
        }
    }

    // 3. Verifica id puro com pelo menos 5 dígitos
    const rawIdMatch = content.match(REGEX.rawId)
    if (rawIdMatch && rawIdMatch[1]) {

        const potentialId = rawIdMatch[1]

        if (potentialId.length >= 5)
        return rawIdMatch[1] 
    }
    
    return null
}

export async function fetchLastBeatmapId(channel: TextBasedChannel | null): Promise<string | null> {

    if (!channel)
        return null

    try{
        const messages = await channel.messages.fetch({ limit: 50 })
        
        for (const [_, msg] of messages) { // Itera das mais recentes para mais antigas

            const beatmapId = await getBeatmapIdFromMessage(msg)
            if (beatmapId) return beatmapId
        }

    }catch(error){
        console.error("Erro ao buscar histórico de mensagens:", error)
    }

    return null
}