import { getGlobalRanking } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, rankingEmbedsBuilder, embedPagination, defaultEmbedBuilder } from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Exibe o ranking do servidor')
        .addStringOption(option =>
            option.setName('gamemode')
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

        const selectedMode = Number(interaction.options.getString('gamemode')) // Pega o modo de jogo fornecido (ou não) no comando

        await this.handleRankingCommand(interaction, selectedMode)
    },

    async executePrefix(message: Message, _number: any, args: string[]) {

        let selectedGamemode = null
        switch (args[0]?.toLowerCase()) {
            case 't': case 'taiko':             selectedGamemode = 1; break
            case 'c': case 'ctb': case 'catch': selectedGamemode = 2; break
            case 'm': case 'mania':             selectedGamemode = 3; break
        }

        await this.handleRankingCommand(message, selectedGamemode)
    },

    async handleRankingCommand(source: ChatInputCommandInteraction | Message, selectedGamemode: number | null) {

        try {

            const gamemode = selectedGamemode ?? 0 // Modo fornecido ?? Std como padrão

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