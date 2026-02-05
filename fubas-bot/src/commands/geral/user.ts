import { getPlayer } from "../../services/apiCalls"
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

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const username = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando

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

            const finalUser = username || user.id  // Player fornecido || Player não foi fornecido

            const player = await getPlayer(finalUser)

            const { embed, attachment } = await userEmbedBuilder(player)

            await reply(source, {
                embeds: [embed],
                files: [attachment]
            })

        } catch (error) {
            let message
            if (String(error).includes('Usuário não encontrado')) // Player não encontrado
                message = `Player \`${username}\` não encontrado!`
            else
                message = String(error) // Outro erro

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
}