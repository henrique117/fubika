import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import {
    type ApiScore,
    fetchActivePlayer,
    fetchUserRecent,
    getCachedActivePlayerSnapshot,
    getCachedUserRecentSnapshot,
    getGradeAsset,
    hasApiAuth,
    hydrateScoresBeatmaps,
} from '../../../services/profileData'

const assets = '/assets'

type Play = {
    beatmapId?: number
    title?: string
    difficulty?: string
    pp?: string
    count300?: string
    count100?: string
    count50?: string
    misses?: string
    accuracy?: string
    mods?: string
    combo?: string
    rankSrc?: string
}

const scoreToRecentPlay = (score: ApiScore): Play => ({
    beatmapId: score.beatmap?.beatmap_id ?? 0,
    title: score.beatmap?.title || 'Mapa desconhecido',
    difficulty: score.beatmap?.diff || '',
    pp: `${Math.round(score.pp || 0)}pp`,
    count300: String(score.n300 ?? 0),
    count100: String(score.n100 ?? 0),
    count50: String(score.n50 ?? 0),
    misses: String(score.nmiss ?? 0),
    accuracy: `${Number(score.acc || 0).toFixed(2)}%`,
    mods: score.mods || 'NM',
    combo: `${score.max_combo ?? 0}x`,
    rankSrc: getGradeAsset(score.grade),
})

interface RecentAsyncState {
    key: string
    targetId: number | null
    scores: ApiScore[]
}

const ProfileRecentPlays: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const routeKey = id ? `id:${id.trim().toLowerCase()}` : '__active__'
    const [asyncState, setAsyncState] = useState<RecentAsyncState | null>(null)
    const isAuthenticated = hasApiAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }

        let cancelled = false

        const loadRecentForPlayer = async (activePlayer: {
            id: number
            top_200?: ApiScore[]
        }) => {
            const recent = await fetchUserRecent(activePlayer.id, 50, 0, {
                onUpdate: (freshRecent) => {
                    if (cancelled) return
                    if (freshRecent.length > 0) {
                        setAsyncState({
                            key: routeKey,
                            targetId: activePlayer.id,
                            scores: freshRecent,
                        })
                    }
                },
            })
            if (cancelled) return

            if (recent.length > 0) {
                setAsyncState({ key: routeKey, targetId: activePlayer.id, scores: recent })
            } else {
                const hydratedTop = await hydrateScoresBeatmaps(
                    (activePlayer.top_200 ?? []).slice(0, 50),
                    50
                )
                if (!cancelled) {
                    setAsyncState({
                        key: routeKey,
                        targetId: activePlayer.id,
                        scores: hydratedTop,
                    })
                }
            }
        }

        const loadRecentPlays = async () => {
            const resolved = await fetchActivePlayer(id, {
                hydrateCount: 0,
                onUpdate: (fresh) => {
                    if (!cancelled) {
                        void loadRecentForPlayer(fresh.player)
                    }
                },
            })
            if (cancelled) return

            if (!resolved) {
                setAsyncState({ key: routeKey, targetId: null, scores: [] })
                return
            }

            await loadRecentForPlayer(resolved.player)
        }

        loadRecentPlays()

        return () => {
            cancelled = true
        }
    }, [id, routeKey, isAuthenticated])

    const cachedResolved =
        isAuthenticated && asyncState?.key !== routeKey
            ? getCachedActivePlayerSnapshot(id)
            : null
    const cachedPlayerId = cachedResolved?.player?.id ?? null
    const cachedRecent = cachedPlayerId
        ? getCachedUserRecentSnapshot(cachedPlayerId, 50)
        : null
    const syncFallbackScores =
        cachedRecent && cachedRecent.length > 0
            ? cachedRecent
            : (cachedResolved?.player?.top_200 ?? []).slice(0, 50)

    const targetId = asyncState?.key === routeKey ? asyncState.targetId : cachedPlayerId
    const scores = asyncState?.key === routeKey ? asyncState.scores : syncFallbackScores

    const status: 'unauthenticated' | 'loading' | 'not-found' | 'ready' = !isAuthenticated
        ? 'unauthenticated'
        : asyncState?.key === routeKey
          ? targetId !== null
              ? 'ready'
              : 'not-found'
          : cachedPlayerId !== null
            ? 'ready'
            : 'loading'

    const plays: Play[] = Array.from({ length: 50 }, (_, index) =>
        scores[index] ? scoreToRecentPlay(scores[index]) : {}
    )

    const backPath = targetId ? `/profile/${targetId}` : '/profile'

    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.wallpaper} aria-hidden="true" />

                <section className={style.recentPanel} aria-labelledby="recent-title">
                    <div className={style.panelHeading}>
                        <Link to={backPath} className={style.backButton} aria-label="Voltar">
                            <img src={`${assets}/d3056.png`} alt="" />
                        </Link>
                        <h1 id="recent-title">Jogadas Recentes</h1>
                    </div>

                    {status === 'unauthenticated' || status === 'not-found' ? (
                        <div className={style.emptyTableState}>
                            <span>
                                {status === 'unauthenticated'
                                    ? 'Entre na sua conta para visualizar as jogadas recentes.'
                                    : 'Jogador não encontrado.'}
                            </span>
                            <Link to={status === 'unauthenticated' ? '/login' : '/ranking'}>
                                {status === 'unauthenticated' ? 'Entrar' : 'Ver colocações'}
                            </Link>
                        </div>
                    ) : status === 'loading' ? null : (
                        <div className={style.playsTable}>
                            <div className={style.tableHeader}>
                                <span className={style.songColumn} aria-hidden="true" />
                                <span>pp</span>
                                <span>300</span>
                                <span>100</span>
                                <span>50</span>
                                <span>X</span>
                                <span>Precisão</span>
                                <span>Mods</span>
                                <span>Combo máximo</span>
                            </div>

                            <div className={style.playList}>
                                {plays.map((play, index) => {
                                    const clickable = Boolean(play.beatmapId && play.beatmapId > 0)
                                    return (
                                        <div
                                            className={style.playRow}
                                            key={index}
                                            style={clickable ? { cursor: 'pointer' } : undefined}
                                            role={clickable ? 'link' : undefined}
                                            tabIndex={clickable ? 0 : undefined}
                                            onClick={
                                                clickable
                                                    ? () => navigate(`/beatmap/${play.beatmapId}`)
                                                    : undefined
                                            }
                                            onKeyDown={
                                                clickable
                                                    ? (e) => {
                                                          if (e.key === 'Enter' || e.key === ' ') {
                                                              e.preventDefault()
                                                              navigate(`/beatmap/${play.beatmapId}`)
                                                          }
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <span className={style.songCell}>
                                                {play.rankSrc && <img src={play.rankSrc} alt="" />}
                                                {play.title ? (
                                                    <span className={style.songCopy}>
                                                        <strong>{play.title}</strong>
                                                        <small>{play.difficulty}</small>
                                                    </span>
                                                ) : (
                                                    <span className={style.rankNumber}>#{index + 1}</span>
                                                )}
                                            </span>
                                            <span>{play.pp}</span>
                                            <span>{play.count300}</span>
                                            <span>{play.count100}</span>
                                            <span>{play.count50}</span>
                                            <span>{play.misses}</span>
                                            <span>{play.accuracy}</span>
                                            <span>{play.mods}</span>
                                            <span>{play.combo}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </section>

                <img className={style.mascot} src={`${assets}/17c9d.png`} alt="Mascote gato" />
            </div>
        </WrapperComponent>
    )
}

export default ProfileRecentPlays
