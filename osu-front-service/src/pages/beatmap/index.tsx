import React, { useState } from 'react'
import style from './style.module.css'
import { WrapperComponent, DiffIconComponent } from '../../components/components.export'
import SuccessRate from '../../components/ui/sucessrate';

interface BeatmapProps {
    beatmap_id: number;
    beatmapset_id: number;
    title: string;
    artist: string;
    creator: string;
    cover: string;
    diff: string;
    star_rating: number;
    bpm: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    max_combo: number;
    status: string;
    scores: any[];
}

const MOCK_SCORES = [
    {
        id: 1,
        rank: 1,
        score: 1000000,
        pp: 854,
        acc: 100.00,
        max_combo: 2385,
        mods: "HDHR",
        n300: 2385,
        n100: 0,
        n50: 0,
        nmiss: 0,
        grade: "SS",
        perfect: true,
        playcount: 520,
        player: {
            id: 3,
            name: "Cookiezi",
            pfp: "https://a.ppy.sh/124493",
            country: "KR"
        }
    },
    {
        id: 2,
        rank: 2,
        score: 985420,
        pp: 790,
        acc: 99.45,
        max_combo: 2385,
        mods: "NM",
        n300: 2370,
        n100: 15,
        n50: 0,
        nmiss: 0,
        grade: "S",
        perfect: true,
        playcount: 120,
        player: {
            id: 5,
            name: "Mrekk",
            pfp: "https://a.ppy.sh/7562902",
            country: "AU"
        }
    },
    {
        id: 3,
        rank: 3,
        score: 850000,
        pp: 720,
        acc: 98.10,
        max_combo: 2100,
        mods: "HR",
        n300: 2300,
        n100: 80,
        n50: 5,
        nmiss: 1,
        grade: "A",
        perfect: false,
        playcount: 85,
        player: {
            id: 4,
            name: "WhiteCat",
            pfp: "https://a.ppy.sh/4504101",
            country: "DE"
        }
    },
    {
        id: 4,
        rank: 4,
        score: 600000,
        pp: 500,
        acc: 95.50,
        max_combo: 1500,
        mods: "DT",
        n300: 2200,
        n100: 150,
        n50: 35,
        nmiss: 10,
        grade: "B",
        perfect: false,
        playcount: 300,
        player: {
            id: 6,
            name: "Vaxei",
            pfp: "https://a.ppy.sh/4787150",
            country: "US"
        }
    },
    {
        id: 5,
        rank: 5,
        score: 450000,
        pp: 350,
        acc: 92.00,
        max_combo: 800,
        mods: "HD",
        n300: 2100,
        n100: 200,
        n50: 85,
        nmiss: 25,
        grade: "C",
        perfect: false,
        playcount: 50,
        player: {
            id: 7,
            name: "Badeu",
            pfp: "https://a.ppy.sh/1473890",
            country: "RO"
        }
    }
];

const MOCK_MAP: BeatmapProps = {
    beatmap_id: 100,
    beatmapset_id: 50,
    title: "Freedom Dive",
    artist: "xi",
    creator: "Nakagawa-Kanon",
    cover: "https://assets.ppy.sh/beatmaps/39804/covers/cover@2x.jpg",
    diff: "FOUR DIMENSIONS",
    star_rating: 7.82,
    bpm: 222.22,
    ar: 9,
    cs: 4,
    od: 8,
    hp: 6,
    max_combo: 2385,
    status: "ranked",
    scores: MOCK_SCORES
};

const diffColors = [
    "#4FC1A6", // Teal
    "#88D949", // Verde
    "#E6CE4B", // Amarelo
    "#E67E4B", // Laranja
    "#E64B86", // Rosa
    "#B54BE6", // Roxo Claro
    "#824BE6"  // Roxo Escuro
];

