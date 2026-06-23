const toNumber = (value: string | undefined, fallback: number): number => {
    if (value === undefined || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_JWT_SECRET = "fubika_secret_2026";

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",

    port: toNumber(process.env.API_PORT, 3000),
    host: process.env.API_HOST ?? "0.0.0.0",

    jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

    domain: process.env.DOMAIN ?? "bpy.local",
    ownerDiscordId: process.env.OWNER_DISCORD_ID ?? "520994132458471438",

    osu: {
        clientId: toNumber(process.env.OSU_CLIENT_ID, 0),
        clientSecret: process.env.OSU_CLIENT_SECRET ?? "",
    },

    redis: {
        url:
            process.env.REDIS_URL ??
            `redis://${process.env.REDIS_HOST ?? "redis"}:${process.env.REDIS_PORT ?? 6379}`,
    },

    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        name: process.env.DB_NAME,
    },

    upload: {
        maxFileSizeBytes: toNumber(process.env.UPLOAD_MAX_SIZE, 2_000_000),
    },

    server: {
        connectionTimeoutMs: toNumber(process.env.CONNECTION_TIMEOUT_MS, 0),
        keepAliveTimeoutMs: toNumber(process.env.KEEP_ALIVE_TIMEOUT_MS, 72_000),
        requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 30_000),
    },

    rateLimit: {
        max: toNumber(process.env.RATE_LIMIT_MAX, 100),
        windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    },
} as const;

export type Env = typeof env;
