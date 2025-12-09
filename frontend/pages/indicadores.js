import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import LineChart from '../components/LineChart';
import styles from '../styles/indicadores.module.css';
import { useESP32 } from '../contexts/ESP32Context';
import {
  FiActivity,
  FiGlobe,
  FiRefreshCw, 
  FiBarChart2,
  FiZap,
  FiSun,
  FiWind,
  FiDroplet,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import { FaApple } from 'react-icons/fa';

export default function Indicadores() {
  const router = useRouter();
  
  const { 
    sensorData,
    sensorHistory,
    connectionStatus,
    dataSource,
    lastUpdate,
    lastError,
    isLoading,
    fetchSensorData,
    config,
    sendCommand,
    isSendingCommand
  } = useESP32();

  const [isUpdating, setIsUpdating] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [localCommandStatus, setLocalCommandStatus] = useState('Pronto');

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    await fetchSensorData();
    setTimeout(() => setIsUpdating(false), 500);
  };

  const sendCmd = async (cmd) => {
    if (isSendingCommand) return;
    
    const result = await sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    
    if (result.success) {
      console.log("Comando enviado:", cmd);
      
      setLastCommand({
        cmd,
        timestamp,
        status: 'success'
      });
      
      setLocalCommandStatus('Comando enviado com sucesso!');
      
      setTimeout(() => {
        setLocalCommandStatus('Pronto');
      }, 2000);
      
    } else {
      console.warn("Erro ao enviar comando:", result.error);
      
      setLastCommand({
        cmd,
        timestamp,
        status: 'error'
      });
      
      setLocalCommandStatus('Erro ao enviar comando');
      
      setTimeout(() => {
        setLocalCommandStatus('Pronto');
      }, 3000);
    }
  };

  const chartData = {
    labels: sensorHistory.map(item => item.timestamp.split(':').slice(0, 2).join(':')),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: sensorHistory.map(item => item.temperature),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4
      },
      {
        label: 'Umidade (%)',
        data: sensorHistory.map(item => item.humidity),
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4
      },
      {
        label: 'Umidade Solo (%)',
        data: sensorHistory.map(item => item.soil),
        borderColor: '#45b7d1',
        backgroundColor: 'rgba(69, 183, 209, 0.1)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => router.back()} 
            className={styles.backButton}
          >
            ← Voltar
          </button>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}><FiActivity /></span>
            Indicadores
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${connectionStatus === 'Conectado' ? styles.connected : styles.disconnected}`}></span>
            {connectionStatus}
          </div>
          <div className={styles.lastUpdate}>
            Última atualização: {lastUpdate || '--:--'}
            {lastCommand && ` | Último comando: ${lastCommand.cmd}`}
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className={styles.connectionCard}>
        <div className={styles.connectionInfo}>
          <h3><FiGlobe /> Conexão ESP32</h3>
          <p><strong>Endereço IP:</strong> {config.ESP32_IP}</p>
          <p><strong>Status:</strong> 
            <span className={connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Fonte de Dados:</strong> {dataSource}</p>
          <p><strong>Atualização:</strong> A cada {config.UPDATE_INTERVAL / 1000} segundos</p>
          {lastError && (
            <p style={{color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.5rem'}}>
              <strong>Erro:</strong> {lastError}
            </p>
          )}
        </div>
        
        <div className={styles.connectionActions}>
          <button 
            onClick={handleManualUpdate} 
            className={styles.refreshButton}
            disabled={isUpdating || isLoading}
          >
            <FiRefreshCw style={{ marginRight: 6 }} /> 
            {isUpdating || isLoading ? 'Atualizando...' : 'Atualizar Agora'}
          </button>
          <span className={styles.updateInfo}>
            {isLoading ? 'Conectando aos sensores...' : 'Dados em tempo real'}
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2><FiBarChart2 /> Evolução Temporal dos Sensores</h2>
          <div className={styles.chartControls}>
            <span className={styles.chartInfo}>
              {dataSource === 'ESP32 (Real)' 
                ? `Dados em tempo real do ESP32 | Atualização: ${config.UPDATE_INTERVAL / 1000}s` 
                : `Dados simulados para demonstração | Atualização: ${config.UPDATE_INTERVAL / 1000}s`}
            </span>
            <button 
              onClick={handleManualUpdate} 
              className={styles.refreshBtn}
              disabled={isLoading || isUpdating}
            >
              {isLoading || isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
            </button>
          </div>
        </div>
        
        <div className={styles.chartContainer}>
          {sensorHistory.length > 0 ? (
            <LineChart data={chartData} />
          ) : (
            <div className={styles.noData}>
              <div className={styles.noDataIcon}><FiBarChart2 /></div>
              <h3>Aguardando dados do ESP32...</h3>
              <p>Conectando ao ESP32 em {config.ESP32_IP}</p>
              <p>Verifique a conexão e o endereço IP do dispositivo</p>
              {lastError && <p style={{color: 'var(--error-color)', marginTop: '1rem'}}>Erro: {lastError}</p>}
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

      {/* Controles Rápidos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FiZap /></span>
          Controles Rápidos
        </h2>

        <div className={styles.quickControls}>
          <button 
            onClick={() => sendCmd('LED')}
            className={styles.quickButton}
            style={{ backgroundColor: '#ffd166' }}
            disabled={isSendingCommand}
          >
            <span className={styles.quickIcon}><FiSun /></span>
            LED
          </button>

          <button 
            onClick={() => sendCmd('FAN')}
            className={styles.quickButton}
            style={{ backgroundColor: '#4ecdc4' }}
            disabled={isSendingCommand}
          >
            <span className={styles.quickIcon}><FiWind /></span>
            Ventilador
          </button>

          <button 
            onClick={() => sendCmd('FEED')}
            className={styles.quickButton}
            style={{ backgroundColor: '#06d6a0' }}
            disabled={isSendingCommand}
          >
            <span className={styles.quickIcon}><FaApple /></span>
            Alimentar
          </button>

          <button 
            onClick={() => sendCmd('WATER')}
            className={styles.quickButton}
            style={{ backgroundColor: '#118ab2' }}
            disabled={isSendingCommand}
          >
            <span className={styles.quickIcon}><FiDroplet /></span>
            Regar
          </button>
        </div>

        {localCommandStatus !== 'Pronto' && (
          <div className={styles.commandStatus}>
            <span className={
              localCommandStatus.toLowerCase().includes('sucesso')
                ? styles.statusSuccess
                : styles.statusError
            }>
              {localCommandStatus}
            </span>
          </div>
        )}
      </div>

      {/* Navegação - Footer */}
      <div className={styles.navigation}>
        <Link href="/atuadores" className={styles.navButton}>
          <span className={styles.navIcon}><FiArrowLeft /></span>
          Atuadores
        </Link>
        <Link href="/contato" className={styles.navButton}>
          Contato/CV
          <span className={styles.navIcon}><FiArrowRight /></span>
        </Link>
      </div>
    </div>
  );
}