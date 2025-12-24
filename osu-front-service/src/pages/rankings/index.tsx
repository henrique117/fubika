import React, { useState } from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom';

interface RankedUser {
    id: number;
    rank: number;
    username: string;
    avatarUrl: string;
    accuracy: number;
    playcount: number;
    pp: number;
    country: string;
}

const MOCK_USERS: RankedUser[] = [
    { id: 3, rank: 1, username: "Cookiezi", country: "KR", accuracy: 99.54, playcount: 5200, pp: 13400, avatarUrl: "https://a.ppy.sh/124493" },
    { id: 5, rank: 2, username: "Mrekk", country: "AU", accuracy: 98.20, playcount: 15400, pp: 12900, avatarUrl: "https://a.ppy.sh/7562902" },
    { id: 4, rank: 3, username: "WhiteCat", country: "DE", accuracy: 99.10, playcount: 8900, pp: 11500, avatarUrl: "https://a.ppy.sh/4504101" },
    { id: 6, rank: 4, username: "Vaxei", country: "US", accuracy: 99.30, playcount: 6000, pp: 10800, avatarUrl: "https://a.ppy.sh/4787150" },
    { id: 7, rank: 5, username: "Badeu", country: "RO", accuracy: 97.50, playcount: 4000, pp: 9500, avatarUrl: "https://a.ppy.sh/1473890" },
    { id: 8, rank: 6, username: "Rafis", country: "PL", accuracy: 99.00, playcount: 12000, pp: 9200, avatarUrl: "https://a.ppy.sh/2558286" },
];

const GlobalRanking: React.FC = () => {
    const [activeMode, setActiveMode] = useState(0);

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.rankingContainer}>

                    <div className={style.modeSelector}>
                        {['Standard', 'Taiko', 'Catch', 'Mania'].map((mode, index) => (
                            <button 
                                key={mode}
                                className={`${style.modeBtn} ${activeMode === index ? style.activeMode : ''}`}
                                disabled={true}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className={style.tableCard}>

                        <Link to='/'>
                            <button className={style.backButton}>
                                <img src="arrow_icon.svg" alt="" />
                            </button>
                        </Link>

                        <div className={style.titleContainer}>
                            <h2 className={style.title}>Colocações</h2>
                            <div className={style.arrows}>
                                <img src="arrow_pagination.svg" alt="" className={style.arrow} />
                                <img src="arrow_pagination.svg" alt="" className={style.arrow} style={{ transform: 'rotate(180deg)' }} />
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
                            {MOCK_USERS.map((user) => (
                                <div key={user.id} className={style.playerRow}>
                                    
                                    <div className={`${style.colRank} ${style.rankNumber}`}>
                                        #{user.rank}
                                    </div>

                                    <div className={style.colPlayer}>
                                        <div className={style.nameInfo}>
                                            <span className={style.username}>{user.username}</span>
                                        </div>
                                    </div>

                                    <div className={`${style.colPP} ${style.ppValue}`}>
                                        {user.pp.toLocaleString()}pp ({user.pp.toLocaleString()})
                                    </div>
                                    <div className={`${style.colAcc} ${style.statValue}`}>
                                        {(user.accuracy).toFixed(2)}%
                                    </div>
                                    <div className={`${style.colPlays} ${style.statValue}`}>
                                        {user.playcount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={style.footerContainer}>
                            <div className={style.arrows}>
                                <img src="arrow_pagination.svg" alt="" className={style.arrow} />
                                <img src="arrow_pagination.svg" alt="" className={style.arrow} style={{ transform: 'rotate(180deg)' }} />
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