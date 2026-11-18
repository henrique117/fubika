import React from 'react'
import { Link } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'

const assets = '/assets'

type Play = {
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
    rank?: string
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
        rank: '09e97.png',
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
        rank: 'adaa3.png',
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
        rank: 'adaa3.png',
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
        rank: 'adaa3.png',
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

const plays: Play[] = Array.from({ length: 50 }, (_, index) => ({
    ...(featuredPlays[index] ?? {}),
    rank: rankByRow[index],
}))

const ProfileRecentPlays: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.wallpaper} aria-hidden="true" />

                <section className={style.recentPanel} aria-labelledby="recent-title">
                    <div className={style.panelHeading}>
                        <Link to="/profile" className={style.backButton} aria-label="Voltar">
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
                            {plays.map((play, index) => (
                                <div className={style.playRow} key={index}>
                                    <span className={style.songCell}>
                                        {play.rank && <img src={`${assets}/${play.rank}`} alt="" />}
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
                            ))}
                        </div>
                    </div>
                </section>

                <img className={style.mascot} src={`${assets}/17c9d.png`} alt="Mascote gato" />
            </div>
        </WrapperComponent>
    )
}

export default ProfileRecentPlays
