import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import {
    type ApiBeatmap,
    type ApiBeatmapset,
    fetchActivePlayer,
    fetchBeatmapWithSetFromMirror,
    fetchUserRecent,
    getCachedBeatmapSetFromMirror,
    getDefaultCachedBeatmapSetSnapshot,
    hasApiAuth,
} from '../../services/profileData'

const A = '/assets'

const difficulties = [
    { icon: '072f7.svg', label: '2.4', title: 'Iniciante' },
    { icon: '23630.svg', label: '3.1', title: 'Fácil' },
    { icon: '1adf0.svg', label: '4.0', title: 'Normal' },
    { icon: '1730f.svg', label: '6.1', title: 'Challenger' },
    { icon: '2ff96.svg', label: '7.2', title: 'Insano' },
    { icon: 'b6e12.svg', label: '8.0', title: 'Expert' },
    { icon: '886d5.svg', label: '9.3', title: 'Extremo' },
]

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
    currentBeatmap: ApiBeatmap | null
    beatmapSet: ApiBeatmapset | null
}) {
    const navigate = useNavigate()
    const [selectedDiff, setSelectedDiff] = useState(6)
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

    const coverSrc = currentBeatmap?.cover || `${A}/9bef5.png`
    const diffName = currentBeatmap
        ? currentBeatmap.diff.includes("'") || !currentBeatmap.author_name
            ? currentBeatmap.diff
            : `${currentBeatmap.author_name}'s ${currentBeatmap.diff}`
        : `ismagius' ${difficulties[selectedDiff].title}`
    const diffSrText = currentBeatmap
        ? Number(currentBeatmap.star_rating || 0).toFixed(1)
        : difficulties[selectedDiff].label
    const statusText = currentBeatmap ? formatBeatmapStatus(currentBeatmap.status) : 'Ranqueado'

    const timeValue = currentBeatmap ? formatDuration(currentBeatmap.total_length) : '2:11'
    const bpmValue = currentBeatmap ? String(Math.round(currentBeatmap.bpm || 0)) : '180'
    const circleValue = currentBeatmap ? String(currentBeatmap.count_circles ?? 0) : '222'
    const sliderValue = currentBeatmap ? String(currentBeatmap.count_sliders ?? 0) : '222'

    const detailRows: [string, number, string][] = currentBeatmap
        ? [
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
        : [
              ['Tamanho do círculo', 38, '5'],
              ['Drenagem de HP', 46, '6'],
              ['Precisão', 60, '8'],
              ['Taxa de aproximação', 67, '9'],
              ['Dificuldade', 47, difficulties[selectedDiff].label],
          ]

    const passRate =
        currentBeatmap && (currentBeatmap.playcount ?? 0) > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      ((currentBeatmap.passcount ?? 0) / (currentBeatmap.playcount ?? 1)) * 100
                  )
              )
            : null
    const successFillWidth = passRate !== null ? Math.round((passRate / 100) * 207) : undefined
    const successLabel = passRate !== null ? `${passRate.toFixed(1)}%` : '10.8%'

    return (
        <section className={style.mapCard} id="mapa">
            <div className={style.mapTitle}>
                <img src={`${A}/17c9d.png`} alt="" />
                <h1
                    title={
                        currentBeatmap
                            ? `${currentBeatmap.title} - ${currentBeatmap.artist}`
                            : 'Informações do mapa'
                    }
                >
                    {currentBeatmap ? `${currentBeatmap.title} - ${currentBeatmap.artist}` : 'Informações do mapa'}
                </h1>
            </div>
            <div className={style.mapHero}>
                <img
                    key={coverSrc}
                    className={style.mapCover}
                    src={coverSrc}
                    alt={currentBeatmap ? `Arte de ${currentBeatmap.title}` : 'Arte do beatmap'}
                    onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = `${A}/9bef5.png`
                    }}
                />
                <div className={style.mapShade} />
                <div className={style.difficultyPicker} aria-label="Dificuldades">
                    {currentBeatmap && visibleSetDiffs.length > 0
                        ? visibleSetDiffs.map((item) => {
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
                          })
                        : difficulties.map((item, index) => (
                              <button
                                  key={item.icon}
                                  type="button"
                                  className={selectedDiff === index ? style.selected : ''}
                                  onClick={() => setSelectedDiff(index)}
                                  title={`${item.title} — ${item.label}`}
                                  aria-label={`Dificuldade ${item.title}`}
                              >
                                  <img src={`${A}/${item.icon}`} alt="" />
                              </button>
                          ))}
                </div>
                <div className={style.difficultyName} title={diffName}>{diffName}</div>
                <div className={style.difficultyValue}>Dificuldade {diffSrText}</div>
                <div className={style.ranked}>{statusText}</div>
                <aside className={style.mapInfo}>
                    <button
                        type="button"
                        className={style.play}
                        aria-label={isPlayingPreview ? 'Pausar prévia' : 'Reproduzir prévia'}
                        title={isPlayingPreview ? 'Pausar prévia' : 'Reproduzir prévia'}
                        onClick={handleTogglePreview}
                    >
                        <img src={`${A}/1b679.png`} alt="" />
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
    const routeKey = id ? `id:${id.trim()}` : '__default__'
    const [asyncBundle, setAsyncBundle] = useState<{
        key: string
        beatmap: ApiBeatmap | null
        beatmapSet: ApiBeatmapset | null
    } | null>(null)

    useEffect(() => {
        let cancelled = false

        const loadBeatmap = async () => {
            let targetBeatmapId = id

            if (!targetBeatmapId && hasApiAuth()) {
                const resolved = await fetchActivePlayer(undefined, { hydrateCount: 0 })
                if (cancelled) return

                const topMapId = resolved?.player?.top_200?.[0]?.beatmap?.beatmap_id
                if (topMapId && topMapId > 0) {
                    targetBeatmapId = String(topMapId)
                } else if (resolved?.player?.id) {
                    const recent = await fetchUserRecent(resolved.player.id, 1)
                    if (cancelled) return
                    const recentMapId = recent[0]?.beatmap?.beatmap_id
                    if (recentMapId && recentMapId > 0) {
                        targetBeatmapId = String(recentMapId)
                    }
                }
            }

            if (!targetBeatmapId) {
                setAsyncBundle({ key: routeKey, beatmap: null, beatmapSet: null })
                return
            }

            const cachedMirror = getCachedBeatmapSetFromMirror(targetBeatmapId)
            if (cachedMirror) {
                setAsyncBundle({
                    key: routeKey,
                    beatmap: cachedMirror.beatmap,
                    beatmapSet: cachedMirror.beatmapSet,
                })
                return
            }

            const mirror = await fetchBeatmapWithSetFromMirror(targetBeatmapId)
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

    const syncBundle =
        asyncBundle?.key === routeKey
            ? null
            : id
              ? getCachedBeatmapSetFromMirror(id)
              : getDefaultCachedBeatmapSetSnapshot()
    const currentBeatmap =
        asyncBundle?.key === routeKey ? asyncBundle.beatmap : (syncBundle?.beatmap ?? null)
    const beatmapSet =
        asyncBundle?.key === routeKey ? asyncBundle.beatmapSet : (syncBundle?.beatmapSet ?? null)

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
