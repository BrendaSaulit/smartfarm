import { FiHome, FiWifi, FiTool, FiActivity, FiFileText, FiUser, FiLogOut, FiLeaf } from 'react-icons/fi';
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
    { path: '/', label: 'Home', Icon: FiHome },
    { path: '/sensores', label: 'Sensores', Icon: FiWifi },
    { path: '/atuadores', label: 'Atuadores', Icon: FiTool },
    { path: '/indicadores', label: 'Indicadores', Icon: FiActivity },
    { path: '/logs', label: 'Logs', Icon: FiFileText },
    { path: '/contato', label: 'Contato/CV', Icon: FiUser },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
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
          {navItems.map(({ path, label, Icon }) => (
            <Link
              key={path}
              href={path}
              className={`${styles.navLink} ${router.pathname === path ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{Icon ? <Icon /> : null}</span>
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Informações do usuário */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>{FiUser ? <FiUser /> : null}</span>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user ? user.username : 'Aluno Demo'}</span>
              
              {/* Status limpo e centralizado */}
              <span className={`${styles.userStatus} ${user ? styles.online : styles.offline}`}>
                {user ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            {FiLogOut ? <FiLogOut style={{ marginRight: 6 }} /> : null} Sair
          </button>
        </div>
      </div>
    </nav>
  );
}