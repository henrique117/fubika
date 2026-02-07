import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'https://api.fubika.com.br'
//debug maldito
console.log("API?:", apiUrl);

export const api = axios.create({
    baseURL: apiUrl + '/api',
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('osu_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})