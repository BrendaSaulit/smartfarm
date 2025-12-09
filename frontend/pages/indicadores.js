import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LineChart from '../components/LineChart';
import styles from '../styles/indicadores.module.css';
import { useESP32 } from '../contexts/ESP32Context';

export default function Indicadores() {
  const router = useRouter();
  
  // ===== USANDO O CONTEXTO ESP32 (mesmo padrão de index.js, sensores.js e atuadores.js) =====
  const { 
    sensorData,           // dados atuais dos sensores
    sensorHistory,        // histórico para o gráfico (array com últimas 20 leituras)
    connectionStatus,     // 'Conectado' ou 'Desconectado'
    dataSource,           // 'ESP32 (Real)' ou 'Simulação (Demo)'
    lastUpdate,           // timestamp da última atualização
    lastError,            // último erro capturado
    isLoading,            // estado de carregamento
    fetchSensorData,      // função manual para forçar atualização
    config                // configuração (ESP32_IP)
  } = useESP32();

  // Estado local apenas para controle de UI (não duplica lógica de conexão)
  const [isUpdating, setIsUpdating] = useState(false);

  // Função para atualizar manualmente (chama o contexto)
  const handleManualUpdate = async () => {
    setIsUpdating(true);
    await fetchSensorData();
    setTimeout(() => setIsUpdating(false), 500);
  };

  // ===== PREPARAÇÃO DOS DADOS PARA O GRÁFICO (idêntico ao index.js) =====
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
            <span className={styles.titleIcon}>📡</span>
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
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className={styles.connectionCard}>
        <div className={styles.connectionInfo}>
          <h3>🌐 Conexão ESP32</h3>
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
            {isUpdating || isLoading ? '🔄 Atualizando...' : '🔄 Atualizar Agora'}
          </button>
          <span className={styles.updateInfo}>
            {isLoading ? 'Conectando aos sensores...' : 'Dados em tempo real'}
          </span>
        </div>
      </div>

      {/* ====== GRÁFICO (idêntico ao index.js) ====== */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2>📈 Evolução Temporal dos Sensores</h2>
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
              <div className={styles.noDataIcon}>📊</div>
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

    </div>
  );
}