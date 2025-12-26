import React, { createContext, useState, useEffect, useContext } from 'react'
import { api } from '../services/api'

interface User {
    id: number
    name: string
    safe_name: string
    priv: number
    pfp: string
}

interface AuthContextData {
    signed: boolean
    user: User | null
    signIn: (token: string, user: User) => void
    signOut: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storagedToken = localStorage.getItem('osu_token')
        const storagedUser = localStorage.getItem('osu_user')

        if (storagedToken && storagedUser) {
            // (Opcional) Aqui você poderia validar o token na API: api.get('/user/me')...
            setUser(JSON.parse(storagedUser))
        }
        setLoading(false)
    }, [])

    const signIn = (token: string, userData: User) => {
        localStorage.setItem('osu_token', token);
        localStorage.setItem('osu_user', JSON.stringify(userData))
        
        setUser(userData)
    }

    const signOut = () => {
        localStorage.removeItem('osu_token')
        localStorage.removeItem('osu_user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}