import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/navbar.module.css';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/sensores', label: 'Sensores', icon: '📡' },
    { path: '/atuador', label: 'Atuadores', icon: '⚙️' },
    { path: '/indicadores', label: 'Indicadores', icon: '📊' },
    { path: '/logs', label: 'Logs', icon: '📋' },
    { path: '/contato', label: 'Contato/CV', icon: '👤' },
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navLink} ${
                router.pathname === item.path ? styles.active : ''
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Informações do usuário */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userIcon}>👤</span>
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user ? user.name : 'Aluno Demo'}
              </span>
              <span className={styles.userStatus}>
                {user ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}