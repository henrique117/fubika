import { Client, Collection, GatewayIntentBits } from 'discord.js'
import path from 'path'
import fs from 'fs'

import { env, validarEnv } from './config/env.config'

// Falha explícita e cedo: sem token/Redis o bot não tem o que fazer.
validarEnv(['DISCORD_TOKEN', 'REDIS_URL'])

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

const commandFolders = fs.readdirSync(foldersPath).filter(item => {
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

        if (command && 'data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        } else {
            console.warn(`[AVISO] O comando em ${filePath} está incompleto.`)
        }
    }
}

const eventsPath = path.join(__dirname, 'events')
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file)
        const event = require(filePath).default || require(filePath)

        if (event.name) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args))
            } else {
                client.on(event.name, (...args) => event.execute(...args))
            }
        }
    }
}

client.login(env.DISCORD_TOKEN)
