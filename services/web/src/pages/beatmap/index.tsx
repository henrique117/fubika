import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { useParams, useNavigate } from 'react-router-dom';
import { WrapperComponent, DiffIconComponent } from '../../components/components.export'
import SuccessRate from '../../components/ui/sucessrate';
import { api } from '../../services/api';

//img stuff
import clock from '/clock.svg'
import note from '/note.svg'
import sliders from '/sliders.svg'
import circles from '/circles.svg'
import catOpenEye from '/cat_open_eye.png'
import catHead from '/cat_head.png'

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
    playcount: number;
    passcount: number;
    total_length: number;
    count_sliders: number;
    count_circles: number;
}

interface BeatmapSetProps {
    beatmapset_id: number;
    title: string;
    artist: string;
    beatmaps: BeatmapProps[];
}

const getDifficultyColor = (sr: number): string => {
    if (sr < 2.0) return "#4FC1A6";
    if (sr < 2.7) return "#88D949";
    if (sr < 4.0) return "#E6CE4B";
    if (sr < 5.3) return "#E67E4B";
    if (sr < 6.5) return "#E64B86";
    if (sr < 8.0) return "#B54BE6";
    return "#121212";
};

const Beatmap: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentBeatmap, setCurrentBeatmap] = useState<BeatmapProps | null>(null);
    const [beatmapSet, setBeatmapSet] = useState<BeatmapSetProps | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                if (!currentBeatmap) {
                    setIsInitialLoading(true);
                }

                const mapRes = await api.get(`/beatmap/${id}`);
                const mapData = mapRes.data;

                setCurrentBeatmap(mapData);

                if (!beatmapSet || beatmapSet.beatmapset_id !== mapData.beatmapset_id) {
                    const setRes = await api.get(`/beatmap/c/${mapData.beatmapset_id}`);
                    setBeatmapSet(setRes.data);
                }

            } catch (error) {
                console.error("Erro ao carregar dados do osu!:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        if (id) loadAllData();
    }, [id]);

    if (isInitialLoading && !currentBeatmap) {
        return <WrapperComponent><div>Carregando informações...</div></WrapperComponent>;
    }

    if (!currentBeatmap) return null;

    const durationMinutes = Math.floor(currentBeatmap.total_length / 60);
    const durationSeconds = (currentBeatmap.total_length % 60).toString().padStart(2, '0');

    const SuccessRateValue = currentBeatmap.playcount > 0 ? (currentBeatmap.passcount / currentBeatmap.playcount) * 100 : 0;

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.card}>
                    <div className={style.cardHeader}>
                        <img src={catHead} alt="" className={style.headerImg} />
                        <h2 className={style.headerTitle}>Informações do mapa</h2>
                    </div>
                    <div className={style.cardBody} style={{ backgroundImage: `url(${currentBeatmap.cover})` }} >
                        <div className={style.collection}>
                            <div className={style.mapdiffs}>
                                {beatmapSet?.beatmaps
                                    .slice().sort((a, b) => a.star_rating - b.star_rating).map((e) => (
                                        <DiffIconComponent
                                            key={e.beatmap_id}
                                            color={getDifficultyColor(e.star_rating)}
                                            isSelected={e.beatmap_id === currentBeatmap?.beatmap_id}
                                            onClick={() => navigate(`/beatmap/${e.beatmap_id}`)}
                                        />
                                    ))
                                }
                            </div>
                            <div className={style.diffSR}>
                                <h2>{currentBeatmap.diff}</h2>
                                <span>Dificuldade {currentBeatmap.star_rating.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className={style.mapHeaderInfo}>
                            <h1 className={style.mapTitle}>{currentBeatmap.title}</h1>
                            <h2 className={style.mapArtist}>{currentBeatmap.artist}</h2>
                        </div>
                        <div className={style.mapStats}>
                            <div className={style.mapStatus}>
                                <h2>{currentBeatmap.status === 'ranked' || currentBeatmap.status === 'loved' ? 'Ranqueado' : 'Cemitério'}</h2>
                            </div>
                            <div className={style.mapPreview}>
                                <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 3L19 12L5 21V3Z" fill="white" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className={style.mapNumbers}>
                                <div className={style.tooltipContainer}>
                                    <img src={clock} alt="" />
                                    <span>{durationMinutes}:{durationSeconds}</span>
                                    <span className={style.tooltipText}>Duração</span>
                                </div>
                                <div className={style.tooltipContainer}>
                                    <img src={note} alt="" />
                                    <span>{currentBeatmap.bpm}</span>
                                    <span className={style.tooltipText}>BPM</span>
                                </div>
                                <div className={style.tooltipContainer}>
                                    <img src={sliders} alt="" />
                                    <span>{currentBeatmap.count_sliders || '0'}</span>
                                    <span className={style.tooltipText}>Sliders</span>
                                </div>
                                <div className={style.tooltipContainer}>
                                    <img src={circles} alt="" />
                                    <span>{currentBeatmap.count_circles || '0'}</span>
                                    <span className={style.tooltipText}>Notas</span>
                                </div>
                            </div>

                            <div className={style.mapGraphs}>
                                {[
                                    { label: "Tamanho do círculo", value: currentBeatmap.cs },
                                    { label: "Drenagem de HP", value: currentBeatmap.hp },
                                    { label: "Precisão", value: currentBeatmap.od },
                                    { label: "Taxa de aproximação", value: currentBeatmap.ar },
                                    { label: "Dificuldade", value: currentBeatmap.star_rating.toFixed(1) }
                                ].map((stat, index) => (
                                    <div key={index} className={style.statRow}>
                                        <span className={style.statLabel}>{stat.label}</span>
                                        <div className={style.progressBarBase}>
                                            <div
                                                className={style.progressBarFill}
                                                style={{ width: `${(Number(stat.value) / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className={style.statValue}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={style.mapSucess}>
                                <SuccessRate rate={SuccessRateValue} />
                            </div>
                        </div>
                        <div className={style.buttons}>
                            <button className={`${style.btn} ${style.btnSquare}`}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.1 18.55L12 18.65L11.89 18.55C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5C9.04 5 10.54 6 11.07 7.36H12.93C13.46 6 14.96 5 16.5 5C18.5 5 20 6.5 20 8.5C20 11.39 16.86 14.24 12.1 18.55Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button 
                                className={`${style.btn} ${style.btnWide}`}
                                onClick={() => {
                                    window.location.href = `https://catboy.best/d/${currentBeatmap.beatmapset_id}`
                                }}
                            >
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
                            <img src={catOpenEye} alt="" className={style.catBody} />
                            <img src={catHead} alt="" className={style.catHead} />
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
                                        {currentBeatmap.scores && currentBeatmap.scores.length > 0 ? (
                                            currentBeatmap.scores.map((score) => (
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