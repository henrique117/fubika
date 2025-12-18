import React, { useMemo } from 'react'
import { ButtonComponent, WrapperComponent } from '../../components/components.export'

import style from './style.module.css'

import LogoFull from '/logo_fubika_full.svg'
import SantaClaus from '/santa_claus.svg'
import Snowflake from '/snowflake.svg'
import Deer from '/dear.svg'
import GiftsRight from '/gift_dec.svg'
import TreeLeft from '/presents.svg'
import Ornaments from '/ornaments.svg'

const Home: React.FC = () => {
    const snowflakes = useMemo(() => {
        // Criamos um array com 20 itens (aumente se quiser mais neve)
        return Array.from({ length: 20 }).map((_, index) => {
            // Gera valores aleatórios para cada floco
            const randomLeft = Math.random() * 100;      // Posição horizontal (0% a 100%)
            const randomDuration = 5 + Math.random() * 10; // Duração entre 5s e 15s (velocidade)
            const randomDelay = Math.random() * 10;      // Atraso inicial para não caírem todos juntos
            const randomSize = 20 + Math.random() * 20;  // Tamanho entre 20px e 40px

            return (
                <img 
                    key={index}
                    src={Snowflake} 
                    alt="neve" 
                    className={style.snow}
                    style={{
                        // Passamos as variáveis para o CSS deste elemento específico
                        '--left': `${randomLeft}%`,
                        '--duration': `${randomDuration}s`,
                        '--delay': `${randomDelay}s`,
                        width: `${randomSize}px`,
                        height: `${randomSize}px`
                    } as React.CSSProperties} 
                />
            );
        });
    }, []);
    
    return (
        <WrapperComponent>
            <div>
                <div className={style.snowflakesContainer}>
                    {snowflakes}
                </div>
            </div>
            <div className={style.pageWrapper}>
                <div className={style.centerContent}>
                    <div className={style.infoCard}>
                        <div className={style.cardHeader}>
                            <div className={style.logoSvg}>
                                <img src={LogoFull} alt="Logo Fubika Completa" />
                            </div>
                            <div className={style.cardUpperText}>
                                <div className={style.stats}>
                                    <span className={style.statsNumber}>0</span><span>jogadores registrados</span>
                                    <span className={style.statsNumber} style={{ marginLeft: '5px' }}>0</span><span>jogadores online</span>
                                </div>
                                <p className={style.description}>
                                    Esse server nasceu com o intuito de ser uma base para que os brasileiros, principalmente 6
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className={style.description}>
                                dígitos, pudessem melhorar suas habilidades e skillcaps de uma forma que não precisassem se preocupar em ganhar rank e pp em mapas no Bancho.
                                <br />
                                Caso possuam algum tipo de dúvida, favor entrar em contato com qualquer admin do servidor no Discord do Fubika!
                            </p>
                        </div>
                    </div>

                    <div className={style.buttonsRow}>
                        <div className={style.btnWrapper}>
                            <ButtonComponent text="Acessar conta" />
                            <div className={style.ornamentsWrapper}>
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                            </div>
                        </div>
                        <div className={style.btnWrapper}>
                            <ButtonComponent text="Como conectar?" />
                            <div className={style.ornamentsWrapper}>
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                                <img src={Ornaments} alt="Decoração" className={style.ornamentsSvg} />
                            </div>
                        </div>
                    </div>

                    <div className={style.christmasSection}>
                        <h1 className={style.christmasTitle}>FELIZ NATAL!</h1>
                    </div>
                </div>

                <div className={style.footerDeco}>
                    <div className={style.leftDeco}>
                        <img src={TreeLeft} alt="Árvore" className={style.treeSvg} />
                        <img src={SantaClaus} alt="Papai Noel" className={style.santaSvg} />
                    </div>

                    <div className={style.rightDeco}>
                        <img src={Deer} alt="Rena" className={style.deerSvg} />
                        <img src={GiftsRight} alt="Presentes" className={style.giftsSvg2} />
                        <img src={GiftsRight} alt="Presentes" className={style.giftsSvg} />
                    </div>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Home