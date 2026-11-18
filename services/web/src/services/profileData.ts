import { api } from './api'

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

const ACTIVE_PROFILE_STORAGE_KEY = 'fubika_active_profile_id'
const BEATMAP_STORAGE_KEY = 'fubika_beatmaps_v1'
const BEATMAPSET_STORAGE_KEY = 'fubika_beatmapsets_v1'
const MAX_CACHED_BEATMAPS = 500
const MAX_CACHED_BEATMAPSETS = 60
const CACHE_TTL_MS = 30_000
const RANKING_CACHE_TTL_MS = 60_000
const CATBOY_API_BASE = 'https://catboy.best/api/v2'

const playerCache = new Map<string, { timestamp: number; data: ResolvedPlayer }>()
const inFlightPlayerRequests = new Map<string, Promise<ResolvedPlayer | null>>()
const recentCache = new Map<string, { timestamp: number; data: ApiScore[] }>()
const inFlightRecentRequests = new Map<string, Promise<ApiScore[]>>()
const rankingPageCache = new Map<string, { timestamp: number; data: ApiPlayer[] }>()
const inFlightRankingRequests = new Map<string, Promise<ApiPlayer[]>>()
const inFlightBeatmapSetRequests = new Map<
    string,
    Promise<{ beatmap: ApiBeatmap; beatmapSet: ApiBeatmapset } | null>
>()
const inFlightBatchBeatmapRequests = new Map<number, Promise<void>>()

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

const readStoredProfileId = (): string | null => {
    try {
        return sessionStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
    } catch {
        return null
    }
}

