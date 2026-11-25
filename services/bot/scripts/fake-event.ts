/*
 * Publica um evento FALSO de SNIPE / TOP_1 no canal Redis 'fubika:notifications',
 * no mesmo formato que o bancho publica (app/state/services.py,
 * trigger_top_score_event). Serve para testar os embeds do bot sem precisar
 * jogar uma score de verdade.
 *
 * Uso (de dentro de services/bot):
 *   npx tsx --env-file=../../.env scripts/fake-event.ts --type=snipe
 *   npx tsx --env-file=../../.env scripts/fake-event.ts --type=top1 --beatmap=70077
 *
 * PRÉ-REQUISITOS REAIS (achados na auditoria — sem eles o bot não posta nada):
 *
 *   1. O bot chama GET {API_URL}/api/v1/beatmap/<beatmap_id> ao receber o evento
 *      (snipe.ts -> getBeatmap). Se esse id não existir na API, o embed NUNCA é
 *      postado e o erro só aparece no console do bot. Use um --beatmap que exista.
 *
 *   2. O canal GUILD_CONFIG.channels.top_scores precisa estar no cache do bot,
 *      isto é: o bot tem de estar na guild e ver o canal. Em sendTop1Embed a
 *      ausência do canal é um `return` MUDO (nem log aparece).
 *
 * Este arquivo NÃO entra no `npm run build`: o tsconfig inclui apenas src/**.
 */

import { createClient } from 'redis'
import { env } from '../src/config/env.config'

const CANAL = 'fubika:notifications'

type TipoEvento = 'SNIPE' | 'TOP_1'

interface DadosEvento {
    beatmap_id: number
    beatmap_title: string
    beatmap_diff: string
    star_rating: number
    thumbnail: string
    player_id: number
    player_name: string
    player_discord_id: string | null
    new_score: number
    new_pp: number
    new_acc: number
    new_mods: number
    victim_id: number | null
    victim_name: string | null
    victim_discord_id: string | null
    victim_score: number
    victim_pp: number
    victim_acc: number
    victim_mods: number
    mode: number
}

const USO = `
Uso: npx tsx --env-file=../../.env scripts/fake-event.ts --type=snipe|top1 [opções]

  --type=snipe|top1        obrigatório (aceita também top_1/TOP_1)
  --beatmap=<id>           id do beatmap na API Fubika (padrão 70077)
  --set=<id>              beatmapset usado na thumbnail (padrão = --beatmap)
  --player=<id>            id do atacante (padrão 3)
  --player-name=<nome>     nome do atacante (padrão FakeSniper)
  --discord=<discord_id>   discord id do atacante (padrão vazio: o bot usa o nome em negrito)
  --victim=<id>            id da vítima, só em snipe (padrão 4)
  --victim-name=<nome>     nome da vítima (padrão FakeVictim)
  --victim-discord=<id>    discord id da vítima (padrão vazio)
`.trim()

function lerArgumentos(argv: string[]): Map<string, string> {
    const args = new Map<string, string>()

    for (const bruto of argv) {
        if (!bruto.startsWith('--')) {
            throw new Error(`Argumento não reconhecido: "${bruto}". Use o formato --chave=valor.`)
        }

        const [chave, ...resto] = bruto.slice(2).split('=')
        args.set(String(chave), resto.join('='))
    }

    return args
}

function normalizarTipo(valor: string | undefined): TipoEvento {
    const tipo = (valor ?? '').trim().toLowerCase()

    if (tipo === 'snipe') return 'SNIPE'
    if (tipo === 'top1' || tipo === 'top_1') return 'TOP_1'

    throw new Error(`--type inválido: "${valor ?? ''}". Use snipe, top1 ou top_1.`)
}

function lerInteiro(args: Map<string, string>, chave: string, padrao: number): number {
    const bruto = args.get(chave)

    if (bruto === undefined || bruto === '') return padrao

    const valor = Number(bruto)

    if (!Number.isInteger(valor)) {
        throw new Error(`--${chave} precisa ser um número inteiro (recebido "${bruto}").`)
    }

    return valor
}

function lerTexto(args: Map<string, string>, chave: string, padrao: string): string {
    const bruto = args.get(chave)
    return bruto === undefined || bruto === '' ? padrao : bruto
}

/*
 * Discord id vazio vira null, igual ao que o bancho manda quando o jogador não
 * tem conta vinculada: aí o bot mostra o nome em negrito em vez da menção.
 */
function lerDiscordId(args: Map<string, string>, chave: string): string | null {
    const bruto = args.get(chave)
    return bruto === undefined || bruto.trim() === '' ? null : bruto.trim()
}

