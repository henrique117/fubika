import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { ProfileRankChart, WrapperComponent } from '../../components/components.export'
import {
    type ApiPlayer,
    type ApiScore,
    type ResolvedPlayer,
    DEFAULT_AVATAR_URL,
    FALLBACK_AVATAR_URL,
    fetchActivePlayer,
    fetchUserRecent,
    getCachedActivePlayerSnapshot,
    getCachedUserRecentSnapshot,
    getUniqueShowcaseScores,
    hasApiAuth,
} from '../../services/profileData'

const assets = '/assets'

interface MapItem {
    key: string
    title: string
    image: string
    fallbackImage: string
    beatmapId: number
}

const buildStats = (player: ApiPlayer, fallbackScores: ApiScore[]): [string, string][] => {
    const hitsFromScores = fallbackScores.reduce(
        (sum, score) => sum + (score.n300 || 0) + (score.n100 || 0) + (score.n50 || 0),
        0
    )
    const hasBackendTotalHits = typeof player.total_hits === 'number' && player.total_hits > 0
    const totalHits = hasBackendTotalHits ? player.total_hits! : hitsFromScores
    const playcount = player.playcount ?? 0
    const hitsPerPlay = hasBackendTotalHits
        ? playcount > 0
            ? Math.round(totalHits / playcount)
            : 0
        : fallbackScores.length > 0
          ? Math.round(hitsFromScores / fallbackScores.length)
          : 0

    return [
        ['Pontuação ranqueada', Number(player.ranked_score || 0).toLocaleString('en-US')],
        ['Precisão de acerto', `${Number(player.acc || 0).toFixed(2)}%`],
        ['Jogadas totais', Number(playcount).toLocaleString('en-US')],
        ['Pontuação total', Number(player.total_score || 0).toLocaleString('en-US')],
        ['Acertos totais', Number(totalHits).toLocaleString('en-US')],
        ['Acertos por jogada', Number(hitsPerPlay).toLocaleString('en-US')],
        ['Combo máximo', Number(player.max_combo || 0).toLocaleString('en-US')],
        ['Replays assistidos', Number(player.replay_views || 0).toLocaleString('en-US')],
    ]
}

interface ProfileAsyncState {
    key: string
    resolved: ResolvedPlayer | null
    recentScores: ApiScore[]
}

