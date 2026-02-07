import { Events, Client } from 'discord.js'

export default {
    name: Events.ClientReady,
    once: true,
    execute (client: Client) {
        console.log(`Bot online como ${client.user?.tag}`)
    }
}
