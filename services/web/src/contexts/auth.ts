import { createContext, useContext } from 'react'

export interface AuthUser {
    id: number
    name: string
}

export interface AuthContextData {
    signed: boolean
    user: AuthUser | null
    signIn: (token: string, user: AuthUser) => void
    signOut: () => void
    loading: boolean
}

export const AuthContext = createContext<AuthContextData | null>(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
