import { Events, Message } from 'discord.js'
import { ICommand } from '../interfaces/interfaces.export' 

export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message: Message) {

        if (message.author.bot || !message.content.startsWith('!')) return

        const args = message.content.slice(1).trim().split(/ +/)
        const commandName = args.shift()?.toLowerCase()

        if (!commandName) return

        let command = message.client.commands.get(commandName) as ICommand // Tenta achar pelo nome exato

        if (!command) { // Se não achar, tenta pelos aliases
            command = message.client.commands.find((cmd: ICommand) => 
                cmd.aliases && cmd.aliases.includes(commandName)
            )
        }

        if (!command || !command.executePrefix) return

        try {
            await command.executePrefix(message, args)
        } catch (error) {
            console.error(error)
            await message.reply('Houve um erro ao executar esse comando.')
        }
    }
}