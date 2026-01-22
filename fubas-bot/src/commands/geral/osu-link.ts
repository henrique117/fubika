import { postCreateLink, postCheckLink } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, Message, GuildMember, TextChannel } from "discord.js"
import { defaultEmbedBuilder } from "../../utils/utils.export"
import { GUILD_CONFIG } from "../../constants"

export default {
    data: new SlashCommandBuilder()
        .setName('osu-link')
        .setDescription('Vincula seu discord a uma conta do servidor')
        .addStringOption(option =>
            option.setName('nick')
                .setDescription('Nick do Fubika')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        try {

            const insertedNick = interaction.options.getString('nick', true) // Pega o nick fornecido no comando
            const { message } = await postCreateLink(interaction.user.id, insertedNick.replace(" ", "_").toLowerCase())

            const followUpEmbed = await defaultEmbedBuilder(message + '\nEnvie-o em minha DM para concluir a vinculação!')

            await interaction.followUp({
                ephemeral: true,
                embeds: [followUpEmbed]
            })

            const dmChannel = await interaction.user.createDM()
            await dmChannel.send('**Insira seu código:**')

            // --- Loop coletor do postCheckLink ---
            let tries = 0
            const maxTries = 3
            let sucess = false
            let loadingMsg: Message | null = null

            while (tries < maxTries && !sucess) {

                try {
                    const filter = (m: Message) => m.author.id === interaction.user.id
                    const collected = await dmChannel.awaitMessages({
                        filter,
                        max: 1,
                        time: 60_000,
                        errors: ['time']
                    })

                    const userMessage = collected.first()
                    if (!userMessage) return

                    const userInput = userMessage.content.trim()

                    loadingMsg = await dmChannel.send('🔄 Verificando código...')

                    await postCheckLink(interaction.user.id, userInput)

                    sucess = true
                    await loadingMsg.delete()
                    await dmChannel.send('✅ **Conta vinculada com sucesso!**')

                } catch (error: any) {
                    tries++

                    if (loadingMsg)
                        await loadingMsg.delete().catch(() => { })

                    if (error instanceof Map || error.message?.includes('time')) {
                        await dmChannel.send('⏰ **Tempo esgotado**\nUse o comando no servidor novamente.')
                        return
                    }

                    if (tries === maxTries) {
                        await dmChannel.send('❌ **Código incorreto.** Você excedeu o número máximo de tentativas!\nUse o comando no servidor novamente.')
                    } else if (error.message.includes('Erro interno ao processar vinculação')) {
                        await dmChannel.send(`⚠️ **Código incorreto** (Tentativa ${tries}/${maxTries})\n\nTente novamente:`)
                    } else {
                        const message = error.message || 'Erro desconhecido'

                        await dmChannel.send(`⚠️ **Erro:** ${message} (Tentativa ${tries}/${maxTries})\n\nTente novamente:`)
                    }
                }
            }

            // Lógica para dar cargo verificado e notificar #verificados
            const member = interaction.member as GuildMember
            const channel = interaction.guild?.channels.cache.get(GUILD_CONFIG.channels.verificados) as TextChannel

            try {
                if (member)
                    await member.roles.add(GUILD_CONFIG.roles.verificado)

                if (channel) {
                    await channel.send({
                        content: `${member} verificou com \`${insertedNick}\``,
                    })
                }

            } catch (error) {
                console.error("Erro ao processar cargo/aviso de verificação:", error)
            }

        } catch (error) {
            let message
            if (String(error).includes('Usuário não encontrado'))
                message = `Usuário \`${interaction.options.getString('nick')}\` não encontrado!`
            else if (String(error).includes('usuário já está vinculado'))
                message = `Usuário \`${interaction.options.getString('nick')}\` já está vinculado a um Discord!`
            else
                message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await interaction.followUp({
                ephemeral: true,
                embeds: [embed]
            })
        }
    }
}