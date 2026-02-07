import React, { useEffect, useState } from 'react'
import { ButtonComponent, WrapperComponent } from '../../components/components.export'

import style from './style.module.css'

import LogoFull from '/logo_fubika_full.svg'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

const Home: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState({ total: 0, online: 0 })

    const fetchUsersCount = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/count')
            setCounts({
                total: response.data.total_users,
                online: response.data.online_users
            });
        } catch (error) {
            console.error("Erro ao buscar estatísticas:", error)
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchUsersCount()
        const interval = setInterval(fetchUsersCount, 30000)
        return () => clearInterval(interval)
    }, []);
    
    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.centerContent}>
                    <div className={style.infoCard}>
                        <div className={style.cardHeader}>
                            <div className={style.logoSvg}>
                                <img src={LogoFull} alt="Logo Fubika Completa" />
                            </div>
                            <div className={style.cardUpperText}>
                                <div className={style.stats} style={{ marginBottom: '10px' }}>
                                    <span className={style.statsNumber}>
                                        {loading && counts.total === 0 ? '...' : counts.total}
                                    </span>
                                    <span>jogadores registrados</span>
                                    
                                    <span className={style.statsNumber} style={{ marginLeft: '15px' }}>
                                        {loading && counts.online === 0 ? '...' : counts.online}
                                    </span>
                                    <span>jogadores online</span>
                                </div>
                                <p className={style.description}>
                                    Esse server nasceu com o intuito de ser uma base para que os brasileiros, principalmente 6 dígitos,
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className={style.description}>
                                pudessem melhorar suas habilidades e skillcaps de uma forma que não precisassem se preocupar em ganhar rank e pp em mapas no Bancho.
                                <br />
                                Caso possuam algum tipo de dúvida, favor entrar em contato com qualquer admin do servidor no Discord do Fubika!
                            </p>
                        </div>
                    </div>

                    <div className={style.buttonsRow}>
                        <div className={style.btnWrapper}>
                            <Link to='/login' style={{ textDecoration: 'none' }}>
                                <ButtonComponent text="Acessar conta" />
                            </Link>
                        </div>
                        <div className={style.btnWrapper}>
                            <Link to='/howtoconnect' style={{ textDecoration: 'none' }}>
                                <ButtonComponent text="Como conectar?" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Home