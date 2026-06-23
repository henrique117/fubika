import axios from "axios";
import { Errors } from "./errorHandler";
import { env } from "../config/env";
import { logger } from "./logger";
import { OsuTokenResponse } from "../interfaces/osuApi.interface";

const client_id = env.osu.clientId;
const client_secret = env.osu.clientSecret;

let cachedAccessToken: string | null = null;
let tokenExpirationTime = 0;
let tokenRequest: Promise<string> | null = null;

const osuAuthClient = axios.create({
    baseURL: "https://osu.ppy.sh/oauth/token",
    headers: { "Content-Type": "application/json" },
});

const osuApiClient = axios.create({
    baseURL: "https://osu.ppy.sh/api/v2",
    headers: {
        "Content-Type": "application/json",
    },
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
            const response = await osuAuthClient.post<OsuTokenResponse>("", {
                client_id,
                client_secret,
                grant_type: "client_credentials",
                scope: "public",
            });

            const { access_token, expires_in } = response.data;

            cachedAccessToken = access_token;
            tokenExpirationTime = now + expires_in * 1000;

            return access_token;
        } catch (err) {
            const detail = err as { response?: { data?: unknown }; message?: string };
            logger.error({ err: detail.response?.data ?? detail.message }, "[osu! Auth Error]");

            throw Errors.Internal("Falha crítica na conexão com a infraestrutura oficial do osu!.");
        } finally {
            tokenRequest = null;
        }
    })();

    return tokenRequest;
};

osuApiClient.interceptors.request.use(
    async (config) => {
        const token = await getApiAuthToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (err) => Promise.reject(err)
);

osuApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status === 404) {
            throw Errors.NotFound("O recurso solicitado não foi encontrado no osu!.");
        }

        if (status === 401) {
            cachedAccessToken = null;
            throw Errors.Unauthorized("Sessão com a API oficial expirada. Tente novamente.");
        }

        throw Errors.Internal("O servidor oficial do osu! demorou a responder ou recusou a conexão.");
    }
);

export default osuApiClient;
