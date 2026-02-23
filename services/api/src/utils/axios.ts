import axios from "axios";
import { Errors } from "./errorHandler";

const client_id = Number(process.env.OSU_CLIENT_ID);
const client_secret = process.env.OSU_CLIENT_SECRET;

let cachedAccessToken: string | null = null;
let tokenExpirationTime = 0;
let tokenRequest: Promise<string> | null = null;

const osuAuthClient = axios.create({
    baseURL: 'https://osu.ppy.sh/oauth/token',
    headers: { 'Content-Type': 'application/json' }
});

const osuApiClient = axios.create({
    baseURL: 'https://osu.ppy.sh/api/v2',
    headers: {
        "Content-Type": "application/json"
    }
});

export const getApiAuthToken = async (): Promise<string> => {
    const now = Date.now();
    const bufferTime = 30 * 1000;

    if (cachedAccessToken && now < tokenExpirationTime - bufferTime) {
        return cachedAccessToken;
    }

    if (tokenRequest) return tokenRequest;

    tokenRequest = (async () => {
        try {
            const response = await osuAuthClient.post('', {
                client_id,
                client_secret,
                grant_type: 'client_credentials',
                scope: 'public'
            });

            const { access_token, expires_in } = response.data;

            cachedAccessToken = access_token;
            tokenExpirationTime = now + (expires_in * 1000);

            return access_token;
        } catch (err: any) {
            console.error("[osu! Auth Error]:", err.response?.data || err.message);
            throw Errors.Internal("Falha na autenticação com a API oficial do osu!.");
        } finally {
            tokenRequest = null;
        }
    })();

    return tokenRequest;
};

osuApiClient.interceptors.request.use(async (config) => {
    const token = await getApiAuthToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (err) => {
    return Promise.reject(err);
});

osuApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 404) {
            throw Errors.NotFound("O recurso solicitado não existe na API do osu!.");
        }
        
        if (error.response?.status === 401) {
            cachedAccessToken = null; 
            throw Errors.Unauthorized("Token da API do osu! expirado ou inválido.");
        }

        throw Errors.Internal("Erro na comunicação com a API do osu!.");
    }
);

export default osuApiClient;