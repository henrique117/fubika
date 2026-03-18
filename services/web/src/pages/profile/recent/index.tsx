import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../services/api'

// Renomeei para IRecentPlay para fazer mais sentido semanticamente
interface IRecentPlay {
    id: number;
    pp: number;
    acc: number;
    max_combo: number;
    grade: string; 
    mods: string;  
    n300: number;
    n100: number;
    n50: number;
    nmiss: number;
    beatmap: {
        title: string;
        diff: string; 
        artist: string;
    }
}

const ProfileRecent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    // Agora o estado é um array de jogadas, iniciando vazio
    const [recentPlays, setRecentPlays] = useState<IRecentPlay[]>([]);
    const { id } = useParams<{ id: string }>();

    const getUser = async (userId: string) => {
        setLoading(true);
        try {
            // A API retorna o array direto no response.data
            const response = await api.get(`/user/${userId}/recent`, {
                params: {
                    mode: 0,
                    limit: 100
                }
            });
            setRecentPlays(response.data);
        } catch (error) {
            console.error("Erro ao buscar plays recentes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) getUser(id);
    }, [id]);

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.rankingContainer}>
                    <div className={style.tableCard}>
                        
                        <Link to={`/profile/${id}`}>
                            <button className={style.backButton}>
                                <img src="/arrow_icon.svg" alt="Voltar" />
                            </button>
                        </Link>

                        <h2 className={style.title}>Jogadas Recentes</h2>

                        <div className={`${style.tableHeader} ${style.gridStructure}`}>
                            <span></span>
                            <span></span>
                            <span className={style.statValue}>PP</span>
                            <span className={style.hitValue}>300</span>
                            <span className={style.hitValue}>100</span>
                            <span className={style.hitValue}>50</span>
                            <span className={style.hitValue}>X</span>
                            <span className={style.statValue}>Precisão</span>
                            <span className={style.statValue}>Mods</span>
                            <span className={style.statValue}>Combo máximo</span>
                        </div>

                        <div className={style.rowsContainer}>
                            {loading ? (
                                <div className={style.statusMsg}>Carregando...</div>
                            ) : recentPlays.length > 0 ? (
                                // Mapeamos direto do array de plays recentes
                                recentPlays.map((play) => (
                                    <div key={play.id} className={`${style.playerRow} ${style.gridStructure}`}>
                                        
                                        <div className={style.grade}>
                                            <span className={style['rank' + play.grade]}>
                                                {play.grade.replace('H', '')}
                                            </span>
                                        </div>

                                        <div className={style.mapInfo}>
                                            <span className={style.songTitle}>{play.beatmap.title}</span>
                                            <span className={style.versionName}>{play.beatmap.diff}</span>
                                        </div>

                                        <div className={style.ppValue}>
                                            {play.pp ? Math.round(play.pp) : 0}pp
                                        </div>

                                        <div className={style.hitValue}>{play.n300}</div>
                                        <div className={style.hitValue}>{play.n100}</div>
                                        <div className={style.hitValue}>{play.n50}</div>
                                        <div className={`${style.hitValue} ${play.nmiss > 0 ? style.hasMiss : ''}`}>
                                            {play.nmiss}
                                        </div>

                                        <div className={style.statValue}>{play.acc.toFixed(2)}%</div>

                                        <div className={style.statValue}>
                                            {play.mods !== "NM" ? play.mods : "-"}
                                        </div>

                                        <div className={style.statValue}>{play.max_combo}x</div>

                                    </div>
                                ))
                            ) : (
                                <div className={style.statusMsg}>Nenhuma jogada recente encontrada.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </WrapperComponent>
    );
}

export default ProfileRecent;