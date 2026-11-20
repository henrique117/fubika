import { api } from './api'
import {
    deleteKey,
    getEnvelopeSync,
    setEnvelope,
    subscribeKey,
    swrFetch,
    waitForIdbHydration,
} from './swrCache'

export interface ApiBeatmap {
    artist: string
    beatmap_id: number
    beatmapset_id: number
    beatmap_md5?: string
    title: string
    mode?: string
    mode_int?: number
    status?: string
    total_length?: number
    author_id?: number
    author_name?: string
    diff: string
    cover: string
    thumbnail: string
    star_rating?: number
    bpm?: number
    od?: number
    ar?: number
    cs?: number
    hp?: number
    max_combo?: number
    count_circles?: number
    count_sliders?: number
    passcount?: number
    playcount?: number
    scores?: ApiScore[]
}

export interface ApiBeatmapset {
    beatmapset_id: number
    title: string
    artist: string
    playcount?: number
    favourite_count?: number
    cover: string
    thumbnail: string
    author_id?: string
    beatmaps: ApiBeatmap[]
}

export interface ApiScore {
    id: number
    pp: number
    score: number
    acc: number
    mods_int?: number
    mods: string
    n300: number
    n100: number
    n50: number
    nmiss: number
    grade: string
    perfect?: boolean
    max_combo: number
    play_time?: string
    beatmap?: ApiBeatmap
    player?: ApiPlayer
}

export interface ApiPlayer {
    id: number
    name: string
    safe_name?: string
    country?: string
    state_rank?: number | null
    rank: number
    pp: number
    acc: number
    pfp?: string
    banner?: string
    a_count?: number
    s_count?: number
    ss_count?: number
    sh_count?: number
    ssh_count?: number
    level: number
    total_score: number
    ranked_score: number
    max_combo: number
    playtime?: number
    playcount: number
    total_hits?: number
    replay_views?: number
    last_activity?: string
    rank_history?: { date: string; rank: number; pp: number }[]
    top_200?: ApiScore[]
}

export interface ResolvedPlayer {
    player: ApiPlayer
    stateRank: number | null
}

interface CatboyBeatmapSetRaw {
    id?: number
    title?: string
    artist?: string
    creator?: string
    status?: string
    user_id?: number | string
    play_count?: number
    favourite_count?: number
    covers?: {
        cover?: string
        'list@2x'?: string
    }
    beatmaps?: CatboyBeatmapRaw[]
}

interface CatboyBeatmapRaw {
    id?: number
    beatmapset_id?: number
    checksum?: string
    mode?: string
    mode_int?: number
    status?: string
    total_length?: number
    user_id?: number
    version?: string
    difficulty_rating?: number
    bpm?: number
    accuracy?: number
    ar?: number
    cs?: number
    drain?: number
    max_combo?: number
    count_circles?: number
    count_sliders?: number
    passcount?: number
    playcount?: number
    set?: CatboyBeatmapSetRaw
}

const BEATMAP_STORAGE_KEY = 'fubika_beatmaps_v1'
const BEATMAPSET_STORAGE_KEY = 'fubika_beatmapsets_v1'
const HOT_PLAYER_STORAGE_KEY = 'fubika_swr_hot_v1:player'
const HOT_RECENT_STORAGE_KEY = 'fubika_swr_hot_v1:recent'
const HOT_RANKING_STORAGE_KEY = 'fubika_swr_hot_v1:ranking'

const MAX_CACHED_BEATMAPS = 300
const MAX_CACHED_BEATMAPSETS = 40
const MAX_HOT_PLAYERS = 5
const MAX_HOT_RECENT = 5
const MAX_HOT_RANKINGS = 8

const PLAYER_STALE_TIME_MS = 2 * 60 * 1000
const PLAYER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const RECENT_STALE_TIME_MS = 60 * 1000
const RECENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const RANKING_STALE_TIME_MS = 2 * 60 * 1000
const RANKING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const BEATMAP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const CATBOY_API_BASE = 'https://catboy.best/api/v2'

const inFlightBeatmapSetRequests = new Map<
    string,
    Promise<{ beatmap: ApiBeatmap; beatmapSet: ApiBeatmapset } | null>
>()
const inFlightBatchBeatmapRequests = new Map<number, Promise<void>>()

export const DEFAULT_AVATAR_URL = '/assets/default-avatar.svg'
export const FALLBACK_AVATAR_URL = '/assets/default-avatar.svg'

const GRADE_ASSETS: Record<string, string> = {
    XH: '/assets/8e9f0.png',
    SSH: '/assets/8e9f0.png',
    X: '/assets/8e9f0.png',
    SS: '/assets/8e9f0.png',
    SH: '/assets/09e97.png',
    S: '/assets/09e97.png',
    A: '/assets/adaa3.png',
    B: '/assets/66a8d.png',
    C: '/assets/7ae37.png',
    D: '/assets/bac4b.png',
    F: '/assets/bac4b.png',
}

