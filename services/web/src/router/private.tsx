import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signed, loading } = useAuth()

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Carregando...</div>
    }

    if (!signed) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

export default PrivateRoute