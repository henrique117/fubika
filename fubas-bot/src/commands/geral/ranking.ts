import { getGlobalRanking } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, rankingEmbedsBuilder, embedPagination, defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Exibe o ranking do servidor')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Modo de jogo')
                .setRequired(false)
                .addChoices(
                    { name: 'osu', value: '0' },
                    { name: 'taiko', value: '1' },
                    { name: 'ctb', value: '2' },
                    { name: 'mania', value: '3' }
                )
        ),

    aliases: ['ppr', 'pplb', 'ppranking', 'ppleaderboard'],

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()

        const selectedMode = Number(interaction.options.getString('mode')) // Pega o modo fornecido (ou não) no comando

        await this.handleRankingCommand(interaction, selectedMode)
    },

    async executePrefix(message: Message, _number: any, args: string[]) {

        let selectedMode = null
        switch (args[0]?.toLowerCase()) {
            case 't': case 'taiko':             selectedMode = 1; break
            case 'c': case 'ctb': case 'catch': selectedMode = 2; break
            case 'm': case 'mania':             selectedMode = 3; break
        }

        await this.handleRankingCommand(message, selectedMode)
    },

    async handleRankingCommand(source: ChatInputCommandInteraction | Message, selectedMode: number | null) {

        try {

            const gamemode = selectedMode ?? 0 // Modo fornecido ?? Std como padrão

            const ranking = await getGlobalRanking(gamemode)

            const embeds = await rankingEmbedsBuilder(ranking, gamemode)

            await embedPagination(source, embeds, "", false, 60000)



        } catch (error) {
            const message = String(error)

            const embed = await defaultEmbedBuilder(message)

            await reply(source, { embeds: [embed] })
        }
    }
}