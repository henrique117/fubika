import axios from "axios"

import { env } from "../config/env.config"

/*
 * env.API_URL é a URL BASE da API, sem /api — dentro do Docker vale
 * http://api:3000. O prefixo /api/v1 é acrescentado aqui.
 */
const headers: Record<string, string> = {
    'Content-Type': 'application/json'
}

// Sem chave configurada, não manda o header vazio (a API trataria como inválido).
if (env.API_KEY) {
    headers['x-api-key'] = env.API_KEY
}

const osuApiClient = axios.create({
    baseURL: env.API_URL + '/api/v1',
    timeout: 10000,
    headers
})

osuApiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            console.error(`[API Timeout] A requisição para ${error.config.url} demorou demais.`)
        } else if (error.code === 'ECONNREFUSED') {
            console.error(`[API Connection] Não foi possível conectar em ${env.API_URL}. O container da API está de pé?`)
        } else {
            console.error(`[API Error] Status: ${error.response?.status} - ${error.message}`)
        }
        return Promise.reject(error)
    }
)

export default osuApiClient
