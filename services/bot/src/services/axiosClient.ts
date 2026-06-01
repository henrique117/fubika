import axios from "axios"

const apiUrl = process.env.VITE_API_URL || 'https://api.fubika.com.br'

const osuApiClient = axios.create({
    baseURL: apiUrl + '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
    }
})

osuApiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            console.error(`[API Timeout] A requisição para ${error.config.url} demorou demais.`)
        } else if (error.code === 'ECONNREFUSED') {
            console.error(`[API Connection] Não foi possível conectar em ${apiUrl}. O container da API está de pé?`)
        } else {
            console.error(`[API Error] Status: ${error.response?.status} - ${error.message}`)
        }
        return Promise.reject(error)
    }
)

export default osuApiClient