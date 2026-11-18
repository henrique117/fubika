import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { ProfileRankChart, WrapperComponent } from '../../../components/components.export'
import {
    type ApiPlayer,
    DEFAULT_AVATAR_URL,
    FALLBACK_AVATAR_URL,
    fetchActivePlayer,
    getCachedActivePlayerSnapshot,
    hasApiAuth,
} from '../../../services/profileData'

const asset = (name: string) => `/assets/${name}`

type Achievement = {
    image: string
    title: string
    description: string
    tier: string
}

const achievements: Achievement[] = [
    {
        image: 'f8422.png',
        title: 'Primeiros passos',
        description: 'Jogue sua primeira partida.',
        tier: 'Bronze',
    },
    {
        image: '7e59f.png',
        title: 'Em movimento',
        description: 'Complete 25 partidas.',
        tier: 'Prata',
    },
    { image: '968d6.png', title: 'Veterano', description: 'Complete 100 partidas.', tier: 'Ouro' },
    {
        image: '720f8.png',
        title: 'Incansável',
        description: 'Complete 250 partidas.',
        tier: 'Platina',
    },
    {
        image: '840e7.png',
        title: 'Na classificação',
        description: 'Entre no ranque global.',
        tier: 'Bronze',
    },
    {
        image: 'fe8a5.png',
        title: 'Entre os melhores',
        description: 'Alcance o top 500.',
        tier: 'Prata',
    },
    { image: '9754f.png', title: 'Elite mundial', description: 'Alcance o top 100.', tier: 'Ouro' },
    {
        image: '25556.png',
        title: 'Número um',
        description: 'Chegue ao topo do ranque.',
        tier: 'Platina',
    },
    {
        image: '97df4.png',
        title: 'Aprovado',
        description: 'Passe uma fase sem falhar.',
        tier: 'Bronze',
    },
    {
        image: '53adb.png',
        title: 'Impecável',
        description: 'Passe 10 fases sem falhar.',
        tier: 'Prata',
    },
    {
        image: '77ecc.png',
        title: 'Perfeccionista',
        description: 'Conclua uma campanha perfeita.',
        tier: 'Ouro',
    },
    {
        image: 'd7076.png',
        title: 'Sem limites',
        description: 'Domine todas as campanhas.',
        tier: 'Platina',
    },
    {
        image: '70b30.png',
        title: 'Combo completo',
        description: 'Conquiste seu primeiro full combo.',
        tier: 'Bronze',
    },
    { image: 'b7c6f.png', title: 'Precisão', description: 'Faça 10 full combos.', tier: 'Prata' },
    { image: '0aa07.png', title: 'Virtuose', description: 'Faça 50 full combos.', tier: 'Ouro' },
    { image: '1bd95.png', title: 'Lendário', description: 'Faça 100 full combos.', tier: 'Platina' },
]

const panels = [
    { title: 'Habilidade', frame: 'f6b0a.svg', populated: true },
    { title: 'Dedicação', frame: 'eae86.svg', populated: false },
    { title: 'Introdução a modificações', frame: '32df0.svg', populated: false },
    { title: 'Hush-Hush', frame: 'eae86.svg', populated: false },
]

