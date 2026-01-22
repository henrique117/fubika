import axios from "axios"

const apiUrl = process.env.VITE_API_URL || 'https://api.fubika.com.br'

const osuApiClient = axios.create({
    baseURL: apiUrl + '/api',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY
    }
})

export default osuApiClient