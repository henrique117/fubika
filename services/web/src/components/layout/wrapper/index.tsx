import React from 'react'
import { NavbarComponent } from '../../components.export'
import styles from './style.module.css'

interface PageLayoutProps {
    children: React.ReactNode
}

const Wrapper: React.FC<PageLayoutProps> = ({ children }) => {
    return (
        <div>
            <NavbarComponent />
            <main className={styles.main}>
                {children}
            </main>
        </div>
    )
}

export default Wrapper
