import React from 'react'
import style from './style.module.css'
import { ButtonGradientComponent, WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'

const HowToConnect: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.loginCard}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="" />
                        </button>
                    </Link>

                    <div className={style.logoContainer}>
                        <img src="/logo_entrar.svg" alt="Entrar" className={style.logoSvg} />
                    </div>

                    <form className={style.formContainer}>

                        <div className={style.inputGroup}>
                            <label htmlFor="user" className={style.label}>Nome de usuário</label>
                            <input
                                type="text"
                                id="user"
                                placeholder="ManfaceEnjoyer"
                                className={style.input}
                            />
                        </div>

                        <div className={style.inputGroup}>
                            <label htmlFor="pass" className={style.label}>Senha</label>
                            <input
                                type="password"
                                id="pass"
                                placeholder="••••••••••••"
                                className={style.input}
                            />
                        </div>
                    </form>

                    <Link to='/forgotpass' className={style.forgotPassword}>
                        <a href="#">
                            Esqueceu a senha?
                        </a>
                    </Link>

                    <div className={style.entrarButton}>
                        <ButtonGradientComponent text='Entrar' />
                    </div>

                </div>
            </div>
        </WrapperComponent>
    )
}

export default HowToConnect