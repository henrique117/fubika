import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

//img stuff
import catHead from '/cat_head.png'
import follow from '/follow.svg'
import following from '/following.svg'
import mutal from '/mutual.svg'
import sino from '/sino.svg'

interface RankedUser {
    id: number
    name: string
    safe_name: string
    pfp: string
    banner: string
    rank: number
    pp: number
    acc: number
    playtime: number
    playcount: number
    max_combo: number
    total_score: number
    ranked_score: number
    level: number
    ss_count: number
    ssh_count: number
    s_count: number
    sh_count: number
    a_count: number
    country?: string
}

const Profile: React.FC = () => {
    const globalRank = 19;
    const stateRank = 1;

    const [players, setPlayers] = useState<RankedUser[]>([])
    const [activeMode, setActiveMode] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const fetchRanking = async (mode: number, pageNum: number) => {
        setLoading(true)
        try {
            const response = await api.get('/ranking/global', {
                params: {
                    mode: mode,
                    page: pageNum
                }
            });

            const data = response.data

            if (Array.isArray(data)) {
                setPlayers(data)
            }
        } catch (error) {
            console.error("Erro no ranking:", error)
        } finally {
            setLoading(false)
        }
    }



    const getRankClass = (rank: number) => {
        if (rank >= 50 && rank <= 100) return style.rankBronze;
        if (rank >= 20 && rank < 50) return style.rankPrata;
        if (rank >= 6 && rank < 20) return style.rankOuro;
        if (rank >= 1 && rank <= 5) return style.rankPlatina;
        return "";
    };


    useEffect(() => {
        fetchRanking(activeMode, page)
    }, [activeMode, page])


    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.rankingContainer}>
                    <div className={style.tableCard}>
                        <div className={style.profileHeader}>
                            <div className={style.profileImg}>
                                <img src="https://imgs.search.brave.com/7JB9XHpKg86H2Rjr4ojEQaU1AkLiR6Yt6dWfxw5i_zg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzcwLzFj/L2ZhLzcwMWNmYTQ4/MmE2NTEyNzI5M2Vm/ODgwNzhiOWY3ZWQ4/LmpwZw" alt="Avatar" style={{ width: '100%' }} />
                            </div>

                            <div className={style.profileHeaderInfo}>
                                <span className={style.profileNickname}>rogerio evas III</span>
                                <span className={style.profileLevel}>Nível - 100</span>
                                <div className={style.progressBarLevel}>
                                    <div className={style.rankArea}>
                                        <div>
                                            <span style={{ fontSize: '8px', color: '#FFFFFF' }}>Ranque Global</span><br />
                                            <span className={`${style.rankNumber} ${getRankClass(globalRank)}`}>#{globalRank}</span>
                                        </div>
                                        <div>
                                            <span style={{ paddingLeft: '5px',fontSize: '8px', color: '#FFFFFF' }}>Ranque Estadual</span><br />
                                            <span style={{ paddingLeft: '26px' }} className={`${style.rankNumber} ${getRankClass(stateRank)} `}>­­­­­­­­#{stateRank}</span>
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

                        <div className={style.profileGraph}></div>
                        <div className={style.profileInfos}>
                            <div className={style.profileMaps}>

                            </div>

                            <div className={style.rightColumn}>
                                <div className={style.profileStats}>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Pontuação ranqueada</span>
                                        <span>17,153,107,992</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Precisão de acerto</span>
                                        <span>98,40%</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Jogadas Totais</span>
                                        <span>18,688</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Pontuação total</span>
                                        <span>48,336,973,155</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Acertos totais</span>
                                        <span>6,386,777</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Acertos por jogada</span>
                                        <span>341</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Combo máximo</span>
                                        <span>2,709</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{ fontWeight: 'bold' }}>Replays assistidos</span>
                                        <span>132</span>

                                    </div>
                                    <div className={style.catImg}>
                                        <img src={catHead} style={{ height: '120px', width: '160px' }} />
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

