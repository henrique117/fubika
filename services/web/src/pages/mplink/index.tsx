import React from 'react'
import { Link } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

const asset = (name: string) => `/assets/${name}`

type Match = {
    id: number
    title: string
    playedAt: string
    score: string
}

const matches: Match[] = [
    { id: 1, title: 'Moonlit Encounter', playedAt: 'Hoje, 14:20', score: '57.577.915' },
    { id: 2, title: 'Crimson Reverie', playedAt: 'Ontem, 22:48', score: '57.577.915' },
]

function Placement({ place, detailed, score }: { place: 1 | 2; detailed: boolean; score: string }) {
    return (
        <div
            className={style.placementRow}
            aria-label={`${place === 1 ? 'Primeiro' : 'Segundo'} lugar, -iccy`}
        >
            <span className={style.player}>
                {place === 1 ? (
                    <>
                        <img className={style.crown} src={asset('29f4d.png')} alt="Primeiro lugar" />
                        <span className={`${style.place} ${style.first}`}>1st</span>
                    </>
                ) : (
                    <span className={`${style.place} ${style.second}`}>2nd</span>
                )}
                <span className={style.playerName}>-iccy</span>
                <img className={style.rank} src={asset('fe05e.png')} alt="Rank SS" />
            </span>

            {detailed && (
                <span className={style.stats}>
                    <span className={`${style.stat} ${style.comboStat}`}>
                        <img src={asset('e578d.png')} alt="No Fail" />
                        <span className={style.label}>Combo</span>
                        <strong>1420</strong>
                    </span>
                    <span className={style.stat}>
                        <span className={style.label}>Precisão</span>
                        <strong>100%</strong>
                    </span>
                    <span className={`${style.stat} ${style.scoreStat}`}>
                        <span className={style.label}>Pontuação</span>
                        <strong>{score}</strong>
                        <small>Bom: 1099&nbsp;&nbsp; Ok: 0&nbsp;&nbsp; Meh: 0&nbsp;&nbsp; Miss: 0</small>
                    </span>
                </span>
            )}
        </div>
    )
}

function MatchCard({ match }: { match: Match }) {
    return (
        <article className={style.matchCard} aria-label={`${match.title}, ${match.playedAt}`}>
            <div className={style.beatmapImage}>
                <img src={asset('eae17.png')} alt="" />
            </div>
            <div className={style.placements}>
                <Placement place={1} detailed={match.id === 1} score={match.score} />
                <Placement place={2} detailed={match.id === 1} score={match.score} />
            </div>
        </article>
    )
}

const MpLink: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <section className={style.matchesPanel}>
                    <div className={style.panelHeading}>
                        <Link to="/profile" className={style.backButton} aria-label="Voltar">
                            <img src={asset('d3056.png')} alt="" />
                        </Link>
                        <h1>Matches</h1>
                    </div>

                    <div className={style.matchList}>
                        {matches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </section>
            </div>
        </WrapperComponent>
    )
}

export default MpLink
