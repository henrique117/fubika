export interface CacheEnvelope<T> {
    data: T
    updatedAt: number
    fingerprint: string
}

export interface SetEnvelopeOptions {
    hotStorageKey?: string
    maxHotEntries?: number
    maxAgeMs?: number
    expiresAt?: number
}

export interface SwrFetchOptions<T> {
    key: string
    fetcher: () => Promise<T | null>
    staleTimeMs: number
    maxAgeMs: number
    hotStorageKey?: string
    maxHotEntries?: number
    onUpdate?: (freshData: T) => void
}

interface IdbCacheRecord {
    key: string
    envelope: CacheEnvelope<unknown>
    expiresAt: number
}

interface InFlightRevalidation<T> {
    promise: Promise<T | null>
    waiters: Set<(freshData: T) => void>
}

const IDB_NAME = 'fubika_swr_cache_v1'
const IDB_VERSION = 1
const IDB_STORE = 'entries'
const DEFAULT_IDB_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_HOT_MAX_ENTRIES = 20

const l1Cache = new Map<string, CacheEnvelope<unknown>>()
const hotBuckets = new Map<string, Map<string, CacheEnvelope<unknown>>>()
const keySubscribers = new Map<string, Set<(freshData: unknown) => void>>()
const inFlightFetch = new Map<string, Promise<unknown>>()
const inFlightRevalidations = new Map<string, InFlightRevalidation<unknown>>()

let idbPromise: Promise<IDBDatabase | null> | null = null
let hydrationPromise: Promise<void> | null = null

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

const isValidEnvelope = (value: unknown): value is CacheEnvelope<unknown> =>
    isRecord(value) &&
    'data' in value &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt) &&
    typeof value.fingerprint === 'string'

export const computeFingerprint = (value: unknown): string => {
    let serialized: string
    try {
        serialized = JSON.stringify(value) ?? ''
    } catch {
        serialized = String(value)
    }

    let h1 = 0x811c9dc5
    let h2 = 0x9e3779b9
    for (let i = 0; i < serialized.length; i++) {
        const code = serialized.charCodeAt(i)
        h1 ^= code
        h1 = Math.imul(h1, 0x01000193)
        h2 ^= code + ((i & 0xff) << 8)
        h2 = Math.imul(h2, 0x85ebca6b)
    }

    return `${serialized.length}:${(h1 >>> 0).toString(36)}:${(h2 >>> 0).toString(36)}`
}

const resolveExpiresAt = (updatedAt: number, options?: SetEnvelopeOptions): number => {
    if (typeof options?.expiresAt === 'number' && Number.isFinite(options.expiresAt)) {
        return options.expiresAt
    }
    const ttl =
        typeof options?.maxAgeMs === 'number' && Number.isFinite(options.maxAgeMs)
            ? options.maxAgeMs
            : DEFAULT_IDB_MAX_AGE_MS
    return updatedAt + ttl
}

const openDatabase = (): Promise<IDBDatabase | null> => {
    if (idbPromise) {
        return idbPromise
    }

    if (typeof indexedDB === 'undefined') {
        idbPromise = Promise.resolve(null)
        return idbPromise
    }

    idbPromise = new Promise((resolve) => {
        try {
            const request = indexedDB.open(IDB_NAME, IDB_VERSION)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: 'key' })
                }
            }
            request.onsuccess = () => {
                const db = request.result
                db.onversionchange = () => {
                    db.close()
                    idbPromise = null
                }
                resolve(db)
            }
            request.onerror = () => resolve(null)
            request.onblocked = () => resolve(null)
        } catch {
            resolve(null)
        }
    })

    return idbPromise
}

const deleteKeysFromIndexedDB = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) return
    const db = await openDatabase()
    if (!db) return

    await new Promise<void>((resolve) => {
        try {
            const tx = db.transaction(IDB_STORE, 'readwrite')
            const store = tx.objectStore(IDB_STORE)
            for (const key of keys) {
                store.delete(key)
            }
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
            tx.onabort = () => resolve()
        } catch {
            resolve()
        }
    })
}