export const getGradeAsset = (grade?: string): string => {
    const normalized = (grade || '').trim().toUpperCase()
    return GRADE_ASSETS[normalized] || '/assets/bac4b.png'
}

export const hasApiAuth = (): boolean => {
    const hasToken =
        typeof window !== 'undefined' && Boolean(localStorage.getItem('osu_token'))
    return hasToken || Boolean(api.defaults.headers.common['Authorization'])
}

const readAuthUserId = (): number | null => {
    try {
        const raw = localStorage.getItem('osu_user')
        if (!raw) return null
        const parsed = JSON.parse(raw) as { id?: unknown }
        return typeof parsed?.id === 'number' && parsed.id > 0 ? parsed.id : null
    } catch {
        return null
    }
}

const loadMapFromStorage = <T,>(key: string): Map<number, T> => {
    const result = new Map<number, T>()
    if (typeof window === 'undefined') {
        return result
    }

    try {
        const raw = localStorage.getItem(key)
        if (!raw) return result
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            for (const entry of parsed) {
                if (Array.isArray(entry) && typeof entry[0] === 'number' && entry[1]) {
                    result.set(entry[0], entry[1] as T)
                }
            }
        }
    } catch {
        // Ignora storage corrompido
    }

    return result
}

const persistMapToStorage = <T,>(key: string, cache: Map<number, T>, maxEntries: number): void => {
    if (typeof window === 'undefined') {
        return
    }

    while (cache.size > maxEntries) {
        const oldestKey = cache.keys().next().value
        if (oldestKey === undefined) break
        cache.delete(oldestKey)
    }

    try {
        localStorage.setItem(key, JSON.stringify(Array.from(cache.entries())))
    } catch {
        try {
            const entries = Array.from(cache.entries())
            const trimmed = entries.slice(Math.floor(entries.length / 2))
            cache.clear()
            for (const [k, v] of trimmed) {
                cache.set(k, v)
            }
            localStorage.setItem(key, JSON.stringify(trimmed))
        } catch {
            // Ignora indisponibilidade de storage
        }
    }
}

const beatmapMirrorCache = loadMapFromStorage<ApiBeatmap>(BEATMAP_STORAGE_KEY)
const beatmapSetMirrorCache = loadMapFromStorage<ApiBeatmapset>(BEATMAPSET_STORAGE_KEY)

const getMirrorBeatmap = (beatmapId: number): ApiBeatmap | undefined => {
    const hot = beatmapMirrorCache.get(beatmapId)
    if (hot) return hot

    const l2Promoted = getEnvelopeSync<ApiBeatmap>(`beatmap:${beatmapId}`, BEATMAP_MAX_AGE_MS)?.data
    if (l2Promoted) {
        beatmapMirrorCache.set(beatmapId, l2Promoted)
        return l2Promoted
    }
    return undefined
}

const getMirrorBeatmapSet = (beatmapsetId: number): ApiBeatmapset | undefined => {
    const hot = beatmapSetMirrorCache.get(beatmapsetId)
    if (hot) return hot

    const l2Promoted = getEnvelopeSync<ApiBeatmapset>(
        `beatmapset:${beatmapsetId}`,
        BEATMAP_MAX_AGE_MS
    )?.data
    if (l2Promoted) {
        beatmapSetMirrorCache.set(beatmapsetId, l2Promoted)
        return l2Promoted
    }
    return undefined
}

const setCachedBeatmap = (beatmap: ApiBeatmap): void => {
    if (!beatmap.beatmap_id || beatmap.beatmap_id <= 0) return
    beatmapMirrorCache.delete(beatmap.beatmap_id)
    beatmapMirrorCache.set(beatmap.beatmap_id, beatmap)
    setEnvelope(`beatmap:${beatmap.beatmap_id}`, beatmap, {
        maxAgeMs: BEATMAP_MAX_AGE_MS,
    })
}

const setCachedBeatmapSet = (beatmapSet: ApiBeatmapset): void => {
    if (!beatmapSet.beatmapset_id || beatmapSet.beatmapset_id <= 0) return
    const normalizedSet: ApiBeatmapset = {
        ...beatmapSet,
        beatmaps: (beatmapSet.beatmaps || []).map((b) => applyDeterministicCovers(b)),
    }
    for (const b of normalizedSet.beatmaps) {
        if (b.beatmap_id > 0) {
            setCachedBeatmap(b)
        }
    }
    persistMapToStorage(BEATMAP_STORAGE_KEY, beatmapMirrorCache, MAX_CACHED_BEATMAPS)
    beatmapSetMirrorCache.delete(normalizedSet.beatmapset_id)
    beatmapSetMirrorCache.set(normalizedSet.beatmapset_id, normalizedSet)
    persistMapToStorage(BEATMAPSET_STORAGE_KEY, beatmapSetMirrorCache, MAX_CACHED_BEATMAPSETS)
    setEnvelope(`beatmapset:${normalizedSet.beatmapset_id}`, normalizedSet, {
        maxAgeMs: BEATMAP_MAX_AGE_MS,
    })
}

