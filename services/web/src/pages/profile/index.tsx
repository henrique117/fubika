import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { ProfileRankChart, WrapperComponent } from '../../components/components.export'
import {
    type ApiPlayer,
    type ApiScore,
    fetchActivePlayer,
    fetchUserRecent,
} from '../../services/profileData'

const assets = '/assets'

interface MapItem {
    key: string
    title: string
    image: string
    fallbackImage: string
    beatmapId: number
}

const defaultMaps: MapItem[] = [
    { key: 'm1', title: 'Harumachi Clover - Hanasaka Yui (CV: M.A.O)', image: `${assets}/1da67.png`, fallbackImage: `${assets}/1da67.png`, beatmapId: 0 },
    { key: 'm2', title: 'Get Jinxed', image: `${assets}/9bef5.png`, fallbackImage: `${assets}/9bef5.png`, beatmapId: 0 },
    { key: 'm3', title: 'Los! Los! Los!', image: `${assets}/5ef09.png`, fallbackImage: `${assets}/5ef09.png`, beatmapId: 0 },
    { key: 'm4', title: 'Trust me', image: `${assets}/42d4a.png`, fallbackImage: `${assets}/42d4a.png`, beatmapId: 0 },
    { key: 'm5', title: 'Sad Spring', image: `${assets}/e2302.png`, fallbackImage: `${assets}/e2302.png`, beatmapId: 0 },
    { key: 'm6', title: 'Night of Knights', image: `${assets}/4f2fc.png`, fallbackImage: `${assets}/4f2fc.png`, beatmapId: 0 },
    { key: 'm7', title: 'Lionheart', image: `${assets}/b2e0b.png`, fallbackImage: `${assets}/b2e0b.png`, beatmapId: 0 },
    { key: 'm8', title: 'Torero', image: `${assets}/3388a.png`, fallbackImage: `${assets}/3388a.png`, beatmapId: 0 },
    { key: 'm9', title: 'Through the Fire and Flames', image: `${assets}/cd522.png`, fallbackImage: `${assets}/cd522.png`, beatmapId: 0 },
    { key: 'm10', title: 'Ai wa Binchoutan', image: `${assets}/04814.png`, fallbackImage: `${assets}/04814.png`, beatmapId: 0 },
]

const defaultStats: [string, string][] = [
    ['Pontuação ranqueada', '17,153,107,992'],
    ['Precisão de acerto', '98.40%'],
    ['Jogadas totais', '18,688'],
    ['Pontuação total', '48,336,973,155'],
    ['Acertos totais', '6,386,777'],
    ['Acertos por jogada', '341'],
    ['Combo máximo', '2,709'],
    ['Replays assistidos', '132'],
]

const buildStats = (player: ApiPlayer | null, fallbackScores: ApiScore[]): [string, string][] => {
    if (!player) {
        return defaultStats
    }

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

const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [player, setPlayer] = useState<ApiPlayer | null>(null)
    const [stateRank, setStateRank] = useState<number | null>(null)
    const [recentScores, setRecentScores] = useState<ApiScore[]>([])

    useEffect(() => {
        let cancelled = false

        const loadProfile = async () => {
            const resolved = await fetchActivePlayer(id, { preferMe: !id })
            if (cancelled) return

            if (!resolved) {
                setPlayer(null)
                setStateRank(null)
                setRecentScores([])
                return
            }

            setPlayer(resolved.player)
            setStateRank(resolved.stateRank)

            if (!resolved.player.top_200 || resolved.player.top_200.length === 0) {
                const recent = await fetchUserRecent(resolved.player.id, 10)
                if (!cancelled) {
                    setRecentScores(recent)
                }
            } else {
                setRecentScores([])
            }
        }

        loadProfile()

        return () => {
            cancelled = true
        }
    }, [id])

    const displayName = player?.name || 'Arlecchino'
    const avatarSrc = player?.pfp || `${assets}/e464c.png`
    const rawLevel = Number.isFinite(player?.level) ? player!.level : 0
    const levelLabel = player ? `Nível ${Math.floor(rawLevel)}` : 'Nível -100'
    const xpFraction = Math.max(0, Math.min(1, rawLevel % 1))
    const xpPercent = player ? Math.round(xpFraction * 100) : 12
    const xpBarWidthPx = Math.max(6, Math.min(143, Math.round(xpFraction * 143)))
    const globalRankLabel = player ? `#${player.rank || 0}` : '#1000'
    const stateRankLabel = player ? (stateRank ? `#${stateRank}` : '-') : '#25'

    const scoreSource =
        player?.top_200 && player.top_200.length > 0 ? player.top_200 : recentScores

    const displayedMaps: MapItem[] =
        scoreSource.length > 0
            ? scoreSource.slice(0, 10).map((score, index) => {
                  const fallbackImage = defaultMaps[index % defaultMaps.length].image
                  const beatmap = score.beatmap
                  const title = beatmap
                      ? `${beatmap.title} - ${beatmap.artist}`
                      : 'Mapa desconhecido'
                  const image = beatmap?.cover || beatmap?.thumbnail || fallbackImage
                  return {
                      key: `${score.id}-${index}`,
                      title,
                      image,
                      fallbackImage,
                      beatmapId: beatmap?.beatmap_id ?? 0,
                  }
              })
            : defaultMaps

    const stats = buildStats(player, scoreSource)

    return (
        <WrapperComponent>
            <div className={style.profilePage}>
                <div className={style.wallpaper} aria-hidden="true" />

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
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = `${assets}/e464c.png`
                                }}
                            />
                        </div>

                        <div className={style.identity}>
                            <h1 id="profile-name" title={displayName}>{displayName}</h1>
                            <p>{levelLabel}</p>
                            <div className={style.experience} aria-label={`${xpPercent}% de experiência`}>
                                <span style={player ? { width: `${xpBarWidthPx}px` } : undefined} />
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
                            <button type="button" className={style.bellButton} title="Notificações">
                                <img src={`${assets}/edbd4.png`} alt="" />
                            </button>
                        </div>
                    </section>

                    <section className={style.showcase} id="maps">
                        <div className={style.mapList} aria-label="Mapas favoritos">
                            {displayedMaps.map((map) => (
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
                                        onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = map.fallbackImage
                                        }}
                                    />
                                    <span>{map.title}</span>
                                </div>
                            ))}
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
                            <img className={style.cat} src={`${assets}/17c9d.png`} alt="Mascote gato azul" />
                        </div>
                    </section>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Profile
