import axios from "axios"

export default function getApiErrorMessage(error: unknown): string {
    
    
    if (axios.isAxiosError(error)) {
        
        if (error.response) { 
            return error.response.data?.error || `Erro do servidor (Status ${error.response.status})`
        }
        
        if (error.request) { // Sem resposta
            return "Não foi possível conectar ao servidor (Timeout ou erro de rede)."
        }
    }

    if (error instanceof Error) { // Erro genérico de JS
        return error.message
    }

    return "Erro desconhecido: " + String(error) // Outro
}