const applyDeterministicCovers = (beatmap: ApiBeatmap): ApiBeatmap => {
    const setId = Number(beatmap.beatmapset_id || 0)
    if (setId <= 0) {
        return beatmap
    }

    const cover =
        beatmap.cover || `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`
    const thumbnail =
        beatmap.thumbnail || `https://assets.ppy.sh/beatmaps/${setId}/covers/list@2x.jpg`

    if (cover === beatmap.cover && thumbnail === beatmap.thumbnail) {
        return beatmap
    }

    return { ...beatmap, cover, thumbnail }
}

const needsBeatmapHydration = (beatmap?: ApiBeatmap): boolean => {
    if (!beatmap || !beatmap.beatmap_id || beatmap.beatmap_id <= 0) {
        return false
    }

    const title = beatmap.title?.trim() || ''
    const artist = beatmap.artist?.trim() || ''
    const diff = beatmap.diff?.trim() || ''

    return (
        !title ||
        title === 'Mapa não encontrado' ||
        title === 'Sem título' ||
        !artist ||
        artist === 'Artista Desconhecido' ||
        !diff ||
        diff === 'Unknown' ||
        !beatmap.cover
    )
}

const mapCatboyBeatmap = (raw: CatboyBeatmapRaw, parentSet?: CatboyBeatmapSetRaw): ApiBeatmap => {
    const setObj = raw?.set ?? parentSet ?? {}
    const beatmapId = Number(raw?.id || 0)
    const setId = Number(raw?.beatmapset_id || setObj?.id || 0)

    return applyDeterministicCovers({
        artist: setObj?.artist || 'Desconhecido',
        beatmap_id: beatmapId,
        beatmapset_id: setId,
        beatmap_md5: raw?.checksum,
        title: setObj?.title || 'Sem título',
        mode: raw?.mode,
        mode_int: raw?.mode_int,
        status: raw?.status || setObj?.status,
        total_length: Number(raw?.total_length || 0),
        author_id: Number(raw?.user_id || setObj?.user_id || 0),
        author_name: setObj?.creator || 'Desconhecido',
        diff: raw?.version || '',
        cover: setObj?.covers?.cover || '',
        thumbnail: setObj?.covers?.['list@2x'] || '',
        star_rating: Number(raw?.difficulty_rating || 0),
        bpm: Number(raw?.bpm || 0),
        od: Number(raw?.accuracy || 0),
        ar: Number(raw?.ar || 0),
        cs: Number(raw?.cs || 0),
        hp: Number(raw?.drain || 0),
        max_combo: Number(raw?.max_combo || 0),
        count_circles: Number(raw?.count_circles || 0),
        count_sliders: Number(raw?.count_sliders || 0),
        passcount: Number(raw?.passcount || 0),
        playcount: Number(raw?.playcount || 0),
    })
}

const applyCachedBeatmapsSync = (
    scores: ApiScore[]
): { scores: ApiScore[]; changed: boolean } => {
    if (!Array.isArray(scores) || scores.length === 0) {
        return { scores, changed: false }
    }

    let anyChanged = false
    const nextScores = scores.map((score) => {
        if (!score.beatmap) {
            return score
        }

        const cached = getMirrorBeatmap(score.beatmap.beatmap_id)
        const target = cached ? applyDeterministicCovers(cached) : applyDeterministicCovers(score.beatmap)
        if (
            target !== score.beatmap &&
            (target.title !== score.beatmap.title ||
                target.diff !== score.beatmap.diff ||
                target.cover !== score.beatmap.cover ||
                target.thumbnail !== score.beatmap.thumbnail ||
                target.artist !== score.beatmap.artist)
        ) {
            anyChanged = true
            return { ...score, beatmap: target }
        }
        return score
    })

    return { scores: anyChanged ? nextScores : scores, changed: anyChanged }
}

