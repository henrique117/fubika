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

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [player, setPlayer] = useState<IPlayer | null>(null);
    const top10Maps = player?.top_200.reduce((acc: any[], curr: any) => {
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

    const globalRank = player?.rank
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
                            <div className={style.profileImg}>
                                <img src={player?.pfp} alt="Avatar" style={{ width: '100%' }} />
                            </div>

                            <div className={style.profileHeaderInfo}>
                                <span className={style.profileNickname}>{player?.name}</span>
                                <span className={style.profileLevel}>Nível - {Math.round(player?.level ?? 0)}</span>
                                <div className={style.progressBarLevel}>
                                    <div className={style.rankArea}>
                                        <div>
                                            <span style={{ fontSize: '8px', color: '#FFFFFF' }}>Ranque Global</span><br />
                                            <span className={`${style.rankNumber} ${getRankClass(globalRank)}`}>#{globalRank}</span>
                                        </div>
                                        <div>
                                            <span style={{ paddingLeft: '5px', fontSize: '8px', color: '#FFFFFF' }}>Ranque Estadual</span><br />
                                        </div>
                                    </div>
                                    <div className={style.profileButtons}>
                                        <button className={style.friendBtn}>
                                            <img src={follow} alt="" />
                                        </button>
                                        <button className={style.notificationBtn}>
                                            <img src={sino} alt="" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={style.chartContainer}>
                            </div>
                        </div>

                        <div className={style.profileGraph}></div>
                        <div className={style.profileInfos}>
                            <div className={style.profileMaps}>
                                {top10Maps.map((e: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={style.mapsPill}
                                        style={{
                                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${e.beatmap.cover})`
                                        }}
                                    >
                                        <div className={style.mapInfo}>
                                            <span className={style.mapName}>
                                                {e.beatmap.artist} - {e.beatmap.title}
                                            </span>
                                            <span className={style.mapPP}>
                                                {Math.round(e.pp)}
                                            </span>
                                            <span className={style.mapAcc}>{e.acc.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                ))}

                                {player?.top_200 && player.top_200.length > 0 && (
                                    <Link to={`top-plays`} className={style.viewMoreBtn}>
                                        View Full Top 200
                                    </Link>
                                )}
                            </div>

                            <div className={style.rightColumn}>
                                <div className={style.profileStats}>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>PP</span>
                                        <span>{player?.pp.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Pontuação ranqueada</span>
                                        <span>{(player?.ranked_score.toLocaleString('pt-BR'))}</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Precisão de acerto</span>
                                        <span>{(player?.acc.toFixed(2))}%</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Jogadas Totais</span>
                                        <span>{(player?.playcount.toLocaleString().replace('.', ','))}</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Pontuação total</span>
                                        <span>{player?.total_score.toLocaleString('pt-BR')}</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Acertos totais</span>
                                        <span>{(player?.top_200 || []).reduce((n, p) => n + (p.max_combo), 0 || 0).toLocaleString('pt-BR')}</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Acertos por jogada</span>
                                        {player?.top_200 && player.top_200.length > 0
                                            ? (player.top_200.reduce((n, p: any) => n + (p.max_combo || 0), 0) / player.top_200.length).toFixed(2)
                                            : "0.00"}

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Combo máximo</span>
                                        <span>{player?.max_combo}</span>

                                    </div>
                                    <div className={style.catImg}>
                                        <img src={catHead} style={{ height: '120px', width: '160px' }} />
                                    </div>
                                </div>
                                                                {player?.top_200 && player.top_200.length > 0 && (
                                    <Link to={`recent`} className={style.viewMoreBtn}>
                                        View Recent Plays
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Profile;

