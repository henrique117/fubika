import { Client } from 'discord.js'
import { createClient } from 'redis'
import { sendSnipeEmbed, sendTop1Embed } from '../events/snipe'

export async function startRedisListener(discordClient: Client) {
    const host = process.env.REDIS_HOST || 'redis'
    const port = process.env.REDIS_PORT || '6379'
    const pass = process.env.REDIS_PASS ? `:${process.env.REDIS_PASS}@` : ''
    
    const redisUrl = process.env.REDIS_URL || `redis://${pass}${host}:${port}`

    const subscriber = createClient({ 
        url: redisUrl,
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
        console.log(`📡 Bot conectado ao Redis (${host}:${port}) e aguardando eventos...`)

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