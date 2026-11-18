import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

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

const names = [
    '-Iccy',
    'GAS MASK',
    'Kim Da-Hyun',
    'Loopyng',
    'Jumbatambo',
    'Mozard',
    'Red Velvet',
    'Serasona',
    'Hb20monstro',
    'Joingui',
    'Simabuco',
    'KitBengala',
    'Bolleta',
    'Viqbarros',
    'Oregue',
    'Alemão',
    'Sporinho',
    'Dumal77',
    'Hasanchez',
    '47w47',
    'ShisuiHaru',
    'Relix',
    'Mestre',
    'Neko',
    'Yuki',
]

const rankIcons = [
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

const scores = [
    ['350pp', '685', '7', '0', '0', '98.95%', 'HD', '1601x'],
    ['120pp', '727', '7', '2', '7', '97.27%', 'HDDTHRFLRX', '950x'],
    ['230pp', '891', '12', '4', '2', '97.63%', 'HD', '1000x'],
    ['180pp', '640', '23', '4', '2', '96.73%', 'HR', '1300x'],
]

const rows = Array.from({ length: 50 }, (_, i) => ({
    position: i + 1,
    name: names[i] ?? '',
    rank: rankIcons[i],
    score: scores[i],
}))

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

function MapCard() {
    const [selectedDiff, setSelectedDiff] = React.useState(6)

    return (
        <section className={style.mapCard} id="mapa">
            <div className={style.mapTitle}>
                <img src={`${A}/17c9d.png`} alt="" />
                <h1>Informações do mapa</h1>
            </div>
            <div className={style.mapHero}>
                <img className={style.mapCover} src={`${A}/9bef5.png`} alt="Arte do beatmap" />
                <div className={style.mapShade} />
                <div className={style.difficultyPicker} aria-label="Dificuldades">
                    {difficulties.map((item, index) => (
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
                <div className={style.difficultyName}>ismagius' {difficulties[selectedDiff].title}</div>
                <div className={style.difficultyValue}>Dificuldade {difficulties[selectedDiff].label}</div>
                <div className={style.ranked}>Ranqueado</div>
                <aside className={style.mapInfo}>
                    <button type="button" className={style.play} aria-label="Reproduzir prévia">
                        <img src={`${A}/1b679.png`} alt="" />
                    </button>
                    <div className={style.quickStats}>
                        <StatIcon type="time" value="2:11" />
                        <StatIcon type="bpm" value="180" />
                        <StatIcon type="circle" value="222" />
                        <StatIcon type="slider" value="222" />
                    </div>
                    <div className={style.detailStats}>
                        {[
                            ['Tamanho do círculo', 38, '5'],
                            ['Drenagem de HP', 46, '6'],
                            ['Precisão', 60, '8'],
                            ['Taxa de aproximação', 67, '9'],
                            ['Dificuldade', 47, difficulties[selectedDiff].label],
                        ].map(([label, barWidth, value]) => (
                            <div className={style.detailRow} key={String(label)}>
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
                            <i />
                        </div>
                        <small>10.8%</small>
                    </div>
                </aside>
                <div className={style.mapButtons}>
                    <button type="button" className={style.favorite} aria-label="Favoritar mapa">
                        <img src={`${A}/54c7a.png`} alt="" />
                    </button>
                    <button type="button">
                        <span>Download</span>
                        <img src={`${A}/16782.png`} alt="" />
                    </button>
                    <button type="button">
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
                {rows.map((row) => (
                    <article className={style.scoreRow} key={row.position}>
                        <span className={style.position}>#{row.position}</span>
                        <span className={style.player}>
                            {row.rank && <img src={`${A}/${row.rank}`} alt="" />}
                            <b>{row.name}</b>
                        </span>
                        {row.score &&
                            row.score.map((value, i) => (
                                <span
                                    className={`${style.score} ${style[`s${i}` as keyof typeof style]}`}
                                    key={`${row.position}-${i}`}
                                >
                                    {value}
                                </span>
                            ))}
                    </article>
                ))}
            </div>
        </section>
    )
}

const Beatmap: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.appShell}>
                <div className={style.pageShell}>
                    <MapCard />
                    <Leaderboard />
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Beatmap
