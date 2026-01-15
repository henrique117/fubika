import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import style from './style.module.css'
import { WrapperComponent, ButtonGradientComponent } from '../../components/components.export'
import { api } from '../../services/api'

interface FormErrors {
    name?: string
    email?: string
    password?: string
    key?: string
    general?: string
}

const Register: React.FC = () => {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [inviteCode, setInviteCode] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const [errors, setErrors] = useState<FormErrors>({})

    const togglePassword = () => setShowPassword(!showPassword)
    const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)

    const validateForm = () => {
        const newErrors: FormErrors = {}
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        
        if (!username || username.length < 3) {
            newErrors.name = "Nome de usuário muito curto (min 3 chars)."
        }

        if (username.length > 15) {
            newErrors.name = "Nome de usuário muito longo (max 15 chars)."
        }
        
        if (!email || !emailRegex.test(email)) {
            newErrors.email = "Insira um e-mail válido."
        }

        if (!password || password.length < 6) {
            newErrors.password = "A senha deve ter no mínimo 6 caracteres."
        }

        if (password !== confirmPassword) {
            newErrors.password = "As senhas não coincidem."
        }

        if (!inviteCode) {
            newErrors.key = "A chave de acesso é obrigatória."
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        if (!validateForm()) return

        try {
            setLoading(true)
            
            await api.post('/user/register', {
                name: username,
                email: email,
                password: password,
                key: inviteCode
            })

            alert('Conta criada com sucesso! Faça login.')
            navigate('/login')

        } catch (err: any) {
            const errorData = err.response?.data
            const msg = errorData?.message || errorData?.error || 'Erro ao criar conta.'
            
            setErrors({ general: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <WrapperComponent>
            <div className={style.pageWrapper}>
                <div className={style.registerCard}>
                    <Link to='/'>
                        <button className={style.backButton}>
                            <img src="arrow_icon.svg" alt="Voltar" />
                        </button>
                    </Link>

                    <div className={style.logoContainer}>
                        <img src="/logo_registro.svg" alt="Registro" className={style.logoSvg} />
                    </div>

                    {errors.general && (
                        <div className={style.generalError}>
                            {errors.general}
                        </div>
                    )}

                    <form className={style.formContainer} onSubmit={handleRegister}>

                        <div className={style.inputGroup}>
                            <label htmlFor="email" className={style.label}>E-mail</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="orlandoalmeida0000@gmail.com"
                                className={`${style.input} ${errors.email ? style.inputError : ''}`}
                            />
                            {errors.email && <span className={style.errorText}>{errors.email}</span>}
                        </div>

                        <div className={style.inputGroup}>
                            <label htmlFor="user" className={style.label}>Nome de usuário</label>
                            <input
                                type="text"
                                id="user"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ManfaceEnjoyer"
                                className={`${style.input} ${errors.name ? style.inputError : ''}`}
                            />
                            {errors.name && <span className={style.errorText}>{errors.name}</span>}
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
                                    className={`${style.input} ${errors.password ? style.inputError : ''}`}
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
                            {errors.password && <span className={style.errorText}>{errors.password}</span>}
                        </div>

                        <div className={style.inputGroup}>
                            <label htmlFor="pass_confirm" className={style.label}>Confirmar senha</label>
                            <div className={style.passwordWrapper}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="pass_confirm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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

                        <div className={style.inputGroup}>
                            <label htmlFor="key" className={style.label}>Chave de acesso</label>
                            <input
                                type="text"
                                id="key"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                placeholder="ABCDEFGH"
                                className={`${style.input} ${errors.key ? style.inputError : ''}`}
                            />
                            {errors.key && <span className={style.errorText}>{errors.key}</span>}
                        </div>
                    </form>
                    
                    <Link to='/login' className={style.forgotPassword}>
                        Já tem uma conta? Entre agora
                    </Link>

                    <div className={style.entrarButton} onClick={!loading ? handleRegister : undefined}>
                        <ButtonGradientComponent text={loading ? 'Carregando...' : 'Registrar'} />
                    </div>
                    
                </div>
            </div>
        </WrapperComponent>
    )
}

export default Register