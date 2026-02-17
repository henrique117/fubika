import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

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

const GlobalRanking: React.FC = () => {
    const [players, setPlayers] = useState<RankedUser[]>([])
    const [activeMode, setActiveMode] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const modes = [
        { id: 0, label: 'Standard' },
        { id: 1, label: 'Taiko' },
        { id: 2, label: 'Catch' },
        { id: 3, label: 'Mania' }
    ]

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

                    <div className={style.modeSelector}>
                        {modes.map((mode) => (
                            <button 
                                key={mode.id}
                                className={`${style.modeBtn} ${activeMode === mode.id ? style.activeMode : ''}`}
                                onClick={() => {
                                    setActiveMode(mode.id);
                                    setPage(1);
                                }}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className={style.tableCard}>

                        <Link to='/'>
                            <button className={style.backButton}>
                                <img src="arrow_icon.svg" alt="Voltar" />
                            </button>
                        </Link>

                        <div className={style.titleContainer}>
                            <h2 className={style.title}>Colocações</h2>
                            
                            <div className={style.arrows}>
                                <img 
                                    src="arrow_pagination.svg" 
                                    alt="Anterior" 
                                    className={style.arrow} 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    style={{ cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                                />
                                <img 
                                    src="arrow_pagination.svg" 
                                    alt="Próximo" 
                                    className={style.arrow} 
                                    style={{ transform: 'rotate(180deg)', cursor: 'pointer' }} 
                                    onClick={() => setPage(p => p + 1)}
                                />
                            </div>  
                        </div>
                        
                        <div className={style.tableHeader}>
                            <span className={style.colRank}></span>
                            <span className={style.colPlayer}></span>
                            <span className={style.colPP} style={{ marginLeft: '57px' }}>Performance (Pontuação)</span>
                            <span className={style.colAcc}>Precisão</span>
                            <span className={style.colPlays} style={{ marginRight: '20px' }}>Jogadas Totais</span>
                        </div>

                        <div className={style.rowsContainer}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    Carregando ranking...
                                </div>
                            ) : players.length > 0 ? (
                                players.map((user) => (
                                    <div key={user.id} className={style.playerRow}>
                                        
                                        <div className={`${style.colRank} ${style.rankNumber}`}>
                                            #{user.rank}
                                        </div>

                                        <div className={style.colPlayer}>
                                            <div className={style.nameInfo}>
                                                <span className={style.username}>{user.name}</span>
                                            </div>
                                        </div>

                                        <div className={`${style.colPP} ${style.ppValue}`}>
                                            {Math.round(user.pp).toLocaleString()}pp
                                        </div>
                                        
                                        <div className={`${style.colAcc} ${style.statValue}`}>
                                            {(user.acc).toFixed(2)}%
                                        </div>
                                        
                                        <div className={`${style.colPlays} ${style.statValue}`}>
                                            {user.playcount.toLocaleString()}
                                        </div>

                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    Nenhum jogador encontrado neste modo.
                                </div>
                            )}
                        </div>

                        <div className={style.footerContainer}>
                            <div className={style.arrows}>
                                <img 
                                    src="arrow_pagination.svg" 
                                    alt="Anterior" 
                                    className={style.arrow} 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    style={{ cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                                />
                                <img 
                                    src="arrow_pagination.svg" 
                                    alt="Próximo" 
                                    className={style.arrow} 
                                    style={{ transform: 'rotate(180deg)', cursor: 'pointer' }} 
                                    onClick={() => setPage(p => p + 1)}
                                />
                                <img src="cat_head.png" alt="" className={style.cat} />
                            </div>  
                        </div>

                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default GlobalRanking