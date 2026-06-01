import { postCreateInvite } from "../apiCalls"

export interface SendInviteResult {
    success: boolean
    code?: string
    error?: string
}

export async function executeSendInvite(userId: string): Promise<SendInviteResult> {
    try {
        const { code } = await postCreateInvite(userId)
        return {
            success: true,
            code
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}

