import { Client, EmbedBuilder, TextChannel } from 'discord.js'
import { COLORS, GUILD_CONFIG, URLS } from '../constants'
import { getBeatmap } from '../services/apiCalls'

export async function sendSnipeEmbed(discordClient: Client, data: any) {
    const channel = discordClient.channels.cache.get(GUILD_CONFIG.channels.top_scores) as TextChannel
    if (!channel) return

    const beatmap = await getBeatmap(data.beatmap_id)

    const options = { maximumFractionDigits: 2 }
    const mapUrl = `https://fubika.com.br/beatmap/${data.beatmap_id}`
    const weapon = "︻╦デ╤━╼"

    const embed = new EmbedBuilder()
        .setAuthor({ name: "novo #1! SNIPED", iconURL: URLS.fubikaIcon })
        .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
        .setURL(mapUrl)
        .setThumbnail(beatmap.thumbnail)
        .setColor(COLORS.blue)
        .addFields(
            { name: "👑", value: `<@${data.player_discord_id}>`, inline: true },
            { name: "\u200B", value: `**${weapon}**`, inline: true },
            { name: "💀", value: `<@${data.victim_discord_id || 'ID_DESCONHECIDO'}>`, inline: true },
            
            { 
                name: "\u200B", 
                value: `**Score:** ${data.score.toLocaleString()}\n**PP:** ${data.pp.toFixed(2)}pp\n**Acc:** ${data.acc.toFixed(2)}%`, 
                inline: true 
            },
            { name: "\u200B", value: "\u200B", inline: true },
            { 
                name: "\u200B", 
                value: `**Score:** ${data.victim_score?.toLocaleString() || '0'}\n**PP:** ${data.victim_pp?.toFixed(2) || '0.00'}pp\n**Acc:** ${data.victim_acc?.toFixed(2) || '0.00'}%`,
                inline: true 
            }
        )
        .setFooter({ text: 'Snipe System • Fubika Online' })
        .setTimestamp()

    await channel.send({ content: `🎯 **SNIPE!** <@${data.player_discord_id}> derrubou o topo!`, embeds: [embed] })
}

export async function sendTop1Embed(discordClient: Client, data: any) {
    const channel = discordClient.channels.cache.get(GUILD_CONFIG.channels.top_scores) as TextChannel
    if (!channel) return

    const beatmap = await getBeatmap(data.beatmap_id)

    const options = { maximumFractionDigits: 2 }
    const mapUrl = `https://fubika.com.br/beatmap/${data.beatmap_id}`

    const embed = new EmbedBuilder()
        .setAuthor({ name: "novo #1!", iconURL: URLS.fubikaIcon })
        .setTitle(`${beatmap.title} [${beatmap.diff}] [${beatmap.star_rating.toLocaleString('en-US', options)}★]`)
        .setURL(mapUrl)
        .setThumbnail(beatmap.thumbnail)
        .setColor(COLORS.blue)
        .setDescription(`<@${data.player_discord_id}> garantiu a liderança absoluta no mapa!`)
        .addFields(
            { name: "Score", value: data.score.toLocaleString(), inline: true },
            { name: "Performance", value: `${data.pp.toFixed(2)}pp`, inline: true },
            { name: "Precisão", value: `${data.acc.toFixed(2)}%`, inline: true }
        )
        .setFooter({ text: 'Global Record • Fubika Online' })
        .setTimestamp()

    await channel.send({ content: `👑 **Novo Recorde!** <@${data.player_discord_id}> é o novo #1!`, embeds: [embed] })
}