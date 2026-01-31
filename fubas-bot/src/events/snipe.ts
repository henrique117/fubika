import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import { COLORS, GUILD_CONFIG, URLS } from '../constants'
import { getBeatmap } from '../services/apiCalls'

const formatNum = (val: any, options?: Intl.NumberFormatOptions) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "0"
    return Number(val).toLocaleString('en-US', options)
}

export async function sendSnipeEmbed(discordClient: Client, data: any) {
    const channel = discordClient.channels.cache.get(GUILD_CONFIG.channels.top_scores) as TextChannel
    if (!channel) return

    try {
        const beatmap = await getBeatmap(data.beatmap_id)

        const options = { maximumFractionDigits: 2 }
        const mapUrl = `https://fubika.com.br/beatmap/${data.beatmap_id}`
        const hiddenUrl = `[\u2800](https://osu.ppy.sh/b/${data.beatmap_id})`
        const weapon = "︻╦デ╤━╼"

        const embed = new EmbedBuilder()
            .setAuthor({ name: "novo #1! SNIPED", iconURL: URLS.fubikaIcon })
            .setTitle(`${beatmap.title} [${beatmap.diff}] [${formatNum(beatmap.star_rating, options)}★]`)
            .setURL(mapUrl)
            .setThumbnail(beatmap.thumbnail)
            .setColor(COLORS.blue)
            .addFields(
                { name: "👑", value: data.player_discord_id ? `<@${data.player_discord_id}>` : `**${data.player_name}**`, inline: true },
                { name: "\u200B", value: `**${weapon}**`, inline: true },
                { name: "💀", value: data.victim_discord_id ? `<@${data.victim_discord_id}>` : `**${data.victim_name || 'Desconhecido'}**`, inline: true },
                
                { 
                    name: "\u200B",
                    value: `**Score:** ${formatNum(data.new_score)}\n**PP:** ${formatNum(data.new_pp, options)}pp\n**Acc:** ${formatNum(data.new_acc, options)}%`, 
                    inline: true 
                },
                { name: "\u200B", value: "\u200B", inline: true },
                { 
                    name: "\u200B", 
                    value: `**Score:** ${formatNum(data.victim_score)}\n**PP:** ${formatNum(data.victim_pp, options)}pp\n**Acc:** ${formatNum(data.victim_acc, options)}%`,
                    inline: true 
                }
            )
            .setFooter({ text: 'Snipe System • Fubika Online' })
            .setTimestamp()

        await channel.send({ content: `🎯 **SNIPE!** <@${data.player_discord_id}> snipou <@${data.victim_discord_id}>!${hiddenUrl}`, embeds: [embed] })
    } catch (err) {
        console.error("Erro ao enviar Snipe Embed:", err)
    }
}

export async function sendTop1Embed(discordClient: Client, data: any) {
    const channel = discordClient.channels.cache.get(GUILD_CONFIG.channels.top_scores) as TextChannel
    if (!channel) return

    try {
        const beatmap = await getBeatmap(data.beatmap_id)

        const options = { maximumFractionDigits: 2 }
        const mapUrl = `https://fubika.com.br/beatmap/${data.beatmap_id}`
        const hiddenUrl = `[\u2800](https://osu.ppy.sh/b/${data.beatmap_id})`

        const embed = new EmbedBuilder()
            .setAuthor({ name: "novo #1!", iconURL: URLS.fubikaIcon })
            .setTitle(`${beatmap.title} [${beatmap.diff}] [${formatNum(beatmap.star_rating, options)}★]`)
            .setURL(mapUrl)
            .setThumbnail(beatmap.thumbnail)
            .setColor(COLORS.blue)
            .setDescription(`<@${data.player_discord_id}> garantiu a liderança absoluta no mapa!`)
            .addFields(
                { name: "Score", value: formatNum(data.new_score), inline: true },
                { name: "Performance", value: `${formatNum(data.new_pp, options)}pp`, inline: true },
                { name: "Precisão", value: `${formatNum(data.new_acc, options)}%`, inline: true }
            )
            .setFooter({ text: 'Global Record • Fubika Online' })
            .setTimestamp()

        await channel.send({ content: `👑 **Novo Recorde!** <@${data.player_discord_id}> é o novo #1!${hiddenUrl}`, embeds: [embed] })
    } catch (err) {
        console.error("Erro ao enviar Top 1 Embed:", err)
    }
}