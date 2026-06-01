import React, { useState } from 'react'
import style from './style.module.css'
import { ButtonGradientComponent, WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'

const ForgotPass: React.FC = () => {
    const [linkSent, setLinkSent] = useState(false);

    const handleSendEmail = () => {
        setLinkSent(true);
    }

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.forgotCard}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="Voltar" />
                        </button>
                    </Link>

                    <form className={style.formContainer} onSubmit={(e) => e.preventDefault()}>
                        <div className={style.inputGroup}>
                            <label htmlFor="email" className={style.label}>Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="orlandoalmeida0000@gmail.com"
                                className={style.input}
                            />
                        </div>
                    </form>

                    <div className={style.entrarButton} onClick={handleSendEmail}>
                        <ButtonGradientComponent text='Enviar email' fontSize={12} />
                    </div>

                    {linkSent && (
                        <span className={style.forgotPassword}>
                            Foi enviado um link para a recuperação da senha neste email.
                        </span>
                    )}
                    
                </div>
            </div>
        </WrapperComponent>
    )
}

export default ForgotPass