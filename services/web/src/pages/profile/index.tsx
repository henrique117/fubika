import React, { useState, useEffect, useMemo } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'


import catHead from '/cat_head.png'
import follow from '/follow.svg'
import sino from '/sino.svg'

interface ITopPlay {
    pp: number;
    acc: number;
    max_combo: number;
    beatmap: {
        title: string;
        artist: string;
        cover: string;
    };
}

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
    top_200: ITopPlay[];
    ranked_score: number;
    total_score: number;
}

const Profile: React.FC = () => {
    const [player, setPlayer] = useState<IPlayer | null>(null);
    const top200 = player?.top_200;
    const top10Maps = useMemo(() => {
        if (!top200) return [];
        return [...top200].sort((a, b) => b.pp - a.pp).slice(0, 10);
    }, [top200]);

    const id = useParams<{ id: string }>();
    const userId = Number(id.id)

    const getUser = async (id: number) => {
        try {
            const response = await api.get(`/user/${id}`,);
            setPlayer(response.data);

        } catch (error) {
            console.error("Erro no usuario:", error)
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
    const getRankClass = (rank: number) => {
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
                                            <span className={`${style.rankNumber} ${getRankClass(globalRank ?? 0)}`}>#{globalRank}</span>
                                        </div>
                                        <div>
                                            <span style={{ paddingLeft: '5px', fontSize: '8px', color: '#FFFFFF' }}>Ranque Estadual</span><br />
                                            {/* <span style={{ paddingLeft: '26px' }} className={`${style.rankNumber} ${getRankClass(stateRank)} `}>­­­­­­­­#{stateRank}</span> */}
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
                        </div>

                        <div className={style.profileInfos}>
                            <div className={style.profileMaps}>
                                {top10Maps.map((e, idx) => (
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
                                        <span>{(player?.top_200 || []).reduce((n, p) => n + (p.max_combo || 0), 0).toLocaleString('pt-BR')}</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Acertos por jogada</span>
                                        {player?.top_200 && player.top_200.length > 0
                                            ? (player.top_200.reduce((n, p) => n + (p.max_combo || 0), 0) / player.top_200.length).toFixed(2)
                                            : "0.00"}

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Combo máximo</span>
                                        <span>{player?.max_combo}</span>

                                    </div>
                                    <div className={style.catImg}>
                                        <img src={catHead} alt="" />
                                    </div>
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