function montarEvento(args: Map<string, string>): { type: TipoEvento, data: DadosEvento } {
    const tipo = normalizarTipo(args.get('type'))
    const ehSnipe = tipo === 'SNIPE'

    const beatmapId = lerInteiro(args, 'beatmap', 70077)
    const setId = lerInteiro(args, 'set', beatmapId)

    return {
        type: tipo,
        data: {
            beatmap_id: beatmapId,
            beatmap_title: lerTexto(args, 'beatmap-title', 'Fake Beatmap'),
            beatmap_diff: lerTexto(args, 'beatmap-diff', 'Insane'),
            star_rating: 6.54,
            thumbnail: `https://b.ppy.sh/thumb/${setId}l.jpg`,
            player_id: lerInteiro(args, 'player', 3),
            player_name: lerTexto(args, 'player-name', 'FakeSniper'),
            player_discord_id: lerDiscordId(args, 'discord'),
            new_score: 1_000_000,
            new_pp: 312.45,
            new_acc: 98.76,
            new_mods: 0,
            // Em TOP_1 o bancho manda os campos de vítima nulos/zerados.
            victim_id: ehSnipe ? lerInteiro(args, 'victim', 4) : null,
            victim_name: ehSnipe ? lerTexto(args, 'victim-name', 'FakeVictim') : null,
            victim_discord_id: ehSnipe ? lerDiscordId(args, 'victim-discord') : null,
            victim_score: ehSnipe ? 880_123 : 0,
            victim_pp: ehSnipe ? 287.91 : 0.0,
            victim_acc: ehSnipe ? 97.12 : 0.0,
            victim_mods: ehSnipe ? 0 : 0,
            mode: lerInteiro(args, 'mode', 0)
        }
    }
}

// Mostra só host:porta: a URL do Redis carrega a senha.
function destinoSemCredencial(url: string): string {
    try {
        const { hostname, port } = new URL(url)
        return `${hostname}:${port || '6379'}`
    } catch {
        return 'destino desconhecido'
    }
}

async function main() {
    const args = lerArgumentos(process.argv.slice(2))

    if (args.has('help') || args.has('h')) {
        console.log(USO)
        return
    }

    const evento = montarEvento(args)

    /*
     * env.REDIS_URL já resolve LOCAL_REDIS_URL (dev, na máquina) antes de
     * REDIS_URL (dentro do Docker).
     */
    if (!env.REDIS_URL) {
        console.error('💥 Nenhuma URL de Redis definida.')
        console.error('   Defina LOCAL_REDIS_URL (ou REDIS_URL) no .env da RAIZ e rode o script')
        console.error('   de dentro de services/bot com: npx tsx --env-file=../../.env scripts/fake-event.ts --type=snipe')
        console.error('   O Redis local sobe com `make deps`.')
        process.exitCode = 1
        return
    }

    const destino = destinoSemCredencial(env.REDIS_URL)

    // reconnectStrategy: false = falha rápido em vez de ficar tentando reconectar.
    const publisher = createClient({
        url: env.REDIS_URL,
        socket: {
            reconnectStrategy: false,
            connectTimeout: 5000
        }
    })

    // Sem este listener um erro de socket viraria 'unhandled error event'.
    publisher.on('error', () => { })

    try {
        await publisher.connect()
    } catch (err) {
        console.error(`💥 Não foi possível conectar ao Redis em ${destino}.`)
        console.error(`   Motivo: ${err instanceof Error ? err.message : String(err)}`)
        console.error('   Confira a LOCAL_REDIS_URL do .env da raiz e se o Redis está de pé (`make deps`).')
        process.exitCode = 1
        return
    }

    const payload = JSON.stringify(evento)

    try {
        const inscritos = await publisher.publish(CANAL, payload)

        console.log(`📤 Publicado em "${CANAL}" (${destino}):`)
        console.log(JSON.stringify(evento, null, 2))
        console.log(`👥 Subscribers que receberam: ${inscritos}`)

        if (inscritos === 0) {
            console.warn('⚠️  Nenhum subscriber recebeu o evento: o bot provavelmente não está rodando')
            console.warn('    (ou está ligado em outro Redis). Suba o bot e tente de novo.')
        } else {
            console.log('ℹ️  Se nada aparecer no Discord, confira os dois pré-requisitos no topo deste arquivo:')
            console.log(`    o beatmap ${evento.data.beatmap_id} tem de existir na API e o bot tem de ver o canal de top scores.`)
        }
    } finally {
        await publisher.destroy()
    }
}

main().catch(err => {
    console.error(`💥 ${err instanceof Error ? err.message : String(err)}`)
    console.error('')
    console.error(USO)
    process.exitCode = 1
})
