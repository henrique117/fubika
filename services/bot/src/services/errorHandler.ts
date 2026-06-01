import axios from "axios"

export default function getApiErrorMessage(error: unknown): string {

    if (axios.isAxiosError(error)) {

        if (error.response) {
            return error.response.data?.error || `Erro do servidor (Status ${error.response.status})`
        }

        if (error.request) {
            return "Não foi possível conectar ao servidor (Timeout ou erro de rede)."
        }
    }

    if (error instanceof Error) {
        return error.message
    }

    return "Erro desconhecido: " + String(error)
}
