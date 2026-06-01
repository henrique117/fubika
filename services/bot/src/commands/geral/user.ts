import { executeUserProfile } from "../../services/logic/userProfile.logic"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, userEmbedBuilder, defaultEmbedBuilder, parseOnlyUsername } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Exibe um perfil de osu! no Fubika')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        ),

    aliases: ['std', 'osu', 'u'],

    isAdmin: false,
    isDestructive: false,

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player')

        await this.handleUserCommand(interaction, username)
    },

    async executePrefix(message: Message) {

        const { username } = await parseOnlyUsername(message.content)

        await this.handleUserCommand(message, username)
    },

    async handleUserCommand(source: ChatInputCommandInteraction | Message, username: string | null) {
        try {

            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const result = await executeUserProfile(username, user.id)

            if (!result.success) {
                const embed = await defaultEmbedBuilder(result.error || 'Erro ao buscar player')
                await reply(source, { embeds: [embed] })
                return
            }

            const { embed, attachment } = await userEmbedBuilder(result.player)

            await reply(source, {
                embeds: [embed],
                files: [attachment]
            })

        } catch (error) {
            const embed = await defaultEmbedBuilder(String(error))
            await reply(source, { embeds: [embed] })
        }
    }
}
