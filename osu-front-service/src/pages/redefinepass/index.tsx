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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
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