import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import NotFoundPage from '../notfound'
import {
    type ApiBeatmap,
    type ApiBeatmapset,
    fetchBeatmapWithSetFromMirror,
    getCachedBeatmapSetFromMirror,
} from '../../services/profileData'

const A = '/assets'

const rows = Array.from({ length: 50 }, (_, i) => i + 1)

const getDifficultyIcon = (starRating: number): string => {
    if (starRating < 2.0) return '072f7.svg'
    if (starRating < 2.7) return '23630.svg'
    if (starRating < 4.0) return '1adf0.svg'
    if (starRating < 5.3) return '1730f.svg'
    if (starRating < 6.5) return '2ff96.svg'
    if (starRating < 8.0) return 'b6e12.svg'
    return '886d5.svg'
}

const formatBeatmapStatus = (status?: string): string => {
    switch ((status || '').toLowerCase()) {
        case 'ranked':
            return 'Ranqueado'
        case 'approved':
            return 'Aprovado'
        case 'qualified':
            return 'Qualificado'
        case 'loved':
            return 'Loved'
        case 'pending':
            return 'Pendente'
        case 'wip':
            return 'WIP'
        case 'graveyard':
            return 'Graveyard'
        default:
            return 'Ranqueado'
    }
}

const formatDuration = (totalSeconds?: number): string => {
    const safeTotal = Math.max(0, Math.floor(totalSeconds || 0))
    const minutes = Math.floor(safeTotal / 60)
    const seconds = (safeTotal % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
}

const formatStatNumber = (value?: number): string => {
    const safe = Number(value || 0)
    return Number.isInteger(safe) ? String(safe) : safe.toFixed(1)
}

const barWidthForTenScale = (value?: number): number => {
    const safe = Number(value || 0)
    return Math.min(75, Math.max(0, Math.round((safe / 10) * 75)))
}

function StatIcon({ type, value }: { type: 'time' | 'bpm' | 'circle' | 'slider'; value: string }) {
    const icon =
        type === 'time'
            ? '085a3.png'
            : type === 'bpm'
                ? 'dedea.png'
                : type === 'circle'
                    ? '91880.svg'
                    : 'cbdcb.svg'
    const isMasked = type === 'time' || type === 'bpm'

    return (
        <div className={`${style.microStat} ${style[type]}`}>
            <span className={style.statCircle}>
                {isMasked ? (
                    <i
                        className={style.statMaskIcon}
                        style={{
                            WebkitMaskImage: `url(${A}/${icon})`,
                            maskImage: `url(${A}/${icon})`,
                        }}
                    />
                ) : (
                    <img src={`${A}/${icon}`} alt="" />
                )}
            </span>
            <b>{value}</b>
        </div>
    )
}

function MapCard({
    currentBeatmap,
    beatmapSet,
}: {
    currentBeatmap: ApiBeatmap
    beatmapSet: ApiBeatmapset | null
}) {
    const navigate = useNavigate()
    const [playingSetId, setPlayingSetId] = useState<number | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const loadedAudioSetIdRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.onended = null
                audioRef.current.onpause = null
                audioRef.current.pause()
                audioRef.current = null
            }
            loadedAudioSetIdRef.current = null
        }
    }, [currentBeatmap?.beatmapset_id])

    const isPlayingPreview = Boolean(
        currentBeatmap?.beatmapset_id && playingSetId === currentBeatmap.beatmapset_id
    )

    const handleTogglePreview = () => {
        const setId = currentBeatmap?.beatmapset_id
        if (!setId) return
        const previewUrl = `https://b.ppy.sh/preview/${setId}.mp3`

        if (audioRef.current && loadedAudioSetIdRef.current === setId) {
            if (!audioRef.current.paused) {
                audioRef.current.pause()
                setPlayingSetId(null)
                return
            }
            audioRef.current
                .play()
                .then(() => setPlayingSetId(setId))
                .catch(() => {})
            return
        }

        if (audioRef.current) {
            audioRef.current.onended = null
            audioRef.current.onpause = null
            audioRef.current.pause()
        }

        const audio = new Audio(previewUrl)
        audio.volume = 0.35
        audio.onended = () => setPlayingSetId(null)
        audio.onpause = () => setPlayingSetId(null)
        audioRef.current = audio
        loadedAudioSetIdRef.current = setId
        audio
            .play()
            .then(() => setPlayingSetId(setId))
            .catch(() => {})
    }

    const sortedSetDiffs = (beatmapSet?.beatmaps || [])
        .slice()
        .sort((a, b) => (a.star_rating || 0) - (b.star_rating || 0))

    const visibleSetDiffs = (() => {
        if (sortedSetDiffs.length <= 7) return sortedSetDiffs
        const activeIdx = currentBeatmap
            ? sortedSetDiffs.findIndex((item) => item.beatmap_id === currentBeatmap.beatmap_id)
            : 0
        const safeActiveIdx = activeIdx >= 0 ? activeIdx : 0
        const start = Math.max(0, Math.min(safeActiveIdx - 3, sortedSetDiffs.length - 7))
        return sortedSetDiffs.slice(start, start + 7)
    })()

    const coverSrc = currentBeatmap.cover || currentBeatmap.thumbnail || ''
    const diffName =
        currentBeatmap.diff.includes("'") || !currentBeatmap.author_name
            ? currentBeatmap.diff
            : `${currentBeatmap.author_name}'s ${currentBeatmap.diff}`
    const diffSrText = Number(currentBeatmap.star_rating || 0).toFixed(1)
    const statusText = formatBeatmapStatus(currentBeatmap.status)

    const timeValue = formatDuration(currentBeatmap.total_length)
    const bpmValue = String(Math.round(currentBeatmap.bpm || 0))
    const circleValue = String(currentBeatmap.count_circles ?? 0)
    const sliderValue = String(currentBeatmap.count_sliders ?? 0)

    const detailRows: [string, number, string][] = [
        [
            'Tamanho do círculo',
            barWidthForTenScale(currentBeatmap.cs),
            formatStatNumber(currentBeatmap.cs),
        ],
        [
            'Drenagem de HP',
            barWidthForTenScale(currentBeatmap.hp),
            formatStatNumber(currentBeatmap.hp),
        ],
        [
            'Precisão',
            barWidthForTenScale(currentBeatmap.od),
            formatStatNumber(currentBeatmap.od),
        ],
        [
            'Taxa de aproximação',
            barWidthForTenScale(currentBeatmap.ar),
            formatStatNumber(currentBeatmap.ar),
        ],
        [
            'Dificuldade',
            barWidthForTenScale(currentBeatmap.star_rating),
            Number(currentBeatmap.star_rating || 0).toFixed(1),
        ],
    ]

    const passRate =
        (currentBeatmap.playcount ?? 0) > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      ((currentBeatmap.passcount ?? 0) / (currentBeatmap.playcount ?? 1)) * 100
                  )
              )
            : 0
    const successFillWidth = Math.round((passRate / 100) * 207)
    const successLabel = `${passRate.toFixed(1)}%`

    return (
        <section className={style.mapCard} id="mapa">
            <div className={style.mapTitle}>
                <img src={`${A}/17c9d.png`} alt="" />
                <h1 title={`${currentBeatmap.title} - ${currentBeatmap.artist}`}>
                    {currentBeatmap.title} - {currentBeatmap.artist}
                </h1>
            </div>
            <div className={style.mapHero}>
                {coverSrc && (
                    <img
                        key={coverSrc}
                        className={style.mapCover}
                        src={coverSrc}
                        alt={`Arte de ${currentBeatmap.title}`}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                )}
                <div className={style.mapShade} />
                <div className={style.difficultyPicker} aria-label="Dificuldades">
                    {visibleSetDiffs.map((item) => {
                        const sr = Number(item.star_rating || 0)
                        const isSelected = item.beatmap_id === currentBeatmap.beatmap_id
                        return (
                            <button
                                key={item.beatmap_id}
                                type="button"
                                className={isSelected ? style.selected : ''}
                                onClick={() => navigate(`/beatmap/${item.beatmap_id}`)}
                                title={`${item.diff} — ${sr.toFixed(1)}`}
                                aria-label={`Dificuldade ${item.diff}`}
                            >
                                <img src={`${A}/${getDifficultyIcon(sr)}`} alt="" />
                            </button>
                        )
                    })}
                </div>
                <div className={style.difficultyMeta}>
                    <span className={style.difficultyValue}>
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.4l2.92 6.08 6.68.92-4.87 4.68 1.2 6.64L12 17.52l-5.93 3.2 1.2-6.64L2.4 9.4l6.68-.92L12 2.4z" />
                        </svg>
                        <span>{diffSrText}</span>
                    </span>
                    <span className={style.difficultyName} title={diffName}>{diffName}</span>
                </div>
                <div className={style.ranked}>{statusText}</div>
                <aside className={style.mapInfo}>
                    <button
                        type="button"
                        className={style.play}
                        aria-label={isPlayingPreview ? 'Pausar prévia' : 'Reproduzir prévia'}
                        title={isPlayingPreview ? 'Pausar prévia' : 'Reproduzir prévia'}
                        onClick={handleTogglePreview}
                    >
                        {isPlayingPreview ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <rect x="5.5" y="4" width="4.5" height="16" rx="1.5" />
                                <rect x="14" y="4" width="4.5" height="16" rx="1.5" />
                            </svg>
                        ) : (
                            <img src={`${A}/1b679.png`} alt="" />
                        )}
                    </button>
                    <div className={style.quickStats}>
                        <StatIcon type="time" value={timeValue} />
                        <StatIcon type="bpm" value={bpmValue} />
                        <StatIcon type="circle" value={circleValue} />
                        <StatIcon type="slider" value={sliderValue} />
                    </div>
                    <div className={style.detailStats}>
                        {detailRows.map(([label, barWidth, value]) => (
                            <div className={style.detailRow} key={label}>
                                <label>{label}</label>
                                <i>
                                    <b style={{ width: `${barWidth}px` }} />
                                </i>
                                <em>{value}</em>
                            </div>
                        ))}
                    </div>
                    <div className={style.success}>
                        <strong>Taxa de Sucesso</strong>
                        <div>
                            <i style={successFillWidth !== undefined ? { width: `${successFillWidth}px` } : undefined} />
                        </div>
                        <small>{successLabel}</small>
                    </div>
                </aside>
                <div className={style.mapButtons}>
                    <button type="button" className={style.favorite} aria-label="Favoritar mapa">
                        <img src={`${A}/54c7a.png`} alt="" />
                    </button>
                    <button
                        type="button"
                        onClick={
                            currentBeatmap?.beatmapset_id
                                ? () => {
                                      window.location.href = `https://catboy.best/d/${currentBeatmap.beatmapset_id}`
                                  }
                                : undefined
                        }
                    >
                        <span>Download</span>
                        <img src={`${A}/16782.png`} alt="" />
                    </button>
                    <button
                        type="button"
                        onClick={
                            currentBeatmap?.beatmap_id
                                ? () => {
                                      window.location.href = `osu://b/${currentBeatmap.beatmap_id}`
                                  }
                                : undefined
                        }
                    >
                        <span>Osu!Direct</span>
                        <img src={`${A}/16782.png`} alt="" />
                    </button>
                </div>
            </div>
            <div className={style.mapFooter} />
        </section>
    )
}