export const putInIndexedDB = async (
    key: string,
    envelope: CacheEnvelope<unknown>,
    expiresAt: number
): Promise<void> => {
    const db = await openDatabase()
    if (!db) return

    await new Promise<void>((resolve) => {
        try {
            const tx = db.transaction(IDB_STORE, 'readwrite')
            const store = tx.objectStore(IDB_STORE)
            const record: IdbCacheRecord = { key, envelope, expiresAt }
            store.put(record)
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
            tx.onabort = () => resolve()
        } catch {
            resolve()
        }
    })
}

export const hydrateL1FromIndexedDB = (): Promise<void> => {
    if (hydrationPromise) {
        return hydrationPromise
    }

    hydrationPromise = (async () => {
        const db = await openDatabase()
        if (!db) return

        const records = await new Promise<IdbCacheRecord[]>((resolve) => {
            try {
                const tx = db.transaction(IDB_STORE, 'readonly')
                const store = tx.objectStore(IDB_STORE)
                const req = store.getAll()
                req.onsuccess = () => {
                    resolve(Array.isArray(req.result) ? (req.result as IdbCacheRecord[]) : [])
                }
                req.onerror = () => resolve([])
                tx.onabort = () => resolve([])
            } catch {
                resolve([])
            }
        })

        const now = Date.now()
        const expiredKeys: string[] = []

        for (const rec of records) {
            if (!rec || typeof rec.key !== 'string' || !isValidEnvelope(rec.envelope)) {
                continue
            }

            if (typeof rec.expiresAt === 'number' && rec.expiresAt <= now) {
                expiredKeys.push(rec.key)
                continue
            }

            const existing = l1Cache.get(rec.key)
            if (!existing || existing.updatedAt < rec.envelope.updatedAt) {
                l1Cache.set(rec.key, rec.envelope)
            }
        }

        if (expiredKeys.length > 0) {
            void deleteKeysFromIndexedDB(expiredKeys)
        }
    })()

    return hydrationPromise
}

const getHotBucket = (hotStorageKey: string): Map<string, CacheEnvelope<unknown>> => {
    const existing = hotBuckets.get(hotStorageKey)
    if (existing) {
        return existing
    }

    const bucket = new Map<string, CacheEnvelope<unknown>>()
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(hotStorageKey)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) {
                    for (const entry of parsed) {
                        if (
                            Array.isArray(entry) &&
                            typeof entry[0] === 'string' &&
                            isValidEnvelope(entry[1])
                        ) {
                            bucket.set(entry[0], entry[1])
                        }
                    }
                }
            }
        } catch {
            // Ignora storage corrompido ou indisponível
        }
    }

    hotBuckets.set(hotStorageKey, bucket)
    return bucket
}

const persistHotBucket = (
    hotStorageKey: string,
    bucket: Map<string, CacheEnvelope<unknown>>,
    maxHotEntries: number
): void => {
    if (typeof window === 'undefined') {
        return
    }

    while (bucket.size > maxHotEntries) {
        const oldestKey = bucket.keys().next().value
        if (oldestKey === undefined) break
        bucket.delete(oldestKey)
    }

    try {
        localStorage.setItem(hotStorageKey, JSON.stringify(Array.from(bucket.entries())))
    } catch {
        try {
            const entries = Array.from(bucket.entries())
            const trimmed = entries.slice(Math.floor(entries.length / 2))
            bucket.clear()
            for (const [k, v] of trimmed) {
                bucket.set(k, v)
            }
            localStorage.setItem(hotStorageKey, JSON.stringify(trimmed))
        } catch {
            // Ignora cota esgotada no localStorage; L1 + L2 IndexedDB permanecem intactos
        }
    }
}

