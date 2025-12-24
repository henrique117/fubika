import React, { useState } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

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

const Beatmap: React.FC = () => {
    const [beatmap, setBeatmap] = useState<BeatmapProps | null>(MOCK_MAP);
    const [activeTab, setActiveTab] = useState('leaderboard');

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