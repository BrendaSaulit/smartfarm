import { FiHome, FiWifi, FiTool, FiActivity, FiUser, FiLogOut, FiLogIn } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../styles/navbar.module.css';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);
  if (!isClient) return null;

  const navItems = [
    { path: '/', label: 'Home', Icon: FiHome, public: true },
    { path: '/sensores', label: 'Sensores', Icon: FiWifi, public: false },
    { path: '/atuadores', label: 'Atuadores', Icon: FiTool, public: false },
    { path: '/indicadores', label: 'Indicadores', Icon: FiActivity, public: false },
    { path: '/contato', label: 'Contato/CV', Icon: FiUser, public: false },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleNavClick = (e, path, isPublic) => {
    // Se a rota não é pública E o usuário está deslogado
    if (!isPublic && !user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🌱</span>
          <span className={styles.logoText}>Smart Farm</span>
        </div>

        {/* Itens de navegação */}
        <div className={styles.navItems}>
          {navItems.map(({ path, label, Icon, public: isPublic }) => (
            <Link
              key={path}
              href={path}
              onClick={(e) => handleNavClick(e, path, isPublic)}
              className={`${styles.navLink} ${router.pathname === path ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{Icon ? <Icon /> : null}</span>
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}

          {/* Botão Entrar - aparece APENAS quando deslogado */}
          {!user && (
            <Link
              href="/login"
              className={`${styles.navLink} ${router.pathname === '/login' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}><FiLogIn /></span>
              <span className={styles.navLabel}>Entrar</span>
            </Link>
          )}
        </div>

        {/* Seção do usuário - SEMPRE APARECE */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}><FiUser /></span>
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user ? user.username : 'Aluno Demo'}
              </span>
              <span className={`${styles.userStatus} ${user ? styles.online : styles.offline}`}>
                {user ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Botão Sair - aparece APENAS quando logado */}
          {user && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <FiLogOut style={{ marginRight: 6 }} /> Sair
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}