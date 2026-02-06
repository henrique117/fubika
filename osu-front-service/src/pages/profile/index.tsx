import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

//img stuff
import catHead from '/cat_head.png'

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

const globalRank = 25;
const stateRank = 1;

const Profile: React.FC = () => {
    const [players, setPlayers] = useState<RankedUser[]>([])
    const [activeMode, setActiveMode] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const getRankClass = (rank: number) => {
        if (rank >= 50 && rank <= 100) return style.rankBronze;
        if (rank >= 20 && rank < 50) return style.rankPrata;
        if (rank >= 6 && rank < 20) return style.rankOuro;
        if (rank >= 1 && rank <= 5) return style.rankPlatina;
        return ""; 
    };

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

                            </div>
                            <div className={style.profileHeaderInfo}>
                                <span className={style.profileNickname}>Arlecchino</span><br></br>
                                <span className={style.profileLevel} style={{paddingLeft: '30px'}}>Nivel - </span><span>100</span>
                                <div className={style.levelProgressBar}>

                                </div>
                                <div className={style.rank}>
                                    <div>
                                        <span>Rank Global</span><br></br>
                                        <span className={getRankClass(globalRank)} style={{paddingLeft: '30%', fontSize:'15px'}}>#</span><span className={getRankClass(globalRank)} style={{fontSize:'15px'}}>25</span>
                                    </div>
                                    <div >
                                        <span>Rank Estadual</span><br></br>
                                        <span className={getRankClass(stateRank)} style={{paddingLeft: '30%', fontSize:'15px'}}>#</span><span className={getRankClass(stateRank)} style={{fontSize:'15px'}}>1</span>
                                    </div>
                                </div>
                                <div className={style.profileBtn}>

                                </div>
                            </div>
                        </div>
                        <div className={style.profileInfos}>
                            <div className={style.profileMaps}>

                            </div>

                            <div className={style.rightColumn}>
                                <div className={style.profileStats}>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Pontuação ranqueada</span>
                                        <span>17,153,107,992</span>
                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Precisão de acerto</span>
                                        <span>98,40%</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Jogadas Totais</span>
                                        <span>18,688</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Pontuação total</span>
                                        <span>48,336,973,155</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Acertos totais</span>
                                        <span>6,386,777</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Acertos por jogada</span>
                                        <span>341</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Combo máximo</span>
                                        <span>2,709</span>

                                    </div>
                                    <div className={style.statRow}>
                                        <span style={{fontWeight: 'bold'}}>Replays assistidos</span>
                                        <span>132</span>

                                    </div>
                                    <div className={style.catImg}>
                                        <img src={catHead} style={{height: '120px', width: '160px' }} />
                                    </div>
                                </div>
                                <div className={style.profileTop} style={{ marginTop: '20px'}}>
                                    <button className={style.profileTopBtn}>Melhores Jogadas</button>
                                </div>
                                <div className={style.profileTop} style={{ marginTop: '10px'}}>
                                    <button className={style.profileTopBtn}>Jogadas Recentes</button>
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