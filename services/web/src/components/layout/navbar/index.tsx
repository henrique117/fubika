import { Link } from 'react-router-dom'
import style from './style.module.css'
import { useAuth } from '../../../contexts/AuthContext'
import { useState, useEffect } from 'react'

const Navbar: React.FC = () => {
    const { signed, user, signOut } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const userAvatar = signed && user ? `https:
    useEffect(() => {
        let resizeTimer: number;

        const handleResize = () => {
            document.body.classList.add('no-transition');
            clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                document.body.classList.remove('no-transition');
            }, 400);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header className={style.header}>
            <div className={style.container}>

                <div className={style.leftSection}>
                    <Link to='/' className={style.logo}>
                        <img src="/logo_fubika.svg" alt="Logo" />
                    </Link>

                    <nav className={`${style.navLinks} ${menuOpen ? style.navActive : ''}`}>
                        <div className={style.mobileOnly}>
                            <div className={style.searchWrapperInside}>
                                <input type="text" placeholder="Pesquisar..." className={style.searchInput} />
                            </div>
                        </div>

                        {signed && user && (
                            <div className={style.mobileOnly}>
                                <div className={style.profileInside}>
                                    <img src={userAvatar} alt={user.name} />
                                    <span>{user.name}</span>
                                </div>
                            </div>
                        )}

                        <Link to="/mapas" onClick={() => setMenuOpen(false)}>mapas</Link>
                        <span className={style.separator}>|</span>
                        <Link to="/ranking" onClick={() => setMenuOpen(false)}>colocações</Link>
                        <span className={style.separator}>|</span>
                        <Link to="/help" onClick={() => setMenuOpen(false)}>ajuda</Link>

                        {signed && (
                            <div className={style.mobileOnly}>
                                <button className={style.logoutBtn} onClick={() => { signOut(); setMenuOpen(false); }}>
                                    sair
                                </button>
                            </div>
                        )}
                    </nav>
                </div>

                <div className={style.rightSection}>
                    <button className={style.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
                        <svg xmlns="http:
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    <div className={style.searchWrapper}>
                        <svg xmlns="http:
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" placeholder="Pesquisar..." className={style.searchInput} />
                    </div>

                    {signed && user ? (
                        <div className={style.profileHeader}>
                            <div className={style.actionButtons}>
                                <button className={style.iconButton}>
                                    <svg xmlns="http:
                                </button>
                                <button className={style.iconButton}>
                                    <svg xmlns="http:
                                </button>
                            </div>

                            <img
                                src={userAvatar}
                                alt={user.name}
                                className={style.avatarTrigger}
                                onClick={() => setMenuOpen(!menuOpen)}
                                onError={(e) => e.currentTarget.src = 'https:
                            />

                        </div>
                    ) : (
                        <div className={style.authLinks}>
                            <Link to="/login" className={style.loginLink}>Entrar</Link>
                            <Link to="/register" className={style.registerLink}>Cadastrar</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Navbar;
