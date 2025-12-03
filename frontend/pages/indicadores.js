import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LineChart from '../components/LineChart';
import styles from '../styles/indicadores.module.css';

// Reutilize a mesma configuração do ESP32
const ESP32_IP = "http://10.106.33.1";

export default function Sensores() {
  const router = useRouter();
  const [sensorData, setSensorData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataSource, setDataSource] = useState('ESP32 (Real)');
  const [lastError, setLastError] = useState(null);

  // Função para normalizar luminosidade
  const normalizeLight = (raw) => {
    let light = Math.pow(raw / 4095.0, 0.6) * 100.0;
    light = Math.round(light / 10) * 10;
    return Math.min(100, Math.max(0, light));
  };

  // Função principal para buscar dados dos sensores (atualiza histórico)
  const updateSensors = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    setIsLoading(true);
    setLastError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${ESP32_IP}/sensors`, { signal: controller.signal });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Falha HTTP ${res.status}`);

      const data = await res.json();

      if (data.light !== undefined) data.light = normalizeLight(data.light);

      setSensorData(data);
      setConnectionStatus('Conectado');
      setDataSource('ESP32 (Real)');
      setLastUpdate(new Date().toLocaleTimeString());

      setSensorHistory(prev => {
        const newH = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soil: data.soil || 0,
          light: data.light || 0,
          water: data.water || 0
        }];
        return newH.slice(-20);
      });

    } catch (erro) {
      console.error("Erro ao conectar com o ESP32:", erro);
      setConnectionStatus('Desconectado');
      setDataSource('Simulação (Demo)');
      setLastError(erro?.message || String(erro));

      const simulatedData = {
        temperature: 24.8 + (Math.random() * 2 - 1),
        humidity: 60 + (Math.random() * 10 - 5),
        steam: 15 + (Math.random() * 10 - 5),
        light: 70 + (Math.random() * 30 - 15),
        soil: 45 + (Math.random() * 20 - 10),
        water: 35 + (Math.random() * 20 - 10)
      };

      setSensorData(simulatedData);

      setSensorHistory(prev => {
        const newH = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: simulatedData.temperature,
          humidity: simulatedData.humidity,
          soil: simulatedData.soil,
          light: simulatedData.light,
          water: simulatedData.water
        }];
        return newH.slice(-20);
      });

      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Configura atualização periódica
  useEffect(() => {
    updateSensors();
    const intervalId = setInterval(updateSensors, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // prepara dados para o gráfico (igual ao Home)
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
          <p><strong>Endereço IP:</strong> {ESP32_IP}</p>
          <p><strong>Status:</strong> 
            <span className={connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Atualização:</strong> A cada 2 segundos</p>
        </div>
        
        <div className={styles.connectionActions}>
          <button 
            onClick={updateSensors} 
            className={styles.refreshButton}
            disabled={isUpdating}
          >
            {isUpdating ? '🔄 Atualizando...' : '🔄 Atualizar Agora'}
          </button>
          <span className={styles.updateInfo}>
            {isLoading ? 'Conectando aos sensores...' : 'Dados em tempo real'}
          </span>
        </div>
      </div>

      {/* ====== Gráfico (importado da Home) ====== */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2>📈 Evolução Temporal dos Sensores</h2>
          <div className={styles.chartControls}>
            <span className={styles.chartInfo}>
              {dataSource === 'ESP32 (Real)' 
                ? 'Dados em tempo real do ESP32 | Atualização: 2s' 
                : 'Dados simulados para demonstração | Atualização: 2s'}
            </span>
            <button 
              onClick={updateSensors} 
              className={styles.refreshBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Agora'}
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
              <p>Conectando ao ESP32 em {ESP32_IP}</p>
              <p>Verifique a conexão e o endereço IP do dispositivo</p>
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