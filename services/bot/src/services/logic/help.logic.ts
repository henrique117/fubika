export interface HelpResult {
    success: boolean
    command?: string | null
    error?: string
}

export async function executeHelp(selectedCommand: string | null): Promise<HelpResult> {
    try {
        return {
            success: true,
            command: selectedCommand
        }
    } catch (error) {
        return {
            success: false,
            error: String(error)
        }
    }
}
