import { REGEX } from "../constants"
import { extractBeatmapId } from "./auxiliarFunctions"

const TOKENIZER_REGEX = /"([^"]*)"|'([^']*)'|(\S+)/g

interface Token {
    value: string
    isQuoted: boolean
}

function tokenize(content: string): Token[] {
    const tokens: Token[] = []
    let match

    TOKENIZER_REGEX.lastIndex = 0

    while ((match = TOKENIZER_REGEX.exec(content)) !== null) {

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

    const args = allTokens.slice(1)

    let beatmapId: string | null = null
    const remainingTokens: Token[] = []

    for (const token of args) {
        const text = token.value

        if (token.isQuoted) {
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

    const args = allTokens.slice(1)

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

    const args = allTokens.slice(1)

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
