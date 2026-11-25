export const PRIV = {
    BANNED: 0,
    NORMAL: 1,
    SPECIAL: 31879,
    ADMIN: 1048575,
} as const;

export const GAME_MODES = [0, 1, 2, 3, 4, 5, 6, 8] as const;

export const MODS = {
    SCORE_V2: 536870912,
} as const;

export const SCORE_STATUS = {
    BEST: 2,
    SUBMITTED: 3,
} as const;

export const MAP_STATUS = {
    RANKED: 2,
} as const;

export const FIRST_INVITE_CODE = "FIRSTINVITE";

export const MIN_PUBLIC_USER_ID = 3;

export const ONLINE_THRESHOLD_SECONDS = 300;

export const PROFILE_TOP_SCORES_LIMIT = 200;

export const LEADERBOARD_PAGE_SIZE = 50;

export const RANK_HISTORY_RETENTION_DAYS = 60;

export const AUTH_RATE_LIMIT = {
    max: 10,
    windowMs: 60_000,
} as const;