export const hydrateScoresBeatmaps = async (
    scores: ApiScore[],
    maxCount = 50
): Promise<ApiScore[]> => {
    if (!Array.isArray(scores) || scores.length === 0) {
        return scores
    }

    if (maxCount <= 0) {
        return applyCachedBeatmapsSync(scores).scores
    }

    await waitForIdbHydration()

    const limit = Math.min(scores.length, maxCount)
    const missingIdSet = new Set<number>()
    const pendingPromises: Promise<void>[] = []

    for (let i = 0; i < limit; i++) {
        const beatmap = scores[i]?.beatmap
        if (beatmap && needsBeatmapHydration(beatmap)) {
            if (getMirrorBeatmap(beatmap.beatmap_id)) {
                continue
            }
            const existingInFlight = inFlightBatchBeatmapRequests.get(beatmap.beatmap_id)
            if (existingInFlight) {
                pendingPromises.push(existingInFlight)
            } else {
                missingIdSet.add(beatmap.beatmap_id)
            }
        }
    }

    const missingIds = Array.from(missingIdSet)
    let cachedNewItems = false

    for (let offset = 0; offset < missingIds.length; offset += 50) {
        const chunk = missingIds.slice(offset, offset + 50)
        const params = new URLSearchParams()
        for (const id of chunk) {
            params.append('ids', String(id))
        }

        const chunkPromise = (async () => {
            try {
                const response = await fetch(`${CATBOY_API_BASE}/beatmaps?${params.toString()}`)
                if (response.ok) {
                    const payload = await response.json()
                    const items = Array.isArray(payload) ? payload : []
                    for (const item of items) {
                        const mapped = mapCatboyBeatmap(item)
                        if (mapped.beatmap_id > 0) {
                            setCachedBeatmap(mapped)
                            cachedNewItems = true
                        }
                    }
                }
            } catch {
                // Mantém fallback determinístico se o mirror falhar
            } finally {
                for (const id of chunk) {
                    inFlightBatchBeatmapRequests.delete(id)
                }
            }
        })()

        for (const id of chunk) {
            inFlightBatchBeatmapRequests.set(id, chunkPromise)
        }
        pendingPromises.push(chunkPromise)
    }

    if (pendingPromises.length > 0) {
        await Promise.all(pendingPromises)
    }

    if (cachedNewItems) {
        persistMapToStorage(BEATMAP_STORAGE_KEY, beatmapMirrorCache, MAX_CACHED_BEATMAPS)
    }

    return applyCachedBeatmapsSync(scores).scores
}

export const getCachedBeatmapSetFromMirror = (
    beatmapId: number | string,
    beatmapsetId?: number
): { beatmap: ApiBeatmap; beatmapSet: ApiBeatmapset } | null => {
    const numericId = Number(beatmapId)
    const cachedMap = Number.isFinite(numericId) ? getMirrorBeatmap(numericId) : undefined
    const targetSetId = beatmapsetId || cachedMap?.beatmapset_id || 0
    if (targetSetId <= 0) return null

    const cachedSet = getMirrorBeatmapSet(targetSetId)
    if (!cachedSet) return null

    const beatmapInSet =
        cachedSet.beatmaps.find((item) => item.beatmap_id === numericId) ?? cachedMap
    if (!beatmapInSet) return null

    return { beatmap: beatmapInSet, beatmapSet: cachedSet }
}

export const fetchBeatmapWithSetFromMirror = async (
    beatmapId: number | string
): Promise<{ beatmap: ApiBeatmap; beatmapSet: ApiBeatmapset } | null> => {
    const preCached = getCachedBeatmapSetFromMirror(beatmapId)
    if (preCached) {
        return preCached
    }

    await waitForIdbHydration()
    const idbCached = getCachedBeatmapSetFromMirror(beatmapId)
    if (idbCached) {
        return idbCached
    }

    const requestKey = String(beatmapId)
    const existing = inFlightBeatmapSetRequests.get(requestKey)
    if (existing) {
        return existing
    }

    const requestPromise = (async () => {
        try {
            const response = await fetch(
                `${CATBOY_API_BASE}/b/${encodeURIComponent(requestKey)}`
            )
            if (!response.ok) {
                return null
            }

            const data = await response.json()
            if (!data || !data.id) {
                return null
            }

            const setObj = data.set ?? {}
            const beatmap = mapCatboyBeatmap(data, setObj)
            const rawDiffs: CatboyBeatmapRaw[] = Array.isArray(setObj.beatmaps)
                ? setObj.beatmaps
                : [data]
            const beatmaps = rawDiffs.map((item) => mapCatboyBeatmap(item, setObj))

            const beatmapSet: ApiBeatmapset = {
                beatmapset_id: Number(setObj.id || beatmap.beatmapset_id || 0),
                title: setObj.title || beatmap.title,
                artist: setObj.artist || beatmap.artist,
                playcount: Number(setObj.play_count || 0),
                favourite_count: Number(setObj.favourite_count || 0),
                cover: setObj.covers?.cover || beatmap.cover,
                thumbnail: setObj.covers?.['list@2x'] || beatmap.thumbnail,
                author_id: String(setObj.user_id || beatmap.author_id || 0),
                beatmaps,
            }

            setCachedBeatmapSet(beatmapSet)

            return { beatmap, beatmapSet }
        } catch {
            return null
        } finally {
            inFlightBeatmapSetRequests.delete(requestKey)
        }
    })()

    inFlightBeatmapSetRequests.set(requestKey, requestPromise)
    return requestPromise
}

interface KnownPlayerMeta {
    country?: string
    stateRank?: number
}

const PLAYER_META_STORAGE_KEY = 'fubika:player_meta_v1'
const MAX_PLAYER_META_ENTRIES = 500

