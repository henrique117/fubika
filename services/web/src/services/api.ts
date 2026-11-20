import axios from 'axios'
import { API_BASE_URL } from '../config'


// API_BASE_URL já vem com o prefixo '/api/v1' (ver src/config.ts), então aqui
// NÃO se concatena mais nada: em produção/staging é
// 'https://api.<domínio>/api/v1' e em dev é '/api/v1', atendido pelo proxy do
// Vite. Nenhuma URL fica embutida em build time.
export const api = axios.create({
    baseURL: API_BASE_URL,
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('osu_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})
