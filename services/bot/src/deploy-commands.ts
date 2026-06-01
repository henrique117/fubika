import { REST, Routes } from 'discord.js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const commands = []

const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath).default || require(filePath)

        if ('data' in command && 'execute' in command) {

            commands.push(command.data.toJSON())
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando "data" ou "execute".`)
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!)

;(async () => {
    try {
        console.log(`Iniciando refresh de ${commands.length} comandos de aplicação (/) .`)

        const data = await rest.put(

            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands },
        )

        console.log(`Sucesso! Carregados ${(data as any).length} comandos.`)
    } catch (error) {
        console.error(error)
    }
})()
