import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'

//img stuff
import catHead from '/cat_head.png'
import follow from '/follow.svg'
import following from '/following.svg'
import mutal from '/mutual.svg'
import sino from '/sino.svg'

export interface IPlayer {
    id: number;
    name: string;
    pfp: string;
    banner: string;
    pp: number;
    rank: number;
    acc: number;
    level: number;
    playcount: number;
    playtime: number;
    max_combo: number;
    last_activity: string;
    ss_count: number;
    ssh_count: number;
    s_count: number;
    sh_count: number;
    a_count: number;
    top_200: any[];
    ranked_score: number;
    total_score: number;
}

const defaultMockPlayer: IPlayer = {
    id: 1,
    name: "Arlecchino",
    pfp: "/arlecchino_pfp.svg",
    banner: "",
    pp: 1000,
    rank: 1000,
    acc: 98.40,
    level: 100,
    playcount: 18688,
    playtime: 0,
    max_combo: 2709,
    last_activity: "",
    ss_count: 0,
    ssh_count: 0,
    s_count: 0,
    sh_count: 0,
    a_count: 0,
    ranked_score: 17153107992,
    total_score: 48336973155,
    top_200: [
        { pp: 350, acc: 98.4, max_combo: 2709, beatmap: { artist: "Hanasaka Yui (CV: M.A.O)", title: "Harumachi Clover", cover: "/maps/Harumachi Clover.png" } },
        { pp: 320, acc: 99.1, max_combo: 1800, beatmap: { artist: "Fortiche Productions", title: "Get jinxed", cover: "/maps/Get jinxed.png" } },
        { pp: 310, acc: 97.8, max_combo: 1650, beatmap: { artist: "Aoi Yuuki", title: "Los! Los! Los!", cover: "/maps/Los! Los! Los!.png" } },
        { pp: 295, acc: 98.9, max_combo: 1420, beatmap: { artist: "Yuuka Nanri", title: "Trust me", cover: "/maps/Trust me.png" } },
        { pp: 280, acc: 96.5, max_combo: 1200, beatmap: { artist: "Yu_Asahina", title: "Sad Spring", cover: "/maps/Sad Spring.png" } },
        { pp: 270, acc: 99.0, max_combo: 1100, beatmap: { artist: "COOL&CREATE", title: "Night of Knights", cover: "/maps/Night of Knights.png" } },
        { pp: 260, acc: 97.2, max_combo: 980, beatmap: { artist: "Bury Tomorrow", title: "Lionheart", cover: "/maps/Lionheart.png" } },
        { pp: 250, acc: 98.0, max_combo: 900, beatmap: { artist: "Chayanne", title: "Torero", cover: "/maps/Torero.png" } },
        { pp: 240, acc: 95.8, max_combo: 850, beatmap: { artist: "DragonForce", title: "Through the fire and flames", cover: "/maps/Through the fire and flames.png" } },
        { pp: 230, acc: 98.2, max_combo: 800, beatmap: { artist: "Kurokotei", title: "ai wa binchoutan", cover: "/maps/ai wa binchoutan 1.png" } }
    ]
};

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [player, setPlayer] = useState<IPlayer | null>(null);
    const activePlayer = player || defaultMockPlayer;

    const top10Maps = activePlayer?.top_200?.reduce((acc: any[], curr: any) => {
        acc.push(curr);
        return acc.sort((a, b) => b.pp - a.pp).slice(0, 10);
    }, []) || [];

    const id = useParams<{ id: string }>();
    const userId = Number(id.id)
    console.log("🚀 ~ Profile ~ userId:", userId)

    const getUser = async (id: number) => {
        setLoading(true)
        try {
            const response = await api.get(`/user/${id}`,);
            setPlayer(response.data);

        } catch (error) {
            console.error("Erro no usuario:", error)
        } finally {
            setLoading(false)

        }
    }


    useEffect(() => {
        const fetchData = async () => {
            if (userId) {
                await getUser(Number(userId));
                // console.log("Usuário carregado!");
            }
        };

        fetchData();
    }, [userId]);

    const globalRank = activePlayer?.rank
    const getRankClass = (rank: any) => {
        if (rank >= 50 && rank <= 100) return style.rankBronze;
        if (rank >= 20 && rank < 50) return style.rankPrata;
        if (rank >= 6 && rank < 20) return style.rankOuro;
        if (rank >= 1 && rank <= 5) return style.rankPlatina;
        return "";
    };


    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.rankingContainer}>
                    <div className={style.tableCard}>
                        <div className={style.profileHeader}>
                            <div className={style.profileHeaderOverlay} />
                            <div className={style.profileImg}>
                                <img 
                                    src={activePlayer?.pfp || "/arlecchino_pfp.svg"} 
                                    alt="Avatar" 
                                />
                            </div>

                            <div className={style.profileHeaderInfo}>
                                <span className={style.profileNickname}>{activePlayer?.name}</span>
                                <span className={style.profileLevel}>Nível - {Math.round(activePlayer?.level ?? 0)}</span>
                                <div className={style.progressBarLevel}></div>
                                
                                <div className={style.rankArea}>
                                    <div className={style.rankItem}>
                                        <span className={style.rankTitle}>Ranque Global</span>
                                        <span className={`${style.rankNumber} ${style.rankGlobalGradient}`}># {globalRank}</span>
                                    </div>
                                    <div className={style.rankItem}>
                                        <span className={style.rankTitle}>Ranque Estadual</span>
                                        <span className={`${style.rankNumber} ${style.rankEstadualGradient}`}>#25</span>
                                    </div>
                                </div>
                                
                                <div className={style.profileButtons}>
                                    <button className={style.friendBtn}>
                                        <img src="/mutual.svg" alt="Mutual" style={{ width: '13px', height: '12px' }} />
                                    </button>
                                    <button className={style.notificationBtn}>
                                        <img src="/sino.svg" alt="Notification" style={{ width: '11px', height: '12px' }} />
                                    </button>
                                </div>
                            </div>

                            <div className={style.profileGraph}>
                                <img src="/linha-grafico.svg" alt="Gráfico de Histórico" className={style.graphSvg} />
                            </div>
                        </div>
                        <div className={style.profileInfos}>
                            <div className={style.profileMaps}>
                                {top10Maps.map((e: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={style.mapsPill}
                                        style={{
                                            backgroundImage: `url("${encodeURI(e.beatmap.cover)}")`
                                        }}
                                    >
                                        <div className={style.mapInfoOverlay}>
                                            <span className={style.mapName}>
                                                {e.beatmap.title} - {e.beatmap.artist}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={style.rightColumn}>
                                <div className={style.profileStats}>
                                    <div className={style.statRow}>
                                        <span>Pontuação ranqueada</span>
                                        <span>{activePlayer?.ranked_score?.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Precisão de acerto</span>
                                        <span>{activePlayer?.acc?.toFixed(2)}%</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Jogadas totais</span>
                                        <span>{activePlayer?.playcount?.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Pontuação total</span>
                                        <span>{activePlayer?.total_score?.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Acertos totais</span>
                                        <span>{(6386777).toLocaleString('en-US')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Acertos por jogada</span>
                                        <span>341</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Combo máximo</span>
                                        <span>{activePlayer?.max_combo?.toLocaleString('en-US')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span>Replays assistidos</span>
                                        <span>132</span>
                                    </div>
                                    <div className={style.catImg}>
                                        <img src={catHead} alt="Cat" />
                                    </div>
                                </div>
                                <div className="profileTop">

                                </div>
                                <div className="profileTop">

                                </div>

                            </div>

                        </div>



                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Profile;

