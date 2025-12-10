import LineChart from './LineChart';
import { FiBarChart2 } from 'react-icons/fi';
import styles from '../styles/graph.module.css';

export default function Graph({ 
  sensorHistory, 
  dataSource, 
  config, 
  lastError,
  title = 'Evolução Temporal dos Sensores',
  showInfo = true 
}) {
  
  const chartData = {
    labels: sensorHistory.map(item => item.timestamp.split(':').slice(0, 2).join(':')),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: sensorHistory.map(item => item.temperature),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Umidade (%)',
        data: sensorHistory.map(item => item.humidity),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Umidade Solo (%)',
        data: sensorHistory.map(item => item.soil),
        borderColor: '#45b7d1',
        backgroundColor: 'rgba(69, 183, 209, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  return (
    <div className={styles.chartSection}>
      <div className={styles.sectionHeader}>
        <h2><FiBarChart2 /> {title}</h2>
        {showInfo && (
          <div className={styles.chartControls}>
            <span className={styles.chartInfo}>
              {dataSource === 'ESP32 (Real)' 
                ? `Dados em tempo real do ESP32 | Atualização: 2s | Amostras: ${sensorHistory.length}` 
                : `Dados simulados para demonstração | Atualização: 2s | Amostras: ${sensorHistory.length}`}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.chartContainer}>
        {sensorHistory.length > 0 ? (
          <LineChart data={chartData} />
        ) : (
          <div className={styles.noData}>
            <div className={styles.noDataIcon}><FiBarChart2 /></div>
            <h3>Aguardando dados do ESP32...</h3>
            <p>Conectando ao ESP32 em {config?.ip || 'localhost:3002'}</p>
            <p>Modo: {dataSource || 'Conectando...'}</p>
            {lastError && (
              <p style={{color: 'var(--error-color)', marginTop: '1rem'}}>
                <strong>Erro:</strong> {lastError}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{backgroundColor: '#ff6b6b'}}></span>
          Temperatura (°C)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{backgroundColor: '#4ecdc4'}}></span>
          Umidade do Ar (%)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{backgroundColor: '#45b7d1'}}></span>
          Umidade do Solo (%)
        </div>
      </div>
    </div>
  );
}