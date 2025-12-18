import React from 'react'
import { NavbarComponent } from '../../components.export'

interface PageLayoutProps {
    children: React.ReactNode
}

const Wrapper: React.FC<PageLayoutProps> = ({ children }) => {
    return (
        <div>
            <NavbarComponent />
            <main style={{ height: '100vh' }}>
                {children}
            </main>
        </div>
    )
}

export default Wrapper