import { Client } from 'discord.js'
import { createClient } from 'redis'
import { sendSnipeEmbed, sendTop1Embed } from '../events/snipe'
import { env } from '../config/env.config'

/*
 * A REDIS_URL carrega a senha, então nunca vai inteira para o log: só host:porta.
 */
function destinoSemCredencial(url: string): string {
    try {
        const { hostname, port } = new URL(url)
        return `${hostname}:${port || '6379'}`
    } catch {
        return 'destino desconhecido'
    }
}

export async function startRedisListener(discordClient: Client) {
    const destino = destinoSemCredencial(env.REDIS_URL)

    const subscriber = createClient({ 
        url: env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                console.log(`[Redis] Tentativa de reconexão nº${retries}...`)
                return Math.min(retries * 100, 3000)
            },
            connectTimeout: 10000
        }
    })

    subscriber.on('error', (err) => {
        if (err.message.includes('ECONNREFUSED')) {
            console.error('❌ Erro: Não foi possível conectar ao Redis (Host inacessível).')
        } else {
            console.error('Erro no Redis:', err.message)
        }
    })

    try {
        await subscriber.connect()
        console.log(`📡 Bot conectado ao Redis (${destino}) e aguardando eventos...`)

        await subscriber.subscribe('fubika:notifications', async (message) => {
            try {
                const event = JSON.parse(message)

                if (event.type === 'SNIPE') {
                    await sendSnipeEmbed(discordClient, event.data)
                } else if (event.type === 'TOP_1') {
                    await sendTop1Embed(discordClient, event.data)
                }

            } catch (err) {
                console.error('Erro ao processar mensagem do Redis:', err)
            }
        })
    } catch (err) {
        console.error('💥 Falha crítica ao conectar no Redis no arranque do Bot.')
    }
}
