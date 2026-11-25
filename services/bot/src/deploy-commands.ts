import { REST, Routes } from 'discord.js'
import fs from 'fs'
import path from 'path'

import { env, validarEnv } from './config/env.config'

validarEnv(['DISCORD_TOKEN', 'CLIENT_ID'])

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

// Prepara o módulo REST
const rest = new REST().setToken(env.DISCORD_TOKEN)

// Faz o upload
;(async () => {
    try {
        console.log(`Iniciando refresh de ${commands.length} comandos de aplicação (/) .`)

        /*
         * Com DISCORD_GUILD_ID definida, registra os comandos só naquela guild:
         * a propagação é instantânea, ideal para o bot de teste. Sem ela, o
         * registro é global (staging/produção) e pode levar até 1h para atualizar.
         */
        const escopo = env.DISCORD_GUILD_ID ? `guild ${env.DISCORD_GUILD_ID}` : 'global'
        const rota = env.DISCORD_GUILD_ID
            ? Routes.applicationGuildCommands(env.CLIENT_ID, env.DISCORD_GUILD_ID)
            : Routes.applicationCommands(env.CLIENT_ID)

        console.log(`Escopo do registro: ${escopo}.`)

        // O método .put sobrescreve todos os comandos existentes com os novos
        const data = await rest.put(rota, { body: commands })

        console.log(`Sucesso! Carregados ${(data as any).length} comandos (${escopo}).`)
    } catch (error) {
        console.error('💥 Falha ao registrar os comandos de aplicação:', error)

        /*
         * O `npm start` roda "node dist/deploy-commands.js && node dist/index.js":
         * sair com status != 0 impede o container de subir com os comandos
         * quebrados em silêncio. Usamos process.exitCode em vez de process.exit(1)
         * para o Node terminar de escrever o log e fechar os sockets do REST --
         * process.exit truncaria a saída quando stderr é um pipe (caso do Docker).
         */
        process.exitCode = 1
    }
})()
