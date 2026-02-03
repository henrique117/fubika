import { getPlayer } from "../../services/apiCalls"
import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js"
import { reply, top200EmbedsBuilder, embedPagination, topIndexEmbedBuilder, defaultEmbedBuilder, noIndexScoresEmbedBuilder, parseOnlyUsername} from "../../utils/utils.export"

export default {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Exibe o top 200 de um player')
        .addStringOption(option => 
            option.setName('player')
                .setDescription('Nick do player')
                .setRequired(false)
        )
        .addNumberOption(option => 
            option.setName('index')
                .setDescription('Ranking da play')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(200)
        ),

    aliases: ['t'],

    async execute (interaction: ChatInputCommandInteraction) {
        await interaction.deferReply()
        
        const username = interaction.options.getString('player') // Pega o player fornecido (ou não) no comando

        const index = interaction.options.getNumber('index') // Pega o index fornecido (ou não) no comando
    
        await this.handleTopCommand(interaction, username, index)
    },

    async executePrefix (message: Message, index: number | null) {

        const { username } = await parseOnlyUsername(message.content)

        await this.handleTopCommand(message, username, index)
    },
    
    async handleTopCommand(source: ChatInputCommandInteraction | Message, username: string | null, index: number | null) {
        
        try{
        
            const user = (source instanceof ChatInputCommandInteraction)
                ? source.user
                : source.author

            const finalUser = username || user.id // Player fornecido || Player não foi fornecido

            const player = await getPlayer(finalUser.replace(" ", "_").toLowerCase())

            if (index === null) {
                const { embeds, attachment } = await top200EmbedsBuilder(player)
                await embedPagination(source, embeds, "", false, 60000, attachment)
            
            }else if (1 > index || index > 200){
                const embed = await defaultEmbedBuilder('Insira um index válido!')
                await reply(source, { embeds: [embed] })
                return
            
            }else{

                if (!player.top_200)
                    throw new Error("Scores data are missing")

                const score = player.top_200[index - 1]

                if (!score) {
                    const { embed, attachment } = await noIndexScoresEmbedBuilder(player)
                    await reply(source, {
                        embeds: [embed],
                        files: [attachment]
                    })
                    return
                }

                const embed = await topIndexEmbedBuilder(player, score, index)
                await reply(source, { embeds: [embed] })
            }

        }catch(error){
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