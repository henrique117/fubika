import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, Message, AttachmentBuilder, PartialGroupDMChannel } from 'discord.js'

export default async function embedPagination(interaction: CommandInteraction | Message, pages: EmbedBuilder[], string: string = "", disapear: boolean = false, time: number = 40000, attachment?: AttachmentBuilder): Promise<void> {
    
    const sendResponse = async (payload: any): Promise<any> => {
        if (interaction instanceof CommandInteraction) {
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(payload)
            } else {
                try {
                    return await interaction.reply({ ...payload, fetchReply: true })
                } catch (err: any) {
                    if (err.code === 40060) { 
                        return await interaction.editReply(payload)
                    }
                    throw err
                }
            }
        } else if (!(interaction.channel instanceof PartialGroupDMChannel)){
            return await interaction.channel.send(payload)
        }
    }

    if (!interaction || !pages || pages.length === 0) {
        const payload = { content: 'No pages found', ephemeral: true }
        if (interaction instanceof CommandInteraction) {
             if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload).catch(() => {})
             } else {
                await interaction.reply(payload).catch(() => {})
             }
        } else {
            await interaction.reply('No pages found').catch(() => {})
        }
        return
    }

    if (pages.length === 1) {
        await sendResponse({ 
            content: string, 
            embeds: [pages[0]!.data], 
            components: [], 
            files: attachment ? [attachment] : [] 
        })
        return
    }

    let index = 0
    const first = new ButtonBuilder().setCustomId('pagefirst').setEmoji('⏮️').setStyle(ButtonStyle.Primary).setDisabled(true)
    const prev = new ButtonBuilder().setCustomId('pageprev').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(true)
    const pageCount = new ButtonBuilder().setCustomId('pagecount').setLabel(`${index + 1}/${pages.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true)
    const next = new ButtonBuilder().setCustomId('pagenext').setEmoji('➡️').setStyle(ButtonStyle.Primary)
    const last = new ButtonBuilder().setCustomId('pagelast').setEmoji('⏩').setStyle(ButtonStyle.Primary)

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(first, prev, pageCount, next, last)
    
    let msg: any

    try {
        msg = await sendResponse({ 
            content: string, 
            embeds: [pages[index]!.data], 
            components: [buttons],
            files: attachment ? [attachment] : []
        })

        if (!msg.createMessageComponentCollector && interaction instanceof CommandInteraction) {
            msg = await interaction.fetchReply();
        }

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time
        })

        collector.on('collect', async (i: any) => {
            if (i.user.id !== (interaction instanceof CommandInteraction ? interaction.user.id : interaction.author.id)) {
               return await i.reply({ content: `You can't use this button!`, ephemeral: true })
            }

            await i.deferUpdate()

            if (i.customId === 'pagefirst') index = 0
            else if (i.customId === 'pageprev' && index > 0) index--
            else if (i.customId === 'pagenext' && index < pages.length - 1) index++
            else if (i.customId === 'pagelast') index = pages.length - 1

            pageCount.setLabel(`${index + 1}/${pages.length}`)

            first.setDisabled(index === 0)
            prev.setDisabled(index === 0)
            next.setDisabled(index === pages.length - 1)
            last.setDisabled(index === pages.length - 1)

            await msg.edit({ content: string, embeds: [pages[index]!.data], components: [buttons] }).catch(console.log)
            collector.resetTimer()
        })

        collector.on("end", async () => {
            if (!disapear) {
                await msg.edit({ components: [] }).catch(() => {})
            } else {
                if (msg.deletable) await msg.delete().catch(() => {})
                if (interaction instanceof Message && interaction.deletable) await interaction.delete().catch(() => {})
            }
        })

    } catch (e) {
        console.error("Erro na paginação: ", e)
        
        if (interaction instanceof CommandInteraction && !interaction.replied) {
             const method = interaction.deferred ? 'editReply' : 'reply'
             await interaction[method]({ content: 'Error on loading pages', ephemeral: true }).catch(() => {})
        }
    }
}