import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://172.21.182.198:3000/api',
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('osu_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});