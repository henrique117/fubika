import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { AuthContext, type AuthUser } from './auth'

const clearSession = () => {
    localStorage.removeItem('osu_token')
    localStorage.removeItem('osu_user')

    delete api.defaults.headers.common['Authorization']
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const validateToken = async () => {
            const storagedToken = localStorage.getItem('osu_token')
            const storagedUser = localStorage.getItem('osu_user')

            if (storagedToken && storagedUser) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`
                
                setUser(JSON.parse(storagedUser))

                try {
                    const response = await api.get('/user/me')

                    setUser(response.data)
                    localStorage.setItem('osu_user', JSON.stringify(response.data))

                } catch (error) {
                    console.error("Sessão expirada ou token inválido.", error)
                    clearSession()
                    setUser(null)
                }
            } else {
                clearSession()
                setUser(null)
            }

            setLoading(false)
        }

        validateToken()
    }, [])

    const signIn = (token: string, userData: AuthUser) => {
        localStorage.setItem('osu_token', token)
        localStorage.setItem('osu_user', JSON.stringify(userData))
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(userData)
    }

    const signOut = () => {
        clearSession()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
