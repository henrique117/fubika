import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import style from './style.module.css'
import { ButtonGradientComponent, WrapperComponent } from '../../components/components.export'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const LoginPage: React.FC = () => {
    const navigate = useNavigate()
    const { signIn } = useAuth()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const togglePassword = () => setShowPassword(!showPassword)

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        
        setError('')

        if (!username || !password) {
            setError('Preencha todos os campos.')
            return
        }

        try {
            setLoading(true)
            
            const response = await api.post('/user/login', {
                name: username,
                password: password
            })

            const { token, user } = response.data

            signIn(token, user)
            navigate('/')

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.loginCard}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="Voltar" />
                        </button>
                    </Link>

                    <div className={style.logoContainer}>
                        <img src="/logo_entrar.svg" alt="Entrar" className={style.logoSvg} />
                    </div>

                    {error && (
                        <div className={style.generalError}>
                            {error}
                        </div>
                    )}

                    <form className={style.formContainer} onSubmit={handleLogin}>

                        <div className={style.inputGroup}>
                            <label htmlFor="user" className={style.label}>Nome de usuário</label>
                            <input
                                type="text"
                                id="user"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ManfaceEnjoyer"
                                className={style.input}
                            />
                        </div>

                        <div className={style.inputGroup}>
                            <label htmlFor="pass" className={style.label}>Senha</label>
                            <div className={style.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="pass"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                        
                        <button type="submit" style={{ display: 'none' }}></button>
                    </form>

                    <Link to='/forgotpass' className={style.forgotPassword}>
                        Esqueceu a senha?
                    </Link>

                    <div 
                        className={style.entrarButton} 
                        onClick={() => !loading && handleLogin()}
                        style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
                    >
                        <ButtonGradientComponent text={loading ? 'Carregando...' : 'Entrar'} />
                    </div>

                </div>
            </div>
        </WrapperComponent>
    )
}

export default LoginPage