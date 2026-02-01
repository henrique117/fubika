import { Events, ChatInputCommandInteraction } from 'discord.js'

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: ChatInputCommandInteraction) {
        
        if (!interaction.isChatInputCommand()) return
        
        const command = interaction.client.commands.get(interaction.commandName)
        
        if (!command) {
            console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`)
            return
        }
        
        try {
            await command.execute(interaction)
        } catch (error) {
            console.error(`Erro ao executar comando ${interaction.commandName}:`, error)
            
            const errorPayload = { content: 'Houve um erro ao executar esse comando!', ephemeral: true }
        
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorPayload).catch(e => console.error("Erro no followUp:", e))
            } else {
                try {
                    await interaction.reply(errorPayload)
                } catch (err: any) {
                    if (err.code === 40060) {
                        await interaction.followUp(errorPayload).catch(e => console.error("Erro no followUp de recuperação:", e))
                    } else {
                        console.error("Erro no reply:", err)
                    }
                }
            }
        }
    }
}

