import React from 'react'
import style from './style.module.css'
import { WrapperComponent } from '../../components/components.export'

const Login: React.FC = () => {
    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.loginCard}>
                    <button className={style.backButton}>
                        <img src="arrow_icon.svg" alt="" />
                    </button>

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

                        <a href="#" className={style.forgotPassword}>
                            Esqueceu a sua senha?
                        </a>

                    </form>
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Login