const Beatmap: React.FC = () => {
    const [beatmap, setBeatmap] = useState<BeatmapProps | null>(MOCK_MAP);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [selectedDiff, setSelectedDiff] = useState(0);

    if (!beatmap) return <div>Carregando...</div>;

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.card}>
                    <div className={style.cardHeader}>
                        <img src="cat_head.png" alt="" className={style.headerImg} />
                        <h2 className={style.headerTitle}>Informações do mapa</h2>
                    </div>
                    <div className={style.cardBody} style={{ backgroundImage: `url(${beatmap.cover})` }} >
                        <div className={style.collection}>
                            <div className={style.mapdiffs}>
                                {diffColors.map((color, index) => (
                                    <DiffIconComponent
                                        key={index}
                                        color={color}
                                        isSelected={selectedDiff === index}
                                        onClick={() => setSelectedDiff(index)}
                                    />
                                ))}
                            </div>
                            <div className={style.diffSR}>
                                <h2>{beatmap.diff}</h2>
                                <span>Dificuldade {beatmap.star_rating}</span>
                            </div>
                        </div>
                        <div className={style.mapStats}>
                            <div className={style.mapStatus}>
                                <h2>{beatmap.status}</h2>
                            </div>
                            <div className={style.mapPreview}>
                                <svg
                                    width="23"
                                    height="23"
                                    viewBox="0 0 23 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5 3L19 12L5 21V3Z"
                                        fill="white"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div className={style.mapNumbers}>
                                <div>
                                    <img src="clock.svg" alt="" />
                                    <span>2:11</span>
                                </div>
                                <div>
                                    <img src="note.svg" alt="" />
                                    <span>180</span>
                                </div>
                                <div>
                                    <img src="sliders.svg" alt="" />
                                    <span>222</span>
                                </div>
                                <div>
                                    <img src="circles.svg" alt="" />
                                    <span>222</span>
                                </div>
                            </div>
                            <div className={style.mapGraphs}>
                                {[
                                    { label: "Tamanho do círculo", value: 5.0 },
                                    { label: "Drenagem de HP", value: 6.0 },
                                    { label: "Precisão", value: 8.0 },
                                    { label: "Taxa de aproximação", value: 9.0 },
                                    { label: "Dificuldade", value: 6.1 }
                                ].map((stat, index) => (
                                    <div key={index} className={style.statRow}>
                                        <span className={style.statLabel}>{stat.label}</span>

                                        <div className={style.progressBarBase}>
                                            <div
                                                className={style.progressBarFill}
                                                style={{ width: `${(stat.value / 10) * 100}%` }}
                                            />
                                        </div>

                                        <span className={style.statValue}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={style.mapSucess}>
                                <SuccessRate rate={10.8} />
                            </div>
                        </div>
                        <div className={style.buttons}>
                            <button className={`${style.btn} ${style.btnSquare}`}>
                                <svg
                                    width="36"
                                    height="36"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12.1 18.55L12 18.65L11.89 18.55C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5C9.04 5 10.54 6 11.07 7.36H12.93C13.46 6 14.96 5 16.5 5C18.5 5 20 6.5 20 8.5C20 11.39 16.86 14.24 12.1 18.55Z"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            <button className={`${style.btn} ${style.btnWide}`}>
                                <span className={style.btnText}>Download</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>

                            <button className={`${style.btn} ${style.btnWide}`}>
                                <span className={style.btnText}>Osu!Direct</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className={style.cardFooter} />
                    <div className={style.cardLB}>
                        <div className={style.lbHeader}>
                            <div className={style.lbTitle}>
                                <h2>Leaderboard do mapa</h2>
                            </div>
                            <img src="cat_open_eye.png" alt="" className={style.catBody} />
                            <img src="cat_head.png" alt="" className={style.catHead} />
                        </div>
                        <div className={style.lbBody}>
                            {activeTab === 'leaderboard' && (
                                <div className={style.leaderboardContainer}>
                                    <div className={style.tableHeader}>
                                        <div className={style.colRank}></div>
                                        <div className={style.colPlayer}></div>
                                        <div className={style.colPP}>PP</div>
                                        <div className={style.col300}>300</div>
                                        <div className={style.col100}>100</div>
                                        <div className={style.col50}>50</div>
                                        <div className={style.colX}>X</div>
                                        <div className={style.colAcc}>Precisão</div>
                                        <div className={style.colMods}>Mods</div>
                                        <div className={style.colMaxCombo}>Combo máximo</div>
                                    </div>

                                    <div className={style.rowsContainer}>
                                        {beatmap.scores && beatmap.scores.length > 0 ? (
                                            beatmap.scores.map((score) => (
                                                <div key={score.id} className={style.playerRow}>
                                                    <div className={`${style.colRank}`}>
                                                        <img src={`${score.grade.toLowerCase()}.svg`} alt="" className={style.grade} />
                                                    </div>

                                                    <div className={style.colPlayer}>
                                                        <div className={style.nameInfo}>
                                                            <span className={style.username}>{score.player.name}</span>
                                                        </div>
                                                    </div>

                                                    <div className={`${style.colPP} ${style.ppValue}`}>
                                                        {Math.round(score.pp).toLocaleString()}<span>pp</span>
                                                    </div>

                                                    <div className={`${style.col300} ${style.statValue} ${style.c300}`}>{score.n300}</div>
                                                    <div className={`${style.col100} ${style.statValue} ${style.c100}`}>{score.n100}</div>
                                                    <div className={`${style.col50} ${style.statValue} ${style.c50}`}>{score.n50}</div>
                                                    <div className={`${style.colX} ${style.statValue} ${style.cMiss}`}>{score.nmiss}</div>

                                                    <div className={`${style.colAcc} ${style.statValue}`}>
                                                        {(score.acc).toFixed(2)}%
                                                    </div>

                                                    <div className={`${style.colMods} ${style.statValue} ${style.modsText}`}>
                                                        {score.mods || "NM"}
                                                    </div>

                                                    <div className={`${style.colMaxCombo} ${style.statValue} ${score.perfect ? style.perfectCombo : ''}`}>
                                                        {score.max_combo}x
                                                    </div>

                                                </div>
                                            ))
                                        ) : (
                                            <div className={style.emptyState}>
                                                Nenhum score registrado ainda. Seja o primeiro!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Beatmap