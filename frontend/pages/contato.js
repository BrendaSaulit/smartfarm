import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiHome } from 'react-icons/fi';
import styles from '../styles/contato.module.css';

// Dados dos desenvolvedores
const developers = [
  { name: 'Brenda', role: 'Desenvolvedora', cvPath: '/cv/brenda/curriculo-template.html' },
  { name: 'João', role: 'Desenvolvedor', cvPath: '/cv/joao/curriculo_JoaoVitorNunes_DevWeb/curriculo-template.html' },
  { name: 'Gustavo', role: 'Desenvolvedor', cvPath: '/cv/gustavo/Curriculo_Gustavo/curriculo-template.html' },
  { name: 'Bernardo', role: 'Desenvolvedor', cvPath: '/cv/bernardo/curriculo_bernardo.html' },
];

export default function Contato() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* Seção Fale Conosco - Desenvolvedores */}
      <div>
        <h1 className={styles.title}>Entre em contato</h1>
        <p className={styles.subtitle}>
          Entre em contato com nossa equipe ou saiba mais sobre cada um de nós. Clique nos cards abaixo para
          acessar os currículos completos.
        </p>

        {/* Grade de Cards dos Desenvolvedores */}
        <div className={styles.developerGrid}>
          {developers.map((dev, index) => (
            <div key={index} className={styles.devCard}>
              <span className={styles.devIcon}>👤</span>
              <div className={styles.devName}>{dev.name}</div>
              <div className={styles.devRole}>{dev.role}</div>
              
              <a
                href={dev.cvPath}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cvButton}
              >
                Ver Currículo
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Título sem container com borda */}
      <h2 className={styles.chartTitle}>Desenvolvedores - Smart Farm</h2>

      {/* Navegação - Footer (Indicadores e Voltar para Home) */}
      <div className={styles.navigation}>
        <Link href="/indicadores" className={styles.navButton}>
          <span className={styles.navIcon}>←</span>
          Indicadores
        </Link>
        <Link href="/" className={styles.navButton}>
          Voltar para Home
          <span className={styles.navIcon}><FiHome /></span>
        </Link>
      </div>
    </div>
  );
}