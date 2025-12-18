import React from 'react'
import style from './style.module.css'

interface NavbarProps {
    userAvatar?: string
}

const Navbar: React.FC<NavbarProps> = ({ 
    userAvatar = "https://github.com/shadcn.png"
}) => {
    return (
        <header className={style.header}>
            <div className={style.container}>
                
                <div className={style.leftSection}>
                    <div className={style.logo}>
                        <img src="/logo_fubika.svg" alt="Logo" />
                    </div>

                    <nav className={style.navLinks}>
                        <a href="/mapas">mapas</a>
                        <span className={style.separator}>|</span>
                        <a href="/rankings">colocações</a>
                        <span className={style.separator}>|</span>
                        <a href="/help">ajuda</a>
                    </nav>
                </div>

                <div className={style.rightSection}>
                    
                    <div className={style.searchWrapper}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={style.searchIcon}>
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" placeholder="Pesquisar..." className={style.searchInput} />
                    </div>

                    <div className={style.actionButtons}>
                        <button className={style.iconButton}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button className={style.iconButton}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>
                    </div>

                    <div className={style.profile}>
                        <img src={userAvatar} alt="User Profile" />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar