import React, { useState, useEffect } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../../components/components.export'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../services/api'

interface ITopPlay {
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

export interface IPlayer {
    id: number;
    name: string;
    top_200: ITopPlay[];
}

const ProfileTopPlays: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [player, setPlayer] = useState<IPlayer | null>(null);
    const { id } = useParams<{ id: string }>();

    const top10Maps = player?.top_200
        ? [...player.top_200].sort((a, b) => b.pp - a.pp)
        : [];

    const getUser = async (userId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/user/${userId}`);
            setPlayer(response.data);
        } catch (error) {
            console.error("Erro ao buscar top plays:", error);
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

                    <h2 className={style.title}>Melhores Jogadas</h2>

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
                        ) : top10Maps.map((play) => (
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

                                <div className={style.ppValue}>{Math.round(play.pp)}pp</div>

                                <div className={style.hitValue}>{play.n300}</div>
                                <div className={style.hitValue}>{play.n100}</div>
                                <div className={style.hitValue}>{play.n50}</div>
                                <div className={`${style.hitValue} ${play.nmiss > 0 }`}>
                                    {play.nmiss}
                                </div>

                                <div className={style.statValue}>{play.acc.toFixed(2)}%</div>

                                <div className={style.statValue}>
                                    {play.mods !== "NM" ? play.mods : "-"}
                                </div>

                                <div className={style.statValue}>{play.max_combo}x</div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </WrapperComponent>
);
}

export default ProfileTopPlays;