import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, Message, AttachmentBuilder } from 'discord.js'

export default async function embedPagination(interaction: CommandInteraction | Message, pages: EmbedBuilder[], string: string = "", disapear: boolean = false, time: number = 40000, attachment?: AttachmentBuilder): Promise<void> {
    
    if (!interaction || !pages || pages.length === 0) {
        if (interaction instanceof CommandInteraction) {
            const replyMethod = (interaction.deferred || interaction.replied) ? 'editReply' : 'reply';
            await interaction[replyMethod]({ content: 'No pages found', ephemeral: true }).catch(() => {});
        } else if (interaction instanceof Message) {
            await interaction.reply('No pages found').catch(() => {});
        }
        return;
    }

    if (pages.length === 1) {
        if (interaction instanceof CommandInteraction) {
            const replyMethod = (interaction.deferred || interaction.replied) ? 'editReply' : 'reply';
            await interaction[replyMethod]({ content: string, embeds: [pages[0]!.data], components: [], files: attachment ? [attachment] : [] });
            return;
        } else {
            await interaction.reply({ content: string, embeds: [pages[0]!.data], components: [], files: attachment ? [attachment] : [] });
            return;
        }
    }

    let index = 0
    const first = new ButtonBuilder().setCustomId('pagefirst').setEmoji('⏮️').setStyle(ButtonStyle.Primary).setDisabled(true)
    const prev = new ButtonBuilder().setCustomId('pageprev').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(true)
    const pageCount = new ButtonBuilder().setCustomId('pagecount').setLabel(`${index + 1}/${pages.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true)
    const next = new ButtonBuilder().setCustomId('pagenext').setEmoji('➡️').setStyle(ButtonStyle.Primary)
    const last = new ButtonBuilder().setCustomId('pagelast').setEmoji('⏩').setStyle(ButtonStyle.Primary)

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(first, prev, pageCount, next, last)
    
    let msg: Message;

    try {
        if (interaction instanceof CommandInteraction) {
            if (interaction.deferred || interaction.replied) {
                msg = await interaction.editReply({ 
                    content: string, 
                    embeds: [pages[index]!.data], 
                    components: [buttons],
                    files: attachment ? [attachment] : []
                });
            } else {
                msg = await interaction.reply({ 
                    content: string, 
                    embeds: [pages[index]!.data], 
                    components: [buttons], 
                    fetchReply: true,
                    files: attachment ? [attachment] : []
                });
            }
        } 
        else if (interaction instanceof Message) {
            msg = await interaction.reply({ 
                content: string, 
                embeds: [pages[index]!.data], 
                components: [buttons],
                files: attachment ? [attachment] : []
            });
        } else {
            return;
        }

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time
        })

        collector.on('collect', async (i: any) => {
            // Opcional: Travar para outros usuários
            // if (i.user.id !== (interaction instanceof CommandInteraction ? interaction.user.id : interaction.author.id)) {
            //    return await i.reply({ content: `You can't use this button!`, ephemeral: true });
            // }

            await i.deferUpdate();

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
                await msg.edit({ embeds: [pages[index]!.data], components: [] }).catch(() => {})
            } else {
                if (msg.deletable) await msg.delete().catch(() => {})
                if (interaction instanceof Message && interaction.deletable) await interaction.delete().catch(() => {})
            }
        })

        // return msg;

    } catch (e) {
        console.error("Erro na paginação: ", e);
        
        if (interaction instanceof CommandInteraction && !interaction.replied) {
             await interaction.editReply({ content: 'Error on loading pages' }).catch(() => {});
        }
    }
}