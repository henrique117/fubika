import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import {
    type ApiPlayer,
    fetchActivePlayer,
    getCachedActivePlayerSnapshot,
    getGradeAsset,
    hasApiAuth,
} from '../../../services/profileData'

const assets = '/assets'

type Play = {
    rank: number
    beatmapId?: number
    title?: string
    difficulty?: string
    pp?: number
    hit300?: number
    hit100?: number
    hit50?: number
    misses?: number
    accuracy?: number
    mods?: string
    combo?: string
    gradeSrc?: string
}

const ProfileTopPlays: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const routeKey = id ? `id:${id.trim().toLowerCase()}` : '__active__'
    const [asyncState, setAsyncState] = useState<{
        key: string
        player: ApiPlayer | null
    } | null>(null)
    const isAuthenticated = hasApiAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }

        let cancelled = false

        const loadTopPlays = async () => {
            const resolved = await fetchActivePlayer(id, {
                hydrateCount: 50,
                onUpdate: (fresh) => {
                    if (!cancelled) {
                        setAsyncState({ key: routeKey, player: fresh.player })
                    }
                },
            })
            if (cancelled) return
            setAsyncState({ key: routeKey, player: resolved?.player ?? null })
        }

        loadTopPlays()

        return () => {
            cancelled = true
        }
    }, [id, routeKey, isAuthenticated])

    const cachedPlayer =
        isAuthenticated && asyncState?.key !== routeKey
            ? (getCachedActivePlayerSnapshot(id)?.player ?? null)
            : null
    const player = asyncState?.key === routeKey ? asyncState.player : cachedPlayer

    const status: 'unauthenticated' | 'loading' | 'not-found' | 'ready' = !isAuthenticated
        ? 'unauthenticated'
        : asyncState?.key === routeKey
          ? player
              ? 'ready'
              : 'not-found'
          : cachedPlayer
            ? 'ready'
            : 'loading'

    const realTopScores = player?.top_200 ?? []
    const plays: Play[] = Array.from({ length: 50 }, (_, index) => {
        const rank = index + 1
        const score = realTopScores[index]
        if (!score) {
            return { rank }
        }

        return {
            rank,
            beatmapId: score.beatmap?.beatmap_id ?? 0,
            title: score.beatmap?.title || 'Mapa desconhecido',
            difficulty: score.beatmap?.diff || '',
            pp: Math.round(score.pp || 0),
            hit300: score.n300,
            hit100: score.n100,
            hit50: score.n50,
            misses: score.nmiss,
            accuracy: Number(score.acc || 0),
            mods: score.mods || 'NM',
            combo: `${score.max_combo || 0}x`,
            gradeSrc: getGradeAsset(score.grade),
        }
    })

    const backPath = player ? `/profile/${player.id}` : '/profile'

    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.heroArt} aria-hidden="true" />

                <section className={style.leaderboard} aria-labelledby="page-title">
                    <div className={style.leaderboardHeading}>
                        <Link to={backPath} className={style.backButton} aria-label="Voltar">
                            <img src={`${assets}/d3056.png`} alt="" />
                        </Link>
                        <h1 id="page-title">Melhores Jogadas</h1>
                    </div>

                    {status === 'unauthenticated' || status === 'not-found' ? (
                        <div className={style.emptyTableState}>
                            <span>
                                {status === 'unauthenticated'
                                    ? 'Entre na sua conta para visualizar as melhores jogadas.'
                                    : 'Jogador não encontrado.'}
                            </span>
                            <Link to={status === 'unauthenticated' ? '/login' : '/ranking'}>
                                {status === 'unauthenticated' ? 'Entrar' : 'Ver colocações'}
                            </Link>
                        </div>
                    ) : status === 'loading' ? null : (
                        <div className={style.tableScroll}>
                            <div className={style.playTable}>
                                <div className={style.tableHeader} role="row">
                                    <span>#</span>
                                    <span aria-hidden="true" />
                                    <span>pp</span>
                                    <span>300</span>
                                    <span>100</span>
                                    <span>50</span>
                                    <span>X</span>
                                    <span>Precisão</span>
                                    <span>Mods</span>
                                    <span>Combo máximo</span>
                                </div>

                                <div className={style.rows} role="rowgroup">
                                    {plays.map((play) => {
                                        const clickable = Boolean(play.beatmapId && play.beatmapId > 0)
                                        return (
                                            <div
                                                className={style.playRow}
                                                key={play.rank}
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
                                                aria-label={
                                                    play.title
                                                        ? `#${play.rank}, ${play.title}`
                                                        : `Colocação ${play.rank}`
                                                }
                                            >
                                                <span className={style.rankCell}>
                                                    {play.gradeSrc ? (
                                                        <img src={play.gradeSrc} alt="" />
                                                    ) : (
                                                        `#${play.rank}`
                                                    )}
                                                </span>
                                                <span className={style.songCell}>
                                                    {play.title && <strong>{play.title}</strong>}
                                                    {play.difficulty && <small>{play.difficulty}</small>}
                                                </span>
                                                <span>{play.pp !== undefined ? `${play.pp}pp` : ''}</span>
                                                <span>{play.hit300 ?? ''}</span>
                                                <span>{play.hit100 ?? ''}</span>
                                                <span>{play.hit50 ?? ''}</span>
                                                <span>{play.misses ?? ''}</span>
                                                <span>
                                                    {play.accuracy !== undefined
                                                        ? `${play.accuracy.toFixed(2)}%`
                                                        : ''}
                                                </span>
                                                <span>{play.mods ?? ''}</span>
                                                <span>{play.combo ?? ''}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <img className={style.catMascot} src={`${assets}/17c9d.png`} alt="Mascote gato azul" />
                </section>
            </div>
        </WrapperComponent>
    )
}

export default ProfileTopPlays
