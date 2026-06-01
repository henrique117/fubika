import React, { useState } from 'react'
import style from './style.module.css'
import { ButtonGradientComponent, WrapperComponent } from '../../components/components.export'
import { Link } from 'react-router-dom'

const ForgotPass: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const togglePassword = () => setShowPassword(!showPassword)
    const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.redefineCard}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="" />
                        </button>
                    </Link>

                    <form className={style.formContainer}>

                        <div className={style.inputGroup}>
                            <label htmlFor="pass" className={style.label}>Nova senha</label>
                            <div className={style.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="pass"
                                    placeholder="••••••••••••"
                                    className={style.input}
                                />
                                <button
                                    type="button"
                                    onClick={togglePassword}
                                    className={style.eyeButton}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http:
                                    ) : (
                                        <svg xmlns="http:
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={style.inputGroup}>
                            <label htmlFor="pass_confirm" className={style.label}>Confirmar senha</label>
                            <div className={style.passwordWrapper}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="pass_confirm"
                                    placeholder="••••••••••••"
                                    className={style.input}
                                />
                                <button
                                    type="button"
                                    onClick={toggleConfirmPassword}
                                    className={style.eyeButton}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http:
                                    ) : (
                                        <svg xmlns="http:
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className={style.entrarButton}>
                        <ButtonGradientComponent text='OK' />
                    </div>

                </div>
            </div>
        </WrapperComponent>
    )
}

export default ForgotPass