const ProfileAchievements: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const routeKey = id ? `id:${id.trim().toLowerCase()}` : '__active__'
    const [asyncState, setAsyncState] = useState<{
        key: string
        player: ApiPlayer | null
        stateRank: number | null
    } | null>(null)
    const isAuthenticated = hasApiAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }

        let cancelled = false

        const loadPlayer = async () => {
            const resolved = await fetchActivePlayer(id, {
                hydrateCount: 0,
                onUpdate: (fresh) => {
                    if (!cancelled) {
                        setAsyncState({
                            key: routeKey,
                            player: fresh.player,
                            stateRank: fresh.stateRank,
                        })
                    }
                },
            })
            if (cancelled) return
            setAsyncState({
                key: routeKey,
                player: resolved?.player ?? null,
                stateRank: resolved?.stateRank ?? null,
            })
        }

        loadPlayer()

        return () => {
            cancelled = true
        }
    }, [id, routeKey, isAuthenticated])

    const cachedResolved =
        isAuthenticated && asyncState?.key !== routeKey
            ? getCachedActivePlayerSnapshot(id)
            : null
    const player =
        asyncState?.key === routeKey ? asyncState.player : (cachedResolved?.player ?? null)
    const stateRank =
        asyncState?.key === routeKey
            ? asyncState.stateRank
            : (cachedResolved?.stateRank ?? null)

    const status: 'unauthenticated' | 'loading' | 'not-found' | 'ready' = !isAuthenticated
        ? 'unauthenticated'
        : asyncState?.key === routeKey
          ? player
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
                <div className={style.appShell}>
                    {wallpaperNode}
                    <section className={style.profileCard}>
                        <div className={style.stateCard}>
                            <h1>
                                {status === 'unauthenticated'
                                    ? 'Entre para visualizar conquistas'
                                    : 'Jogador não encontrado'}
                            </h1>
                            <p>
                                {status === 'unauthenticated'
                                    ? 'Faça login na sua conta Fubika para acompanhar suas medalhas e conquistas.'
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
                        </div>
                    </section>
                </div>
            </WrapperComponent>
        )
    }

    if (status === 'loading' || !player) {
        return (
            <WrapperComponent>
                <div className={style.appShell}>{wallpaperNode}</div>
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
    const backPath = `/profile/${player.id}`

    return (
        <WrapperComponent>
            <div className={style.appShell}>
                {wallpaperNode}

                <section className={style.profileCard} aria-label={`Conquistas de ${displayName}`}>
                    <div className={style.profileHero}>
                        <ProfileRankChart
                            player={player}
                            scores={player.top_200 ?? []}
                            className={style.graph}
                        />
                        <div
                            className={style.profilePicture}
                            style={{ cursor: 'pointer' }}
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate(backPath)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    navigate(backPath)
                                }
                            }}
                        >
                            <img
                                key={avatarSrc}
                                src={avatarSrc}
                                alt={`Foto de perfil de ${displayName}`}
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = FALLBACK_AVATAR_URL
                                }}
                            />
                        </div>

                        <div className={style.profileCopy}>
                            <h1
                                title={displayName}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(backPath)}
                            >
                                {displayName}
                            </h1>
                            <p className={style.level}>{levelLabel}</p>
                            <div className={style.xpTrack} aria-label={`${xpPercent}% de experiência`}>
                                <span style={{ width: `${xpBarWidthPx}px` }} />
                            </div>
                            <div className={style.ranks}>
                                <div>
                                    <small>Ranque Global</small>
                                    <strong className={style.rankGlobal}>{globalRankLabel}</strong>
                                </div>
                                <div>
                                    <small>Ranque Estadual</small>
                                    <strong className={style.rankState}>{stateRankLabel}</strong>
                                </div>
                            </div>
                            <div className={style.relationshipActions}>
                                <button type="button" className={style.mutual} aria-label="Seguir">
                                    <img src={asset('26409.png')} alt="" />
                                </button>
                                <button type="button" className={style.bell} aria-label="Notificações">
                                    <img src={asset('edbd4.png')} alt="" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={style.achievementGrid}>
                        {panels.map((panel) => (
                            <section className={style.achievementPanel} key={panel.title}>
                                <img
                                    className={style.panelFrame}
                                    src={asset(panel.frame)}
                                    alt=""
                                    width="330"
                                    height="382"
                                />
                                <h2>{panel.title}</h2>
                                {panel.populated && (
                                    <div className={style.badges}>
                                        {achievements.map((achievement) => (
                                            <div
                                                key={achievement.image}
                                                className={style.badge}
                                                title={`${achievement.title} (${achievement.tier}) - ${achievement.description}`}
                                                aria-label={`${achievement.title}, ${achievement.tier}`}
                                            >
                                                <img src={asset(achievement.image)} alt={achievement.title} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </section>
            </div>
        </WrapperComponent>
    )
}

export default ProfileAchievements