const playerMetaMemoryMap = new Map<number, KnownPlayerMeta>()
let playerMetaStorageLoaded = false

const loadPlayerMetaStorage = (): void => {
    if (playerMetaStorageLoaded || typeof window === 'undefined') return
    playerMetaStorageLoaded = true
    try {
        const raw = window.localStorage.getItem(PLAYER_META_STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as Record<string, KnownPlayerMeta>
        for (const [idStr, meta] of Object.entries(parsed)) {
            const numId = Number(idStr)
            if (numId > 0 && meta && typeof meta === 'object') {
                playerMetaMemoryMap.set(numId, meta)
            }
        }
    } catch {
        // ignore
    }
}

const persistPlayerMetaStorage = (): void => {
    if (typeof window === 'undefined') return
    try {
        const entries = Array.from(playerMetaMemoryMap.entries()).slice(-MAX_PLAYER_META_ENTRIES)
        const obj: Record<string, KnownPlayerMeta> = {}
        for (const [id, meta] of entries) {
            obj[String(id)] = meta
        }
        window.localStorage.setItem(PLAYER_META_STORAGE_KEY, JSON.stringify(obj))
    } catch {
        // ignore
    }
}

export const recordPlayerMeta = (
    playerId: number,
    patch: { country?: string; stateRank?: number }
): void => {
    if (!playerId || playerId <= 0) return
    loadPlayerMetaStorage()

    const existing = playerMetaMemoryMap.get(playerId) ?? {}
    let changed = false

    if (
        patch.country &&
        patch.country.trim().length === 2 &&
        patch.country.toLowerCase() !== 'xx'
    ) {
        const normalized = patch.country.trim().toUpperCase()
        if (existing.country !== normalized) {
            existing.country = normalized
            changed = true
        }
    }

    if (typeof patch.stateRank === 'number' && patch.stateRank > 0) {
        if (existing.stateRank !== patch.stateRank) {
            existing.stateRank = patch.stateRank
            changed = true
        }
    }

    if (changed) {
        playerMetaMemoryMap.set(playerId, existing)
        persistPlayerMetaStorage()
    }
}

export const getKnownPlayerMeta = (playerId: number): KnownPlayerMeta | null => {
    if (!playerId || playerId <= 0) return null
    loadPlayerMetaStorage()
    return playerMetaMemoryMap.get(playerId) ?? null
}

export const recordRankingPlayers = (
    players: ApiPlayer[],
    countryFilter?: string
): void => {
    if (!Array.isArray(players) || players.length === 0) return
    const normalizedFilter = countryFilter?.trim().toUpperCase()
    const isStateFilter = Boolean(
        normalizedFilter && normalizedFilter !== 'GLOBAL' && normalizedFilter.length === 2
    )

    for (const player of players) {
        if (!player || !player.id) continue
        const itemCountry =
            player.country?.trim() || (isStateFilter ? normalizedFilter : undefined)
        const patch: { country?: string; stateRank?: number } = {}
        if (itemCountry && itemCountry.length === 2 && itemCountry.toLowerCase() !== 'xx') {
            patch.country = itemCountry.toUpperCase()
        }
        if (isStateFilter && typeof player.rank === 'number' && player.rank > 0) {
            patch.stateRank = player.rank
        }
        if (patch.country || patch.stateRank) {
            recordPlayerMeta(player.id, patch)
        }
    }
}

const getRankingSwrKey = (mode = 0, page = 1, country?: string): string => {
    const normalizedCountry = country?.trim().toUpperCase() || 'GLOBAL'
    return `ranking:${mode}:${page}:${normalizedCountry}`
}

export const getCachedRankingPageSnapshot = (
    mode = 0,
    page = 1,
    country?: string
): ApiPlayer[] | null => {
    const key = getRankingSwrKey(mode, page, country)
    return (
        getEnvelopeSync<ApiPlayer[]>(key, RANKING_MAX_AGE_MS, HOT_RANKING_STORAGE_KEY)?.data ??
        null
    )
}

export const fetchRankingPageCached = async (
    mode = 0,
    page = 1,
    country?: string,
    options?: { onUpdate?: (fresh: ApiPlayer[]) => void }
): Promise<ApiPlayer[]> => {
    const normalizedCountry = country?.trim().toUpperCase() || undefined
    const key = getRankingSwrKey(mode, page, normalizedCountry)

    const result = await swrFetch<ApiPlayer[]>({
        key,
        staleTimeMs: RANKING_STALE_TIME_MS,
        maxAgeMs: RANKING_MAX_AGE_MS,
        hotStorageKey: HOT_RANKING_STORAGE_KEY,
        maxHotEntries: MAX_HOT_RANKINGS,
        fetcher: async () => {
            try {
                const res = await api.get<ApiPlayer[]>('/ranking/global', {
                    params: {
                        mode,
                        page,
                        country: normalizedCountry,
                    },
                })
                const list = Array.isArray(res.data) ? res.data : []
                recordRankingPlayers(list, normalizedCountry)
                return list
            } catch {
                return null
            }
        },
        onUpdate: (fresh) => {
            recordRankingPlayers(fresh, normalizedCountry)
            options?.onUpdate?.(fresh)
        },
    })

    if (result) {
        recordRankingPlayers(result, normalizedCountry)
    }

    return result ?? []
}

const getRecentSwrKey = (userId: number | string, mode = 0, limit = 50): string =>
    `recent:${userId}:${mode}:${limit}`

export const getCachedUserRecentSnapshot = (
    userId: number | string,
    limit = 50,
    mode = 0
): ApiScore[] | null => {
    if (!hasApiAuth()) {
        return null
    }

    const directKey = getRecentSwrKey(userId, mode, limit)
    const direct = getEnvelopeSync<ApiScore[]>(
        directKey,
        RECENT_MAX_AGE_MS,
        HOT_RECENT_STORAGE_KEY
    )
    if (direct) {
        return applyCachedBeatmapsSync(direct.data).scores
    }

    if (limit < 50) {
        const fullRecent = getEnvelopeSync<ApiScore[]>(
            getRecentSwrKey(userId, mode, 50),
            RECENT_MAX_AGE_MS,
            HOT_RECENT_STORAGE_KEY
        )
        if (fullRecent) {
            return applyCachedBeatmapsSync(fullRecent.data.slice(0, limit)).scores
        }
    }

    return null
}

export const fetchUserRecent = async (
    userId: number | string,
    limit = 50,
    mode = 0,
    options?: { onUpdate?: (fresh: ApiScore[]) => void }
): Promise<ApiScore[]> => {
    if (!hasApiAuth()) {
        return []
    }

    const key = getRecentSwrKey(userId, mode, limit)
    const result = await swrFetch<ApiScore[]>({
        key,
        staleTimeMs: RECENT_STALE_TIME_MS,
        maxAgeMs: RECENT_MAX_AGE_MS,
        hotStorageKey: HOT_RECENT_STORAGE_KEY,
        maxHotEntries: MAX_HOT_RECENT,
        fetcher: async () => {
            try {
                const res = await api.get<ApiScore[]>(
                    `/user/${encodeURIComponent(String(userId))}/recent`,
                    { params: { mode, limit } }
                )
                const rawData = Array.isArray(res.data) ? res.data : []
                return await hydrateScoresBeatmaps(rawData, limit)
            } catch {
                return null
            }
        },
        onUpdate: options?.onUpdate,
    })

    return result ?? []
}

const getEffectivePlayerKey = (routeId?: string): string => {
    if (routeId) {
        return routeId.trim().toLowerCase()
    }
    return '__me__'
}

const getPlayerSwrKey = (effectiveKey: string): string => `player:${effectiveKey}`

const syncPlayerAliases = (
    resolved: ResolvedPlayer,
    excludeKey: string,
    isMe = false
): void => {
    const idKey = getPlayerSwrKey(String(resolved.player.id))
    const keysToSync = [idKey]

    if (resolved.player.safe_name) {
        keysToSync.push(getPlayerSwrKey(resolved.player.safe_name.toLowerCase()))
    }

    const cachedMe = getEnvelopeSync<ResolvedPlayer>(
        getPlayerSwrKey('__me__'),
        PLAYER_MAX_AGE_MS,
        HOT_PLAYER_STORAGE_KEY,
        true
    )
    if (isMe || cachedMe?.data.player.id === resolved.player.id) {
        keysToSync.push(getPlayerSwrKey('__me__'))
    }

    for (const targetKey of keysToSync) {
        if (targetKey === excludeKey) continue
        setEnvelope(targetKey, resolved, {
            hotStorageKey: HOT_PLAYER_STORAGE_KEY,
            maxHotEntries: MAX_HOT_PLAYERS,
            maxAgeMs: PLAYER_MAX_AGE_MS,
        })
    }
}

const ensurePlayerTopHydrated = async (
    resolved: ResolvedPlayer,
    hydrateCount: number
): Promise<ResolvedPlayer> => {
    if (
        hydrateCount <= 0 ||
        !Array.isArray(resolved.player.top_200) ||
        resolved.player.top_200.length === 0
    ) {
        return resolved
    }

    const needsHydration = resolved.player.top_200
        .slice(0, hydrateCount)
        .some((score) => needsBeatmapHydration(score.beatmap))

    const syncCheck = applyCachedBeatmapsSync(resolved.player.top_200)
    if (!needsHydration && !syncCheck.changed) {
        return resolved
    }

    const hydratedTop = needsHydration
        ? await hydrateScoresBeatmaps(resolved.player.top_200, hydrateCount)
        : syncCheck.scores

    return {
        ...resolved,
        player: { ...resolved.player, top_200: hydratedTop },
    }
}

const resolvePlayerAndStateRank = async (
    routeId?: string,
    options?: { preferMe?: boolean; hydrateCount?: number }
): Promise<ResolvedPlayer | null> => {
    let player: ApiPlayer | null = null

    if (routeId) {
        try {
            const res = await api.get<ApiPlayer>(`/user/${encodeURIComponent(routeId)}`)
            player = res.data
        } catch {
            return null
        }
    } else {
        try {
            const res = await api.get<ApiPlayer>('/user/me')
            player = res.data
        } catch {
            player = null
        }
    }

    if (!player) {
        return null
    }

    const hydrateCount = options?.hydrateCount ?? 10
    if (Array.isArray(player.top_200) && player.top_200.length > 0) {
        const hydratedTop = await hydrateScoresBeatmaps(player.top_200, hydrateCount)
        player = { ...player, top_200: hydratedTop }
    }

    // 1. Resolve Country
    let country = player.country?.trim()
    if (!country || country.toLowerCase() === 'xx') {
        const cachedMeta = getKnownPlayerMeta(player.id)
        if (cachedMeta?.country && cachedMeta.country.toLowerCase() !== 'xx') {
            country = cachedMeta.country
            player = { ...player, country }
        }
    }

    // If country is still missing and player has global rank > 0, locate them in global ranking
    if (
        (!country || country.toLowerCase() === 'xx') &&
        typeof player.rank === 'number' &&
        player.rank > 0
    ) {
        const expectedGlobalPage = Math.max(1, Math.floor((player.rank - 1) / 50) + 1)
        const pagesToCheck = [expectedGlobalPage]
        if (expectedGlobalPage > 1) {
            pagesToCheck.push(expectedGlobalPage - 1)
        }
        pagesToCheck.push(expectedGlobalPage + 1)

        for (const p of pagesToCheck) {
            const globalPage = await fetchRankingPageCached(0, p)
            const foundInGlobal = globalPage.find((item) => item.id === player!.id)
            if (foundInGlobal?.country && foundInGlobal.country.toLowerCase() !== 'xx') {
                country = foundInGlobal.country.trim().toUpperCase()
                player = { ...player, country }
                recordPlayerMeta(player.id, { country })
                break
            }
        }
    }

    // 2. Resolve State Rank
    let stateRank: number | null = null

    // If backend directly provided state_rank
    if (typeof player.state_rank === 'number' && player.state_rank > 0) {
        stateRank = player.state_rank
        recordPlayerMeta(player.id, { stateRank })
    }

    // Check cached state rank
    if (!stateRank) {
        const cachedMeta = getKnownPlayerMeta(player.id)
        if (typeof cachedMeta?.stateRank === 'number' && cachedMeta.stateRank > 0) {
            stateRank = cachedMeta.stateRank
        }
    }

    // Search state ranking pages if country is a valid 2-letter state
    if (!stateRank && country && country.length === 2 && country.toLowerCase() !== 'xx') {
        const MAX_STATE_PAGES = 5
        for (let page = 1; page <= MAX_STATE_PAGES; page++) {
            const stateList = await fetchRankingPageCached(0, page, country)
            if (!stateList || stateList.length === 0) {
                break
            }

            const found = stateList.find((item) => item.id === player!.id)
            if (found) {
                stateRank =
                    typeof found.rank === 'number' && found.rank > 0
                        ? found.rank
                        : (page - 1) * 50 + stateList.indexOf(found) + 1
                recordPlayerMeta(player.id, { country, stateRank })
                break
            }

            if (stateList.length < 50) {
                break
            }

            const lastPlayer = stateList[stateList.length - 1]
            if (
                typeof player.pp === 'number' &&
                typeof lastPlayer?.pp === 'number' &&
                lastPlayer.pp > 0 &&
                player.pp > lastPlayer.pp
            ) {
                break
            }
        }
    }

    return { player, stateRank }
}

export const getCachedActivePlayerSnapshot = (
    routeId?: string
): ResolvedPlayer | null => {
    if (!hasApiAuth()) {
        return null
    }

    const effectiveKey = getEffectivePlayerKey(routeId)
    const envelope = getEnvelopeSync<ResolvedPlayer>(
        getPlayerSwrKey(effectiveKey),
        PLAYER_MAX_AGE_MS,
        HOT_PLAYER_STORAGE_KEY
    )

    if (!envelope) {
        return null
    }

    if (effectiveKey === '__me__') {
        const authUserId = readAuthUserId()
        if (authUserId !== null && envelope.data.player.id !== authUserId) {
            return null
        }
    }

    let resolved = envelope.data

    if (resolved.player?.id) {
        const meta = getKnownPlayerMeta(resolved.player.id)
        let resolvedChanged = false
        let updatedPlayer = resolved.player
        let updatedStateRank = resolved.stateRank

        if (
            (!updatedPlayer.country || updatedPlayer.country.toLowerCase() === 'xx') &&
            meta?.country
        ) {
            updatedPlayer = { ...updatedPlayer, country: meta.country }
            resolvedChanged = true
        }

        if (updatedStateRank === null && typeof meta?.stateRank === 'number' && meta.stateRank > 0) {
            updatedStateRank = meta.stateRank
            resolvedChanged = true
        }

        if (resolvedChanged) {
            resolved = {
                ...resolved,
                player: updatedPlayer,
                stateRank: updatedStateRank,
            }
        }
    }

    const topScores = resolved.player.top_200
    if (!Array.isArray(topScores) || topScores.length === 0) {
        return resolved
    }

    const hydrated = applyCachedBeatmapsSync(topScores)
    if (!hydrated.changed) {
        return resolved
    }

    return {
        ...resolved,
        player: {
            ...resolved.player,
            top_200: hydrated.scores,
        },
    }
}

export const getDefaultCachedBeatmapSetSnapshot = (): {
    beatmap: ApiBeatmap
    beatmapSet: ApiBeatmapset
} | null => {
    if (!hasApiAuth()) {
        return null
    }

    const cachedPlayer = getCachedActivePlayerSnapshot()
    if (!cachedPlayer) {
        return null
    }

    let targetBeatmapId = cachedPlayer.player.top_200?.[0]?.beatmap?.beatmap_id ?? 0
    if (!targetBeatmapId && cachedPlayer.player.id) {
        const recent = getCachedUserRecentSnapshot(cachedPlayer.player.id, 1)
        targetBeatmapId = recent?.[0]?.beatmap?.beatmap_id ?? 0
    }

    if (!targetBeatmapId || targetBeatmapId <= 0) {
        return null
    }

    return getCachedBeatmapSetFromMirror(targetBeatmapId)
}

export const fetchActivePlayer = async (
    routeId?: string,
    options?: {
        preferMe?: boolean
        hydrateCount?: number
        onUpdate?: (fresh: ResolvedPlayer) => void
    }
): Promise<ResolvedPlayer | null> => {
    if (!hasApiAuth()) {
        return null
    }

    const hydrateCount = options?.hydrateCount ?? 10
    const effectiveKey = getEffectivePlayerKey(routeId)
    const swrKey = getPlayerSwrKey(effectiveKey)

    if (effectiveKey === '__me__') {
        const authUserId = readAuthUserId()
        const existingMe = getEnvelopeSync<ResolvedPlayer>(
            swrKey,
            PLAYER_MAX_AGE_MS,
            HOT_PLAYER_STORAGE_KEY,
            true
        )
        if (
            authUserId !== null &&
            existingMe &&
            existingMe.data.player.id !== authUserId
        ) {
            deleteKey(swrKey, HOT_PLAYER_STORAGE_KEY)
        }
    }

    const result = await swrFetch<ResolvedPlayer>({
        key: swrKey,
        staleTimeMs: PLAYER_STALE_TIME_MS,
        maxAgeMs: PLAYER_MAX_AGE_MS,
        hotStorageKey: HOT_PLAYER_STORAGE_KEY,
        maxHotEntries: MAX_HOT_PLAYERS,
        fetcher: async () => {
            const resolved = await resolvePlayerAndStateRank(routeId, options)
            if (resolved) {
                syncPlayerAliases(resolved, swrKey, effectiveKey === '__me__')
            }
            return resolved
        },
        onUpdate: options?.onUpdate
            ? async (fresh) => {
                  const upgraded = await ensurePlayerTopHydrated(fresh, hydrateCount)
                  if (upgraded !== fresh) {
                      setEnvelope(swrKey, upgraded, {
                          hotStorageKey: HOT_PLAYER_STORAGE_KEY,
                          maxHotEntries: MAX_HOT_PLAYERS,
                          maxAgeMs: PLAYER_MAX_AGE_MS,
                      })
                      syncPlayerAliases(upgraded, swrKey, effectiveKey === '__me__')
                  } else {
                      syncPlayerAliases(fresh, swrKey, effectiveKey === '__me__')
                  }
                  options.onUpdate?.(upgraded)
              }
            : undefined,
    })

    if (!result) {
        return null
    }

    const upgraded = await ensurePlayerTopHydrated(result, hydrateCount)
    if (upgraded !== result) {
        setEnvelope(swrKey, upgraded, {
            hotStorageKey: HOT_PLAYER_STORAGE_KEY,
            maxHotEntries: MAX_HOT_PLAYERS,
            maxAgeMs: PLAYER_MAX_AGE_MS,
        })
        syncPlayerAliases(upgraded, swrKey, effectiveKey === '__me__')
    }

    return upgraded
}

export const subscribeToPlayerKey = (
    routeId: string | undefined,
    listener: (fresh: ResolvedPlayer) => void
): (() => void) => subscribeKey(getPlayerSwrKey(getEffectivePlayerKey(routeId)), listener)
