import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import style from './style.module.css'
import { ButtonGradientComponent, WrapperComponent } from '../../components/components.export'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const LoginPage: React.FC = () => {
    const navigate = useNavigate()
    const { signIn, signed, loading } = useAuth()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [isloading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (loading) {
        return null
    }

    if (signed) {
        return <Navigate to="/" replace />
    }

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
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <path d="M4.22 4.22l15.56 15.56" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
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
                        onClick={() => !isloading && handleLogin()}
                        style={{ cursor: isloading ? 'wait' : 'pointer', opacity: isloading ? 0.7 : 1 }}
                    >
                        <ButtonGradientComponent text={isloading ? 'Carregando...' : 'Entrar'} />
                    </div>

                </div>
            </div>
        </WrapperComponent>
    )
}

export default LoginPage
