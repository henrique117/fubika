import React, { createContext, useState, useEffect, useContext } from 'react'
import { api } from '../services/api'

interface AuthContextData {
    signed: boolean
    user: any | null
    signIn: (token: string, user: any) => void
    signOut: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null)
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
                    signOut()
                }
            } else {
                signOut()
            }

            setLoading(false)
        }

        validateToken()
    }, [])

    const signIn = (token: string, userData: any) => {
        localStorage.setItem('osu_token', token)
        localStorage.setItem('osu_user', JSON.stringify(userData))
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(userData)
    }

    const signOut = () => {
        localStorage.removeItem('osu_token')
        localStorage.removeItem('osu_user')
        
        delete api.defaults.headers.common['Authorization']
        
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