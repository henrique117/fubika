import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import {
    type ApiPlayer,
    fetchActivePlayer,
    getCachedActivePlayerSnapshot,
    getGradeAsset,
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
    grade?: string
    gradeSrc?: string
}

const featured: Play[] = [
    {
        rank: 1,
        title: 'Thrilling One Way by Aqours',
        difficulty: 'Selfish Passion',
        pp: 350,
        hit300: 685,
        hit100: 7,
        hit50: 0,
        misses: 0,
        accuracy: 98.95,
        mods: 'HD',
        combo: '1601x',
        grade: 's',
    },
    {
        rank: 2,
        title: 'Still Into You by Paramore',
        difficulty: "_vanity's Insane",
        pp: 120,
        hit300: 727,
        hit100: 7,
        hit50: 2,
        misses: 7,
        accuracy: 97.27,
        mods: 'HDDTHRFLRX',
        combo: '950x',
        grade: 'oreg',
    },
    {
        rank: 3,
        title: 'Asu no Yozora Shoukaihan by Yuaru',
        difficulty: 'Sky Arrow',
        pp: 230,
        hit300: 891,
        hit100: 12,
        hit50: 4,
        misses: 2,
        accuracy: 97.63,
        mods: 'HD',
        combo: '1000x',
        grade: 'oreg',
    },
    {
        rank: 4,
        title: 'Los! Los! Los!',
        difficulty: "Kalibe's Extra",
        pp: 180,
        hit300: 640,
        hit100: 23,
        hit50: 4,
        misses: 2,
        accuracy: 96.73,
        mods: 'HR',
        combo: '1300x',
        grade: 'oreg',
    },
]

const rankGrades: Record<number, string> = {
    5: 'alemao',
    6: '47w47',
    7: '47w47',
    8: 'oreg',
    9: 'alemao',
    10: 'hasan',
    11: 'hasan',
    12: 'alemao',
    13: 'alemao',
    14: 'alemao',
    15: '47w47',
    16: 'oreg',
    17: 'alemao',
    18: 'hasan',
    19: 'shisui',
    20: 'hasan',
    21: '47w47',
    22: 'shisui',
    23: 'alemao',
    24: '47w47',
    25: '47w47',
}

const gradeImages: Record<string, string> = {
    s: '09e97.png',
    shisui: '8e9f0.png',
    alemao: '7ae37.png',
    '47w47': '66a8d.png',
    oreg: 'adaa3.png',
    hasan: 'bac4b.png',
}

const fallbackPlays: Play[] = Array.from({ length: 50 }, (_, index) => {
    const rank = index + 1
    const base = featured[index] ?? { rank, grade: rankGrades[rank] }
    return {
        ...base,
        gradeSrc: base.grade ? `${assets}/${gradeImages[base.grade]}` : undefined,
    }
})

const ProfileTopPlays: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const routeKey = id ? `id:${id.trim().toLowerCase()}` : '__active__'
    const [asyncState, setAsyncState] = useState<{
        key: string
        player: ApiPlayer | null
    } | null>(null)

    useEffect(() => {
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
    }, [id, routeKey])

    const player =
        asyncState?.key === routeKey
            ? asyncState.player
            : (getCachedActivePlayerSnapshot(id)?.player ?? null)

    const realTopScores = player?.top_200 ?? []
    const plays: Play[] =
        realTopScores.length > 0
            ? Array.from({ length: 50 }, (_, index) => {
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
            : fallbackPlays

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

                    <img className={style.catMascot} src={`${assets}/17c9d.png`} alt="Mascote gato azul" />
                </section>
            </div>
        </WrapperComponent>
    )
}

export default ProfileTopPlays
