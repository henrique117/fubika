import { Events, Client } from 'discord.js'
import { startRedisListener } from '../services/redisClient'


export default {
    name: Events.ClientReady,
    once: true,
    async execute (client: Client) {
        console.log(`Bot online como ${client.user?.tag}`)

        try {
            await startRedisListener(client)
        } catch (err) {
            console.error("❌ Falha ao iniciar o Redis Listener:", err)
        }
    }
}