function Leaderboard() {
    return (
        <section className={style.leaderboard} id="leaderboard">
            <div className={style.cats} aria-hidden="true">
                <img className={style.catLeft} src={`${A}/583f4.png`} alt="" />
                <img className={style.catRight} src={`${A}/17c9d.png`} alt="" />
            </div>
            <div className={style.boardHeading}>
                <h2>Leaderboard do mapa</h2>
            </div>
            <div className={style.tableHead} aria-hidden="true">
                <span>Jogador</span>
                <span>pp</span>
                <span>300</span>
                <span>100</span>
                <span>50</span>
                <span>X</span>
                <span>Precisão</span>
                <span>Mods</span>
                <span>Combo máximo</span>
            </div>
            <div className={style.scoreList}>
                {rows.map((position) => (
                    <article className={style.scoreRow} key={position}>
                        <span className={style.position}>#{position}</span>
                    </article>
                ))}
            </div>
        </section>
    )
}

const Beatmap: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const routeKey = id ? `id:${id.trim()}` : '__empty__'
    const [asyncBundle, setAsyncBundle] = useState<{
        key: string
        beatmap: ApiBeatmap | null
        beatmapSet: ApiBeatmapset | null
    } | null>(null)

    useEffect(() => {
        if (!id) {
            return
        }

        let cancelled = false

        const loadBeatmap = async () => {
            const cachedMirror = getCachedBeatmapSetFromMirror(id)
            if (cachedMirror) {
                setAsyncBundle({
                    key: routeKey,
                    beatmap: cachedMirror.beatmap,
                    beatmapSet: cachedMirror.beatmapSet,
                })
                return
            }

            const mirror = await fetchBeatmapWithSetFromMirror(id)
            if (cancelled) return

            if (mirror) {
                setAsyncBundle({
                    key: routeKey,
                    beatmap: mirror.beatmap,
                    beatmapSet: mirror.beatmapSet,
                })
            } else {
                setAsyncBundle({ key: routeKey, beatmap: null, beatmapSet: null })
            }
        }

        loadBeatmap()

        return () => {
            cancelled = true
        }
    }, [id, routeKey])

    if (!id) {
        return <NotFoundPage />
    }

    const syncBundle =
        asyncBundle?.key === routeKey ? null : getCachedBeatmapSetFromMirror(id)
    const currentBeatmap =
        asyncBundle?.key === routeKey ? asyncBundle.beatmap : (syncBundle?.beatmap ?? null)
    const beatmapSet =
        asyncBundle?.key === routeKey ? asyncBundle.beatmapSet : (syncBundle?.beatmapSet ?? null)

    if (asyncBundle?.key === routeKey && !currentBeatmap) {
        return <NotFoundPage />
    }

    if (!currentBeatmap) {
        return (
            <WrapperComponent>
                <div className={style.appShell} />
            </WrapperComponent>
        )
    }

    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.pageShell}>
                    <MapCard currentBeatmap={currentBeatmap} beatmapSet={beatmapSet} />
                    <Leaderboard />
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Beatmap
