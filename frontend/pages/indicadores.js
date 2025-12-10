import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Graph from '../components/Graph';
import QuickControls from '../components/QuickControls';
import styles from '../styles/indicadores.module.css';
import { useESP32 } from '../contexts/ESP32Context';
import {
  FiActivity,
  FiGlobe,
  FiRefreshCw, 
  FiZap,
  FiArrowLeft,
  FiArrowRight,
  FiSun,
  FiWind,
  FiDroplet
} from 'react-icons/fi';

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

  // Comandos sem o "Alimentar"
  const quickCommands = [
    { id: 'LED',   label: 'LED',        cmd: 'LED',   color: '#ffd166', Icon: FiSun },
    { id: 'FAN',   label: 'Ventilador', cmd: 'FAN',   color: '#4ecdc4', Icon: FiWind },
    { id: 'WATER', label: 'Regar',      cmd: 'WATER', color: '#118ab2', Icon: FiDroplet },
  ];

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
          <p><strong>Endereço IP:</strong> {config?.ip}</p>
          <p><strong>Status:</strong> 
            <span className={connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Fonte de Dados:</strong> {dataSource}</p>
          {lastError && connectionStatus != 'Conectado' &&(
            <p style={{color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.5rem'}}>
              <strong>Erro:</strong> {lastError}
            </p>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <Graph
        sensorHistory={sensorHistory}
        dataSource={dataSource}
        config={config}
        lastError={lastError}
        title="Evolução Temporal dos Sensores"
        showInfo={true}
      />

      {/* Controles Rápidos */}
      <QuickControls
        onSend={sendCmd}
        isSending={isSendingCommand}
        commands={quickCommands}
      />

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