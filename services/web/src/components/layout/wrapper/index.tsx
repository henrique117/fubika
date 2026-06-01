import React from 'react'
import { NavbarComponent } from '../../components.export'

interface PageLayoutProps {
    children: React.ReactNode
}

const Wrapper: React.FC<PageLayoutProps> = ({ children }) => {
    return (
        <div>
            <NavbarComponent />
            <main style={{ minHeight: 'calc(100vh - 60px)', paddingTop: '60px' }}>
                <div className="siteContainer">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default Wrapper
