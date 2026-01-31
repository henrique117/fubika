process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMembers
    ]
})

client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands')
if (!fs.existsSync(foldersPath)) {
    console.error(`[ERRO CRÍTICO] A pasta 'commands' não foi encontrada em: ${foldersPath}`)
    process.exit(1)
}

const allItems = fs.readdirSync(foldersPath)

const commandFolders = allItems.filter(item => {
    const itemPath = path.join(foldersPath, item)
    return fs.statSync(itemPath).isDirectory()
})

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        
        const importedFile = require(filePath)

        const command = importedFile.default || importedFile

        if (!command) {
            console.warn(`[SKIP] O arquivo ${file} foi ignorado pois não exportou nada válido.`)
            continue 
        }

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        } else {
            console.warn(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`)
        }
    }
}

const eventsPath = path.join(__dirname, 'events')
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file)
    const event = require(filePath).default || require(filePath)

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

client.login(process.env.TOKEN)