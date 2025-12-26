import React from 'react'
import { Link } from 'react-router-dom'
import style from './style.module.css'
import { useAuth } from '../../../contexts/AuthContext'

const Navbar: React.FC = () => {
    const { signed, user, signOut } = useAuth()

    const userAvatar = signed && user ? `https://a.bpy.local/${user.id}` : 'https://a.bpy.local/0'

    return (
        <header className={style.header}>
            <div className={style.container}>
                
                <div className={style.leftSection}>
                    <Link to='/' className={style.logo}>
                        <img src="/logo_fubika.svg" alt="Logo" />
                    </Link>

                    <nav className={style.navLinks}>
                        <Link to="/mapas">mapas</Link>
                        <span className={style.separator}>|</span>
                        <Link to="/ranking">colocações</Link>
                        <span className={style.separator}>|</span>
                        <Link to="/help">ajuda</Link>
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

                    {signed && user ? (
                        <>
                            <div className={style.actionButtons}>
                                <button className={style.iconButton}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                </button>
                                <button className={style.iconButton}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                </button>
                            </div>

                            <div className={style.profile} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{user.name}</span>
                                
                                <img 
                                    src={userAvatar} 
                                    alt={user.name} 
                                    onError={(e) => e.currentTarget.src = 'https://a.bpy.local/0'}
                                    style={{ borderRadius: '50%', width: '36px', height: '36px', objectFit: 'cover' }}
                                />

                                <button 
                                    onClick={signOut} 
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.1)', 
                                        border: 'none', 
                                        borderRadius: '5px',
                                        color: '#ff6666', 
                                        cursor: 'pointer', 
                                        padding: '5px 10px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        marginLeft: '5px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginLeft: '10px' }}>
                            <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '14px', opacity: 0.9 }}>
                                Entrar
                            </Link>
                            <Link to="/register" style={{ 
                                color: 'white', 
                                background: 'inherit',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                textDecoration: 'none', 
                                fontWeight: 600, 
                                fontSize: '14px' 
                            }}>
                                Cadastrar
                            </Link>
                        </div>
                    )}
                    
                </div>
            </div>
        </header>
    )
}

export default Navbar;