const getFromIndexedDB = async <T>(
    key: string,
    maxAgeMs: number
): Promise<CacheEnvelope<T> | null> => {
    await hydrateL1FromIndexedDB()

    const now = Date.now()
    const afterHydration = l1Cache.get(key)
    if (afterHydration) {
        if (now - afterHydration.updatedAt <= maxAgeMs) {
            return afterHydration as CacheEnvelope<T>
        }
        return null
    }

    const db = await openDatabase()
    if (!db) return null

    const record = await new Promise<IdbCacheRecord | null>((resolve) => {
        try {
            const tx = db.transaction(IDB_STORE, 'readonly')
            const store = tx.objectStore(IDB_STORE)
            const req = store.get(key)
            req.onsuccess = () => resolve((req.result as IdbCacheRecord | undefined) ?? null)
            req.onerror = () => resolve(null)
            tx.onabort = () => resolve(null)
        } catch {
            resolve(null)
        }
    })

    if (!record || !isValidEnvelope(record.envelope)) {
        return null
    }

    if (now - record.envelope.updatedAt > maxAgeMs || (record.expiresAt && record.expiresAt <= now)) {
        return null
    }

    l1Cache.set(key, record.envelope)
    return record.envelope as CacheEnvelope<T>
}

const notifyKeySubscribers = (key: string, freshData: unknown): void => {
    const subscribers = keySubscribers.get(key)
    if (!subscribers || subscribers.size === 0) return

    for (const listener of Array.from(subscribers)) {
        try {
            listener(freshData)
        } catch {
            // Isola falha individual de listener
        }
    }
}

export const subscribeKey = <T>(
    key: string,
    listener: (freshData: T) => void
): (() => void) => {
    let listeners = keySubscribers.get(key)
    if (!listeners) {
        listeners = new Set()
        keySubscribers.set(key, listeners)
    }

    const wrapped = listener as (freshData: unknown) => void
    listeners.add(wrapped)

    return () => {
        const current = keySubscribers.get(key)
        if (!current) return
        current.delete(wrapped)
        if (current.size === 0) {
            keySubscribers.delete(key)
        }
    }
}

export const getEnvelopeSync = <T>(
    key: string,
    maxAgeMs: number,
    hotStorageKey?: string,
    allowExpired = false
): CacheEnvelope<T> | null => {
    let envelope = l1Cache.get(key)

    if (!envelope && hotStorageKey) {
        const bucket = getHotBucket(hotStorageKey)
        const hotEntry = bucket.get(key)
        if (hotEntry) {
            l1Cache.set(key, hotEntry)
            envelope = hotEntry
        }
    }

    if (!envelope) {
        return null
    }

    if (!allowExpired && Date.now() - envelope.updatedAt > maxAgeMs) {
        return null
    }

    return envelope as CacheEnvelope<T>
}

export const setEnvelope = <T>(
    key: string,
    data: T,
    options?: SetEnvelopeOptions
): { envelope: CacheEnvelope<T>; changed: boolean } => {
    const now = Date.now()
    const nextFingerprint = computeFingerprint(data)
    const existing =
        l1Cache.get(key) ??
        (options?.hotStorageKey ? getHotBucket(options.hotStorageKey).get(key) : undefined)

    const expiresAt = resolveExpiresAt(now, options)

    if (existing && existing.fingerprint === nextFingerprint) {
        const refreshed: CacheEnvelope<T> = {
            data: existing.data as T,
            updatedAt: now,
            fingerprint: nextFingerprint,
        }
        l1Cache.set(key, refreshed)

        if (options?.hotStorageKey) {
            const bucket = getHotBucket(options.hotStorageKey)
            bucket.delete(key)
            bucket.set(key, refreshed)
            persistHotBucket(
                options.hotStorageKey,
                bucket,
                options.maxHotEntries ?? DEFAULT_HOT_MAX_ENTRIES
            )
        }

        void putInIndexedDB(key, refreshed, expiresAt)
        return { envelope: refreshed, changed: false }
    }

    const nextEnvelope: CacheEnvelope<T> = {
        data,
        updatedAt: now,
        fingerprint: nextFingerprint,
    }

    l1Cache.set(key, nextEnvelope)

    if (options?.hotStorageKey) {
        const bucket = getHotBucket(options.hotStorageKey)
        bucket.delete(key)
        bucket.set(key, nextEnvelope)
        persistHotBucket(
            options.hotStorageKey,
            bucket,
            options.maxHotEntries ?? DEFAULT_HOT_MAX_ENTRIES
        )
    }

    void putInIndexedDB(key, nextEnvelope, expiresAt)
    notifyKeySubscribers(key, data)
    return { envelope: nextEnvelope, changed: true }
}

