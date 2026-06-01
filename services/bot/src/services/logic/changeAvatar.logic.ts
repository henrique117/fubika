import { postChangeAvatar } from "../apiCalls"
import axios from "axios"

export interface ChangeAvatarResult {
    success: boolean
    buffer?: Buffer
    contentType?: string
    error?: string
}

export async function executeChangeAvatar(userId: string, imageUrl: string): Promise<ChangeAvatarResult> {
    try {
        const MAX_SIZE = 2 * 1024 * 1024;

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        if (buffer.length > MAX_SIZE) {
            return {
                success: false,
                error: `A imagem é muito grande! O limite é de **2MB**. (A sua tem ${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`
            }
        }

        await postChangeAvatar(userId, buffer)

        return {
            success: true,
            buffer,
            contentType: response.headers['content-type']
        }
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Erro interno ao processar o upload.'
        return {
            success: false,
            error: `Falha ao atualizar avatar: **${errorMsg}**`
        }
    }
}
