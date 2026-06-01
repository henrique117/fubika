import { getPlayer } from "../apiCalls"

export interface UserProfileResult {
    success: boolean
    player?: any
    error?: string
}

export async function executeUserProfile(username: string | null, userId: string): Promise<UserProfileResult> {
    try {
        const finalUser = username || userId
        const player = await getPlayer(finalUser)
        return {
            success: true,
            player
        }
    } catch (error) {
        let errorMsg = String(error)
        if (errorMsg.includes('Usuário não encontrado')) {
            errorMsg = `Player \`${username}\` não encontrado!`
        }
        return {
            success: false,
            error: errorMsg
        }
    }
}

