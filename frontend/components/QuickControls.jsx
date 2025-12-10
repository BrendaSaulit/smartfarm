import { FiZap, FiSun, FiWind, FiDroplet } from 'react-icons/fi';
import { FaApple } from 'react-icons/fa';
import styles from '../styles/quickControls.module.css';

const defaultCommands = [
  { id: 'LED',   label: 'LED',        cmd: 'LED',   color: '#ffd166', Icon: FiSun },
  { id: 'FAN',   label: 'Ventilador', cmd: 'FAN',   color: '#4ecdc4', Icon: FiWind },
  { id: 'FEED',  label: 'Alimentar',  cmd: 'FEED',  color: '#06d6a0', Icon: FaApple },
  { id: 'WATER', label: 'Regar',      cmd: 'WATER', color: '#118ab2', Icon: FiDroplet },
];

export default function QuickControls({ onSend, isSending = false, commands = defaultCommands }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><FiZap /></span>
        Controles Rápidos
      </h2>

      <div className={styles.quickControls}>
        {commands.map((c) => (
          <button
            key={c.id}
            onClick={() => onSend(c.cmd)}
            className={styles.quickButton}
            style={{ backgroundColor: c.color }}
            disabled={isSending}
          >
            <span className={styles.quickIcon}>{c.Icon ? <c.Icon /> : null}</span>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}