const writeStoredProfileId = (id: number): void => {
    try {
        sessionStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(id))
    } catch {
        // Ignora indisponibilidade de storage
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
        // Libera espaço mantendo metade das entradas recentes em caso de quota excedida
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

const setCachedBeatmap = (beatmap: ApiBeatmap): void => {
    if (!beatmap.beatmap_id || beatmap.beatmap_id <= 0) return
    beatmapMirrorCache.delete(beatmap.beatmap_id)
    beatmapMirrorCache.set(beatmap.beatmap_id, beatmap)
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

export const hydrateScoresBeatmaps = async (
    scores: ApiScore[],
    maxCount = 50
): Promise<ApiScore[]> => {
    if (!Array.isArray(scores) || scores.length === 0) {
        return scores
    }

    if (maxCount <= 0) {
        return scores.map((score) =>
            score.beatmap
                ? {
                      ...score,
                      beatmap: applyDeterministicCovers(
                          beatmapMirrorCache.get(score.beatmap.beatmap_id) ?? score.beatmap
                      ),
                  }
                : score
        )
    }

    const limit = Math.min(scores.length, maxCount)
    const missingIdSet = new Set<number>()
    const pendingPromises: Promise<void>[] = []

    for (let i = 0; i < limit; i++) {
        const beatmap = scores[i]?.beatmap
        if (beatmap && needsBeatmapHydration(beatmap)) {
            if (beatmapMirrorCache.has(beatmap.beatmap_id)) {
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

    return scores.map((score) => {
        if (!score.beatmap) {
            return score
        }

        const cached = beatmapMirrorCache.get(score.beatmap.beatmap_id)
        if (cached) {
            return {
                ...score,
                beatmap: applyDeterministicCovers(cached),
            }
        }

        return {
            ...score,
            beatmap: applyDeterministicCovers(score.beatmap),
        }
    })
}

export const getCachedBeatmapSetFromMirror = (
    beatmapId: number | string,
    beatmapsetId?: number
): { beatmap: ApiBeatmap; beatmapSet: ApiBeatmapset } | null => {
    const numericId = Number(beatmapId)
    const cachedMap = Number.isFinite(numericId)
        ? beatmapMirrorCache.get(numericId)
        : undefined
    const targetSetId = beatmapsetId || cachedMap?.beatmapset_id || 0
    if (targetSetId <= 0) return null

    const cachedSet = beatmapSetMirrorCache.get(targetSetId)
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

const fetchRankingPageCached = async (
    mode = 0,
    page = 1,
    country?: string
): Promise<ApiPlayer[]> => {
    const normalizedCountry = country?.trim().toUpperCase() || undefined
    const cacheKey = `${mode}:${page}:${normalizedCountry || 'GLOBAL'}`

    const cached = rankingPageCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < RANKING_CACHE_TTL_MS) {
        return cached.data
    }

    const inFlight = inFlightRankingRequests.get(cacheKey)
    if (inFlight) {
        return inFlight
    }

    const requestPromise = (async () => {
        try {
            const res = await api.get<ApiPlayer[]>('/ranking/global', {
                params: {
                    mode,
                    page,
                    country: normalizedCountry,
                },
            })
            const data = Array.isArray(res.data) ? res.data : []
            rankingPageCache.set(cacheKey, { timestamp: Date.now(), data })
            return data
        } catch {
            return []
        } finally {
            inFlightRankingRequests.delete(cacheKey)
        }
    })()

    inFlightRankingRequests.set(cacheKey, requestPromise)
    return requestPromise
}

export const fetchUserRecent = async (
    userId: number | string,
    limit = 50,
    mode = 0
): Promise<ApiScore[]> => {
    if (!hasApiAuth()) {
        return []
    }

    const cacheKey = `${userId}:${mode}:${limit}`
    const cached = recentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data
    }

    const inFlight = inFlightRecentRequests.get(cacheKey)
    if (inFlight) {
        return inFlight
    }

    const requestPromise = (async () => {
        try {
            const res = await api.get<ApiScore[]>(
                `/user/${encodeURIComponent(String(userId))}/recent`,
                { params: { mode, limit } }
            )
            const rawData = Array.isArray(res.data) ? res.data : []
            const data = await hydrateScoresBeatmaps(rawData, limit)
            recentCache.set(cacheKey, { timestamp: Date.now(), data })
            return data
        } catch {
            return []
        } finally {
            inFlightRecentRequests.delete(cacheKey)
        }
    })()

    inFlightRecentRequests.set(cacheKey, requestPromise)
    return requestPromise
}

const resolvePlayerAndStateRank = async (
    routeId?: string,
    options?: { preferMe?: boolean; hydrateCount?: number }
): Promise<ResolvedPlayer | null> => {
    let player: ApiPlayer | null = null
    let globalTopPage: ApiPlayer[] | null = null

    if (routeId) {
        try {
            const res = await api.get<ApiPlayer>(`/user/${encodeURIComponent(routeId)}`)
            player = res.data
            if (player?.id) {
                writeStoredProfileId(player.id)
            }
        } catch {
            return null
        }
    } else {
        const storedId = readStoredProfileId()

        if (!options?.preferMe && storedId) {
            try {
                const res = await api.get<ApiPlayer>(`/user/${encodeURIComponent(storedId)}`)
                player = res.data
            } catch {
                player = null
            }
        }

        if (!player) {
            try {
                const res = await api.get<ApiPlayer>('/user/me')
                player = res.data
            } catch {
                player = null
            }
        }

        if (!player) {
            globalTopPage = await fetchRankingPageCached(0, 1)
            const firstPlayer = globalTopPage[0]
            if (firstPlayer?.id) {
                try {
                    const userRes = await api.get<ApiPlayer>(`/user/${firstPlayer.id}`)
                    player = userRes.data
                } catch {
                    player = null
                }
            }
        }

        if (player?.id) {
            writeStoredProfileId(player.id)
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

    let country = player.country?.trim()
    if (!country) {
        if (!globalTopPage) {
            globalTopPage = await fetchRankingPageCached(0, 1)
        }
        const foundInGlobal = globalTopPage.find((item) => item.id === player!.id)
        if (foundInGlobal?.country) {
            country = foundInGlobal.country.trim()
            player = { ...player, country }
        }
    }

    let stateRank: number | null = null
    if (country && country.length === 2 && country.toLowerCase() !== 'xx') {
        const stateList = await fetchRankingPageCached(0, 1, country)
        const found = stateList.find((item) => item.id === player!.id)
        if (found) {
            stateRank =
                typeof found.rank === 'number' && found.rank > 0
                    ? found.rank
                    : stateList.indexOf(found) + 1
        }
    }

    const result: ResolvedPlayer = { player, stateRank }
    playerCache.set(String(player.id), { timestamp: Date.now(), data: result })
    if (player.safe_name) {
        playerCache.set(player.safe_name.toLowerCase(), { timestamp: Date.now(), data: result })
    }
    return result
}

export const fetchActivePlayer = async (
    routeId?: string,
    options?: { preferMe?: boolean; hydrateCount?: number }
): Promise<ResolvedPlayer | null> => {
    if (!hasApiAuth()) {
        return null
    }

    const hydrateCount = options?.hydrateCount ?? 10
    const effectiveKey = routeId
        ? routeId.trim().toLowerCase()
        : !options?.preferMe && readStoredProfileId()
          ? readStoredProfileId()!
          : '__me__'

    const cached = playerCache.get(effectiveKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        writeStoredProfileId(cached.data.player.id)

        if (
            hydrateCount > 0 &&
            Array.isArray(cached.data.player.top_200) &&
            cached.data.player.top_200.slice(0, hydrateCount).some((s) => needsBeatmapHydration(s.beatmap))
        ) {
            const hydratedTop = await hydrateScoresBeatmaps(
                cached.data.player.top_200,
                hydrateCount
            )
            const updated: ResolvedPlayer = {
                ...cached.data,
                player: { ...cached.data.player, top_200: hydratedTop },
            }
            playerCache.set(effectiveKey, { timestamp: Date.now(), data: updated })
            playerCache.set(String(updated.player.id), { timestamp: Date.now(), data: updated })
            return updated
        }

        return cached.data
    }

    const existingPromise = inFlightPlayerRequests.get(effectiveKey)
    if (existingPromise) {
        const existingResult = await existingPromise
        if (
            existingResult &&
            hydrateCount > 0 &&
            Array.isArray(existingResult.player.top_200) &&
            existingResult.player.top_200
                .slice(0, hydrateCount)
                .some((s) => needsBeatmapHydration(s.beatmap))
        ) {
            const hydratedTop = await hydrateScoresBeatmaps(
                existingResult.player.top_200,
                hydrateCount
            )
            return {
                ...existingResult,
                player: { ...existingResult.player, top_200: hydratedTop },
            }
        }
        return existingResult
    }

    const requestPromise = resolvePlayerAndStateRank(routeId, options)
        .then((res) => {
            if (res && effectiveKey === '__me__') {
                playerCache.set('__me__', { timestamp: Date.now(), data: res })
            }
            return res
        })
        .finally(() => {
            inFlightPlayerRequests.delete(effectiveKey)
        })

    inFlightPlayerRequests.set(effectiveKey, requestPromise)
    return requestPromise
}
