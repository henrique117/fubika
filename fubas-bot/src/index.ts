process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Client, Collection, GatewayIntentBits } from 'discord.js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ]
})

client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands')
const allItems = fs.readdirSync(foldersPath)

const commandFolders = allItems.filter(item => {
    const itemPath = path.join(foldersPath, item)
    return fs.statSync(itemPath).isDirectory()
});

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath).default

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        } else {
            console.warn(`[AVISO] O comando em ${filePath} nÃ£o tem "data" ou "execute".`)
        }
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
        }
    }
});

client.once('clientReady', () => {
    console.log(`Bot online como ${client.user?.tag}`)
})

client.login(process.env.TOKEN)