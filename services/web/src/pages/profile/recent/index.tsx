import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import {
    type ApiScore,
    fetchActivePlayer,
    fetchUserRecent,
    getGradeAsset,
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

const featuredPlays: Play[] = [
    {
        title: 'Thrilling One Way by Aqours',
        difficulty: 'Selfish Passion',
        pp: '350pp',
        count300: '685',
        count100: '7',
        count50: '0',
        misses: '0',
        accuracy: '98.95%',
        mods: 'HD',
        combo: '1601x',
    },
    {
        title: 'Still Into You by Paramore',
        difficulty: "_vanity's Insane",
        pp: '120pp',
        count300: '727',
        count100: '7',
        count50: '2',
        misses: '7',
        accuracy: '97.27%',
        mods: 'HDDTHRFLRX',
        combo: '950x',
    },
    {
        title: 'Asu no Yozora Shoukaihan by Yuaru',
        difficulty: 'Sky Arrow',
        pp: '230pp',
        count300: '891',
        count100: '12',
        count50: '4',
        misses: '2',
        accuracy: '97.63%',
        mods: 'HD',
        combo: '1000x',
    },
    {
        title: 'Los! Los! Los!',
        difficulty: "Kalibe's Extra",
        pp: '180pp',
        count300: '640',
        count100: '23',
        count50: '4',
        misses: '2',
        accuracy: '96.73%',
        mods: 'HR',
        combo: '1300x',
    },
]

const rankByRow = [
    '09e97.png',
    'adaa3.png',
    'adaa3.png',
    'adaa3.png',
    '7ae37.png',
    '66a8d.png',
    '66a8d.png',
    'adaa3.png',
    '7ae37.png',
    'bac4b.png',
    'bac4b.png',
    '7ae37.png',
    '7ae37.png',
    '66a8d.png',
    'adaa3.png',
    '7ae37.png',
    'bac4b.png',
    '8e9f0.png',
    'bac4b.png',
    '66a8d.png',
    '8e9f0.png',
    '7ae37.png',
    '66a8d.png',
    '66a8d.png',
    '66a8d.png',
]

const fallbackPlays: Play[] = Array.from({ length: 50 }, (_, index) => ({
    ...(featuredPlays[index] ?? {}),
    rankSrc: rankByRow[index] ? `${assets}/${rankByRow[index]}` : undefined,
}))

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

const ProfileRecentPlays: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [targetId, setTargetId] = useState<number | null>(null)
    const [scores, setScores] = useState<ApiScore[]>([])

    useEffect(() => {
        let cancelled = false

        const loadRecentPlays = async () => {
            const resolved = await fetchActivePlayer(id, { hydrateCount: 0 })
            if (cancelled) return

            if (!resolved) {
                setTargetId(null)
                setScores([])
                return
            }

            const activePlayer = resolved.player
            const recent = await fetchUserRecent(activePlayer.id, 50)
            if (cancelled) return

            if (recent.length > 0) {
                setTargetId(activePlayer.id)
                setScores(recent)
            } else {
                const hydratedTop = await hydrateScoresBeatmaps(
                    (activePlayer.top_200 ?? []).slice(0, 50),
                    50
                )
                if (!cancelled) {
                    setTargetId(activePlayer.id)
                    setScores(hydratedTop)
                }
            }
        }

        loadRecentPlays()

        return () => {
            cancelled = true
        }
    }, [id])

    const plays: Play[] =
        targetId !== null
            ? Array.from({ length: 50 }, (_, index) =>
                  scores[index] ? scoreToRecentPlay(scores[index]) : {}
              )
            : fallbackPlays

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
                </section>

                <img className={style.mascot} src={`${assets}/17c9d.png`} alt="Mascote gato" />
            </div>
        </WrapperComponent>
    )
}

export default ProfileRecentPlays
