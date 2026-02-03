import { REGEX } from "../constants"
import { extractBeatmapId } from "./auxiliarFunctions"

// Captura "texto com espaço", 'texto com espaço' ou texto_sem_sepaço 
const TOKENIZER_REGEX = /"([^"]*)"|'([^']*)'|(\S+)/g

interface Token {
    value: string
    isQuoted: boolean // Se está entre aspas simples ou duplas
}

function tokenize(content: string): Token[] {
    const tokens: Token[] = []
    let match

    TOKENIZER_REGEX.lastIndex = 0 // Para evitar bugs se o regex for reutilizado

    while ((match = TOKENIZER_REGEX.exec(content)) !== null) {
        // match[1] = em aspas duplas
        // match[2] = aspas simples
        // match[3] = sem aspas

        const value = match[1] || match[2] || match[3]
        const isQuoted = match[1] !== undefined || match[2] !== undefined

        if (value) {
            tokens.push({ value, isQuoted })
        }
    }

    return tokens
}

export async function parseCompareArguments(rawContent: string) {

    const allTokens = tokenize(rawContent)

    const args = allTokens.slice(1) // Remove o token do comando

    let beatmapId: string | null = null
    const remainingTokens: Token[] = []

    // Extração de mapas (e mods futuramente)
    for (const token of args) {
        const text = token.value

        if (token.isQuoted) { // Se estiver entre aspas assume que é nome 
            remainingTokens.push(token)
            continue
        }

        const isBeatmap = REGEX.osuUrl.test(text) || REGEX.fubikaUrl.test(text) || REGEX.rawId.test(text)

        if (isBeatmap) {
            if (isBeatmap)
                beatmapId = await extractBeatmapId(text)
            else
                beatmapId = text

            continue
        }

        remainingTokens.push(token)
    }

    let username: string | null = null

    // Procura primeiro token entre aspas
    const quotedToken = remainingTokens.find(t => t.isQuoted)

    if (quotedToken) {
        username = quotedToken.value
    } else {
        username = remainingTokens[0]?.value ?? null
    }

    return { beatmapId, username }
}

export async function parseOnlyUsername(rawContent: string) {

    const allTokens = tokenize(rawContent)

    const args = allTokens.slice(1) // Remove o token do comando

    let username: string | null = null

    const quotedToken = args.find(t => t.isQuoted)

    if (quotedToken) {
        username = quotedToken.value
    } else {
        username = args[0]?.value ?? null
    }

    return { username }
}

export async function parseOnlyBeatmapId(rawContent: string) {

    const allTokens = tokenize(rawContent)

    const args = allTokens.slice(1) // Remove o token do comando

    let beatmapId: string | null = null

    for (const token of args) {
        const text = token.value

        const isBeatmap = REGEX.osuUrl.test(text) || REGEX.fubikaUrl.test(text) || REGEX.rawId.test(text)

        if (isBeatmap) {
            if (isBeatmap)
                beatmapId = await extractBeatmapId(text)
            else
                beatmapId = text

            continue
        }
    }

    return { beatmapId }
}