const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const routeKey = id ? `id:${id.trim().toLowerCase()}` : '__me__'
    const [asyncState, setAsyncState] = useState<ProfileAsyncState | null>(null)
    const isAuthenticated = hasApiAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }

        let cancelled = false

        const syncRecentFallback = async (resolved: ResolvedPlayer | null) => {
            if (!resolved) return

            if (!resolved.player.top_200 || resolved.player.top_200.length === 0) {
                const recent = await fetchUserRecent(resolved.player.id, 10, 0, {
                    onUpdate: (freshRecent) => {
                        if (!cancelled) {
                            setAsyncState((prev) =>
                                prev && prev.key === routeKey
                                    ? { ...prev, recentScores: freshRecent }
                                    : { key: routeKey, resolved, recentScores: freshRecent }
                            )
                        }
                    },
                })
                if (!cancelled) {
                    setAsyncState({ key: routeKey, resolved, recentScores: recent })
                }
            }
        }

        const loadProfile = async () => {
            const resolved = await fetchActivePlayer(id, {
                preferMe: !id,
                onUpdate: (freshResolved) => {
                    if (cancelled) return
                    setAsyncState((prev) => ({
                        key: routeKey,
                        resolved: freshResolved,
                        recentScores:
                            freshResolved.player.top_200 && freshResolved.player.top_200.length > 0
                                ? []
                                : prev?.key === routeKey
                                  ? prev.recentScores
                                  : [],
                    }))
                    void syncRecentFallback(freshResolved)
                },
            })
            if (cancelled) return

            if (!resolved) {
                setAsyncState({ key: routeKey, resolved: null, recentScores: [] })
                return
            }

            if (!resolved.player.top_200 || resolved.player.top_200.length === 0) {
                const cachedRecent = getCachedUserRecentSnapshot(resolved.player.id, 10) ?? []
                setAsyncState({ key: routeKey, resolved, recentScores: cachedRecent })
                await syncRecentFallback(resolved)
            } else {
                setAsyncState({ key: routeKey, resolved, recentScores: [] })
            }
        }

        loadProfile()

        return () => {
            cancelled = true
        }
    }, [id, routeKey, isAuthenticated])

    const cachedResolved =
        isAuthenticated && asyncState?.key !== routeKey
            ? getCachedActivePlayerSnapshot(id)
            : null
    const resolved = asyncState?.key === routeKey ? asyncState.resolved : cachedResolved
    const player = resolved?.player ?? null
    const stateRank = resolved?.stateRank ?? null
    const recentScores =
        asyncState?.key === routeKey
            ? asyncState.recentScores
            : player && (!player.top_200 || player.top_200.length === 0)
              ? (getCachedUserRecentSnapshot(player.id, 10) ?? [])
              : []

    const status: 'unauthenticated' | 'loading' | 'not-found' | 'ready' = !isAuthenticated
        ? 'unauthenticated'
        : asyncState?.key === routeKey
          ? resolved
              ? 'ready'
              : 'not-found'
          : cachedResolved
            ? 'ready'
            : 'loading'

    const wallpaperNode = (
        <div className={style.wallpaper} aria-hidden="true">
            {player?.banner && (
                <img
                    key={player.banner}
                    className={style.wallpaperImage}
                    src={player.banner}
                    alt=""
                    onError={(e) => {
                        e.currentTarget.style.display = 'none'
                    }}
                />
            )}
        </div>
    )

    if (status === 'unauthenticated' || status === 'not-found') {
        return (
            <WrapperComponent>
                <div className={style.profilePage}>
                    {wallpaperNode}
                    <div className={style.profilePanel}>
                        <section className={style.stateCard}>
                            <h1>
                                {status === 'unauthenticated'
                                    ? 'Entre para visualizar perfis'
                                    : 'Jogador não encontrado'}
                            </h1>
                            <p>
                                {status === 'unauthenticated'
                                    ? 'Faça login na sua conta Fubika para carregar estatísticas, melhores jogadas e histórico de ranque.'
                                    : 'Não foi possível localizar esse jogador no servidor.'}
                            </p>
                            <div className={style.stateActions}>
                                {status === 'unauthenticated' && (
                                    <Link to="/login" className={style.statePrimaryBtn}>
                                        Entrar
                                    </Link>
                                )}
                                <Link to="/ranking" className={style.stateSecondaryBtn}>
                                    Ver colocações
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </WrapperComponent>
        )
    }

    if (status === 'loading' || !player) {
        return (
            <WrapperComponent>
                <div className={style.profilePage}>{wallpaperNode}</div>
            </WrapperComponent>
        )
    }

    const displayName = player.name
    const avatarSrc = player.pfp || DEFAULT_AVATAR_URL
    const rawLevel = Number.isFinite(player.level) ? player.level : 0
    const levelLabel = `Nível ${Math.floor(rawLevel)}`
    const xpFraction = Math.max(0, Math.min(1, rawLevel % 1))
    const xpPercent = Math.round(xpFraction * 100)
    const xpBarWidthPx = Math.max(6, Math.min(143, Math.round(xpFraction * 143)))
    const globalRankLabel = `#${player.rank || 0}`
    const stateRankLabel = stateRank ? `#${stateRank}` : '-'

    const scoreSource =
        player.top_200 && player.top_200.length > 0 ? player.top_200 : recentScores

    const showcaseScores = getUniqueShowcaseScores(scoreSource, 10)

    const displayedMaps: MapItem[] = showcaseScores.map((score, index) => {
        const beatmap = score.beatmap
        const title = beatmap ? `${beatmap.title} - ${beatmap.artist}` : 'Mapa desconhecido'
        const image = beatmap?.cover || beatmap?.thumbnail || FALLBACK_AVATAR_URL
        return {
            key: `${score.id}-${index}`,
            title,
            image,
            fallbackImage: FALLBACK_AVATAR_URL,
            beatmapId: beatmap?.beatmap_id ?? 0,
        }
    })

    const stats = buildStats(player, scoreSource)

    return (
        <WrapperComponent>
            <div className={style.profilePage}>
                {wallpaperNode}

                <div className={style.profilePanel}>
                    <section className={style.profileHero} aria-labelledby="profile-name">
                        <ProfileRankChart
                            player={player}
                            scores={scoreSource}
                            className={style.chartBackground}
                        />
                        <div className={style.avatarFrame}>
                            <img
                                key={avatarSrc}
                                src={avatarSrc}
                                alt={`Foto de perfil de ${displayName}`}
                                loading="eager"
                                decoding="async"
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = FALLBACK_AVATAR_URL
                                }}
                            />
                        </div>

                        <div className={style.identity}>
                            <h1 id="profile-name" title={displayName}>
                                {displayName}
                            </h1>
                            <p>{levelLabel}</p>
                            <div
                                className={style.experience}
                                aria-label={`${xpPercent}% de experiência`}
                            >
                                <span style={{ width: `${xpBarWidthPx}px` }} />
                            </div>
                            <div className={style.ranks} id="rank">
                                <div>
                                    <small>Ranque Global</small>
                                    <strong>{globalRankLabel}</strong>
                                </div>
                                <div>
                                    <small>Ranque Estadual</small>
                                    <strong>{stateRankLabel}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={style.relationshipActions}>
                            <button type="button" className={style.mutualButton} title="Seguir">
                                <img src={`${assets}/26409.png`} alt="" />
                            </button>
                            <button
                                type="button"
                                className={style.bellButton}
                                title="Notificações"
                            >
                                <img src={`${assets}/edbd4.png`} alt="" />
                            </button>
                        </div>
                    </section>

                    <section className={style.showcase} id="maps">
                        <div className={style.mapSection}>
                            <h2 className={style.mapSectionTitle}>Mais jogados</h2>
                            <div className={style.mapList} aria-label="Mais jogados">
                                {displayedMaps.length > 0 ? (
                                    displayedMaps.map((map) => (
                                        <div
                                            key={map.key}
                                            className={style.mapPill}
                                            title={map.title}
                                            role={map.beatmapId > 0 ? 'link' : undefined}
                                            tabIndex={map.beatmapId > 0 ? 0 : undefined}
                                            onClick={
                                                map.beatmapId > 0
                                                    ? () => navigate(`/beatmap/${map.beatmapId}`)
                                                    : undefined
                                            }
                                            onKeyDown={
                                                map.beatmapId > 0
                                                    ? (e) => {
                                                          if (e.key === 'Enter' || e.key === ' ') {
                                                              e.preventDefault()
                                                              navigate(`/beatmap/${map.beatmapId}`)
                                                          }
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <img
                                                src={map.image}
                                                alt=""
                                                loading="eager"
                                                decoding="async"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = map.fallbackImage
                                                }}
                                            />
                                            <span>{map.title}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className={style.emptyMapsState}>
                                        Nenhuma jogada registrada ainda.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={style.statusPanel}>
                            <dl>
                                {stats.map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <img
                                className={style.cat}
                                src={`${assets}/17c9d.png`}
                                alt="Mascote gato azul"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Profile