export const deleteKey = (key: string, hotStorageKey?: string): void => {
    l1Cache.delete(key)
    if (hotStorageKey) {
        const bucket = getHotBucket(hotStorageKey)
        if (bucket.delete(key)) {
            persistHotBucket(hotStorageKey, bucket, DEFAULT_HOT_MAX_ENTRIES)
        }
    }
    void deleteKeysFromIndexedDB([key])
}

const triggerRevalidation = <T>(
    options: SwrFetchOptions<T>,
    waiter?: (freshData: T) => void
): Promise<T | null> => {
    const { key, fetcher, maxAgeMs, hotStorageKey, maxHotEntries } = options
    const existing = inFlightRevalidations.get(key) as InFlightRevalidation<T> | undefined

    if (existing) {
        if (waiter) {
            existing.waiters.add(waiter)
        }
        return existing.promise
    }

    const waiters = new Set<(freshData: T) => void>()
    if (waiter) {
        waiters.add(waiter)
    }

    const promise = (async (): Promise<T | null> => {
        try {
            const freshData = await fetcher()
            if (freshData === null) {
                return null
            }

            const { envelope, changed } = setEnvelope(key, freshData, {
                hotStorageKey,
                maxHotEntries,
                maxAgeMs,
            })

            if (changed) {
                for (const cb of Array.from(waiters)) {
                    try {
                        cb(envelope.data)
                    } catch {
                        // Isola falha individual de callback
                    }
                }
            }

            return envelope.data
        } catch {
            return null
        } finally {
            waiters.clear()
            inFlightRevalidations.delete(key)
        }
    })()

    inFlightRevalidations.set(key, {
        promise,
        waiters: waiters as Set<(freshData: unknown) => void>,
    })

    return promise
}

const runForegroundFetch = <T>(options: SwrFetchOptions<T>): Promise<T | null> => {
    const { key, fetcher, maxAgeMs, hotStorageKey, maxHotEntries } = options
    const existingReval = inFlightRevalidations.get(key) as InFlightRevalidation<T> | undefined
    if (existingReval) {
        return existingReval.promise
    }

    const existingForeground = inFlightFetch.get(key) as Promise<T | null> | undefined
    if (existingForeground) {
        return existingForeground
    }

    const promise = (async (): Promise<T | null> => {
        try {
            const freshData = await fetcher()
            if (freshData === null) {
                return null
            }
            const { envelope } = setEnvelope(key, freshData, {
                hotStorageKey,
                maxHotEntries,
                maxAgeMs,
            })
            return envelope.data
        } catch {
            return null
        } finally {
            inFlightFetch.delete(key)
        }
    })()

    inFlightFetch.set(key, promise)
    return promise
}

export const swrFetch = async <T>(options: SwrFetchOptions<T>): Promise<T | null> => {
    const { key, staleTimeMs, maxAgeMs, hotStorageKey, maxHotEntries, onUpdate } = options

    let cached = getEnvelopeSync<T>(key, maxAgeMs, hotStorageKey)
    if (!cached) {
        cached = await getFromIndexedDB<T>(key, maxAgeMs)
        if (cached && hotStorageKey) {
            const bucket = getHotBucket(hotStorageKey)
            bucket.delete(key)
            bucket.set(key, cached)
            persistHotBucket(hotStorageKey, bucket, maxHotEntries ?? DEFAULT_HOT_MAX_ENTRIES)
        }
    }

    if (cached) {
        const age = Date.now() - cached.updatedAt
        if (age <= staleTimeMs) {
            return cached.data
        }

        if (age <= maxAgeMs) {
            void triggerRevalidation(options, onUpdate)
            return cached.data
        }
    }

    return runForegroundFetch(options)
}

export const waitForIdbHydration = (): Promise<void> => hydrateL1FromIndexedDB()

if (typeof indexedDB !== 'undefined') {
    void hydrateL1FromIndexedDB()
}
