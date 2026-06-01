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
    country: string
}

const GlobalRanking: React.FC = () => {
    const [players, setPlayers] = useState<RankedUser[]>([])
    const [activeMode, setActiveMode] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const [selectedState, setSelectedState] = useState<string>('') // Define o estado inicial como vazio (Brasil Geral)
    // Lista de UFs
    const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]

    // Dicionário para traduzir a sigla para o nome completo
    const stateNames: Record<string, string> = {
        "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas",
        "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo",
        "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul",
        "MG": "Minas Gerais", "PA": "Pará", "PB": "Paraíba", "PR": "Paraná",
        "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
        "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina",
        "SP": "São Paulo", "SE": "Sergipe", "TO": "Tocantins",
        "BR": "Brasil",
        "xx": "Desconhecido"
    };

    const modes = [
        { id: 0, label: 'Standard' },
        { id: 1, label: 'Taiko' },
        { id: 2, label: 'Catch' },
        { id: 3, label: 'Mania' }
    ]

    const fetchRanking = async (mode: number, pageNum: number, countryCode: string) => {
        setLoading(true)
        try {
            const response = await api.get('/ranking/global', {
                params: {
                    mode: mode,
                    page: pageNum,
                    country: countryCode || undefined // Envia para a API
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
        // Comando que envia o estado selecionado para a API
        fetchRanking(activeMode, page, selectedState) 
    // Comando que coloca o selectedState na lista de dependências para recarregar a tabela quando a opção mudar
    }, [activeMode, page, selectedState])

    // Nova função que impede o jogador de continuar passando as páginas infinitamente caso o número de jogadores exibidos na pág seja menor que 50.
    const isLastPage = players.length < 50;

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
                            <select 
                                className={style.stateSelector}
                                value={selectedState}
                                onChange={(e) => {
                                    setSelectedState(e.target.value);
                                    setPage(1); // Volta para a página 1 ao trocar de estado
                                }}
                            >
                                <option value="">Brasil (Geral)</option>
                                {states.map(uf => (
                                    <option key={uf} value={uf}>{stateNames[uf]}</option>
                                ))}
                            </select>
                            
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
                                    style={{ 
                                        transform: 'rotate(180deg)', 
                                        cursor: isLastPage ? 'default' : 'pointer', 
                                        opacity: isLastPage ? 0.5 : 1 
                                    }} 
                                    onClick={() => {
                                        if (!isLastPage) setPage(p => p + 1)
                                    }}
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
                                                {/* Renderiza a bandeira. Se der erro (ex: não achar a imagem), usa a do BR de fallback */}
                                                <img 
                                                    src={`/flags/${user.country}.svg`} 
                                                    alt={stateNames[user.country] || user.country} 
                                                    title={stateNames[user.country] || user.country} /* <-- O BALÃOZINHO MÁGICO AQUI */
                                                    className={style.flagIcon}
                                                    onError={(e) => { e.currentTarget.src = '/flags/BR.svg' }} 
                                                />
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
                                    style={{ 
                                        transform: 'rotate(180deg)', 
                                        cursor: isLastPage ? 'default' : 'pointer', 
                                        opacity: isLastPage ? 0.5 : 1 
                                    }} 
                                    onClick={() => {
                                        if (!isLastPage) setPage(p => p + 1)
                                    }}
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