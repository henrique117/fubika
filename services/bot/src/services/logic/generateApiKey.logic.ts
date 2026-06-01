import { postGenerateApiKey } from "../apiCalls"

export interface GenerateApiKeyResult {
    success: boolean
    key?: string
    error?: string
}

export async function executeGenerateApiKey(userId: string, applicationName: string): Promise<GenerateApiKeyResult> {
    try {
        const { key } = await postGenerateApiKey(userId, applicationName)
        return {
            success: true,
            key
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}

