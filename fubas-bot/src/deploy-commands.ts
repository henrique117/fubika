import { REST, Routes } from 'discord.js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const commands = []
// Caminho para a pasta commands
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath).default || require(filePath)
        
        if ('data' in command && 'execute' in command) {
            // O Discord precisa do comando no formato JSON
            commands.push(command.data.toJSON())
        } else {
            console.log(`[AVISO] O comando em ${filePath} está faltando "data" ou "execute".`)
        }
    }
}

// Prepara o módulo REST
const rest = new REST().setToken(process.env.TOKEN!)

// Faz o upload
;(async () => {
    try {
        console.log(`Iniciando refresh de ${commands.length} comandos de aplicação (/) .`)

        // O método .put sobrescreve todos os comandos existentes com os novos
        const data = await rest.put(
            // Use Routes.applicationCommands(clientId) para GLOBAL (pode demorar 1h para atualizar)
            // Use Routes.applicationGuildCommands(clientId, guildId) para DESENVOLVIMENTO (instantâneo)
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands },
        )

        console.log(`Sucesso! Carregados ${(data as any).length} comandos.`)
    } catch (error) {
        console.error(error)
    }
})()