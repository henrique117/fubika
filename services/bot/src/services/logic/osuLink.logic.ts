import { postCreateLink } from "../apiCalls"

export interface OsuLinkResult {
    success: boolean
    message?: string
    error?: string
}

export async function executeOsuLinkInitiate(userId: string, nick: string): Promise<OsuLinkResult> {
    try {
        const { message } = await postCreateLink(userId, nick.replace(" ", "_").toLowerCase())
        return {
            success: true,
            message
        }
    } catch (error) {
        let errorMsg = String(error)
        if (errorMsg.includes('Usuário não encontrado')) {
            errorMsg = `Usuário \`${nick}\` não encontrado!`
        } else if (errorMsg.includes('usuário já está vinculado')) {
            errorMsg = `Usuário \`${nick}\` já está vinculado a um Discord!`
        }
        return {
            success: false,
            error: errorMsg
        }
    }
}
