import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/sensores.module.css';

// Reutilize a mesma configuração do ESP32
const ESP32_IP = "http://10.106.33.1";

export default function Sensores() {
  const router = useRouter();
  const [sensorData, setSensorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Função para buscar dados dos sensores
  const updateSensors = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setIsLoading(true);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      
      const res = await fetch(`${ESP32_IP}/sensors`, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        throw new Error("Falha ao obter dados dos sensores");
      }
      
      const data = await res.json();
      
      // Normaliza a luminosidade (se necessário)
      if (data.light !== undefined) {
        data.light = normalizeLight(data.light);
      }
      
      setSensorData(data);
      setConnectionStatus('Conectado');
      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (erro) {
      console.error("Erro ao conectar com o ESP32:", erro);
      setConnectionStatus('Desconectado');
      
      // Dados simulados para demonstração
      const simulatedData = {
        temperature: 24.8 + (Math.random() * 2 - 1),
        humidity: 60 + (Math.random() * 10 - 5),
        steam: 15 + (Math.random() * 10 - 5),
        light: 70 + (Math.random() * 30 - 15),
        soil: 45 + (Math.random() * 20 - 10),
        water: 35 + (Math.random() * 20 - 10)
      };
      
      setSensorData(simulatedData);
      
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // Função para normalizar luminosidade
  const normalizeLight = (raw) => {
    let light = Math.pow(raw / 4095.0, 0.6) * 100.0;
    light = Math.round(light / 10) * 10;
    return Math.min(100, Math.max(0, light));
  };

  // Configura atualização periódica
  useEffect(() => {
    updateSensors();
    
    const intervalId = setInterval(updateSensors, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Dados dos sensores para exibição
  const sensors = [
    {
      id: 'temperature',
      name: 'Temperatura do Ambiente',
      value: sensorData?.temperature?.toFixed(1),
      unit: '°C',
      icon: '🌡️',
      color: '#ff6b6b',
      status: getTemperatureStatus(sensorData?.temperature),
      ideal: '20-30°C'
    },
    {
      id: 'humidity',
      name: 'Umidade do Ambiente',
      value: sensorData?.humidity?.toFixed(1),
      unit: '%',
      icon: '💨',
      color: '#4ecdc4',
      status: getHumidityStatus(sensorData?.humidity),
      ideal: '40-60%'
    },
    {
      id: 'steam',
      name: 'Vapor/Chuva',
      value: sensorData?.steam?.toFixed(1),
      unit: '%',
      icon: '☁️',
      color: '#45b7d1',
      status: getSteamStatus(sensorData?.steam),
      ideal: '0-20%'
    },
    {
      id: 'light',
      name: 'Luz Ambiente',
      value: sensorData?.light?.toFixed(0),
      unit: '%',
      icon: '☀️',
      color: '#ffd166',
      status: getLightStatus(sensorData?.light),
      ideal: '50-80%'
    },
    {
      id: 'soil',
      name: 'Umidade do Solo',
      value: sensorData?.soil?.toFixed(0),
      unit: '%',
      icon: '🌱',
      color: '#06d6a0',
      status: getSoilStatus(sensorData?.soil),
      ideal: '40-60%'
    },
    {
      id: 'water',
      name: 'Nível da Água',
      value: sensorData?.water?.toFixed(0),
      unit: '%',
      icon: '🚰',
      color: '#118ab2',
      status: getWaterStatus(sensorData?.water),
      ideal: 'acima de 20%'
    }
  ];

  // Funções auxiliares para determinar status
  function getTemperatureStatus(temp) {
    if (!temp) return 'normal';
    if (temp > 30) return 'high';
    if (temp < 18) return 'low';
    return 'normal';
  }

  function getHumidityStatus(hum) {
    if (!hum) return 'normal';
    if (hum > 70) return 'high';
    if (hum < 40) return 'low';
    return 'normal';
  }

  function getSteamStatus(steam) {
    if (!steam) return 'normal';
    if (steam > 30) return 'high';
    return 'normal';
  }

  function getLightStatus(light) {
    if (!light) return 'normal';
    if (light > 80) return 'high';
    if (light < 30) return 'low';
    return 'normal';
  }

  function getSoilStatus(soil) {
    if (!soil) return 'normal';
    if (soil > 70) return 'high';
    if (soil < 30) return 'low';
    return 'normal';
  }

  function getWaterStatus(water) {
    if (!water) return 'normal';
    if (water < 20) return 'low';
    if (water > 90) return 'high';
    return 'normal';
  }

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
            Monitoramento de Sensores
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

      {/* Grid de Sensores */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span>
          Leitura dos Sensores
        </h2>
        
        <div className={styles.sensorsGrid}>
          {sensors.map((sensor) => (
            <div key={sensor.id} className={styles.sensorCard}>
              <div 
                className={styles.sensorHeader}
                style={{ borderLeftColor: sensor.color }}
              >
                <div className={styles.sensorIcon}>{sensor.icon}</div>
                <h3 className={styles.sensorName}>{sensor.name}</h3>
                <span className={`${styles.sensorBadge} ${styles[sensor.status]}`}>
                  {sensor.status === 'high' ? 'ALTO' : 
                   sensor.status === 'low' ? 'BAIXO' : 'NORMAL'}
                </span>
              </div>
              
              <div className={styles.sensorValue}>
                {isLoading ? (
                  <div className={styles.loading}>Carregando...</div>
                ) : (
                  <>
                    <span className={styles.value}>
                      {sensor.value || '--'}
                    </span>
                    <span className={styles.unit}>{sensor.unit}</span>
                  </>
                )}
              </div>
              
              <div className={styles.sensorFooter}>
                <span className={styles.idealRange}>
                  Ideal: {sensor.ideal}
                </span>
                <span className={styles.sensorId}>
                  ID: {sensor.id.toUpperCase()}
                </span>
              </div>
              
              <div className={styles.sensorProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, sensor.value || 0))}%`,
                    backgroundColor: sensor.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualização Detalhada */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📋</span>
          Dados em Texto
        </h2>
        
        <div className={styles.dataCard}>
          <div className={styles.dataContent}>
            {isLoading ? (
              <div className={styles.loadingData}>
                <div className={styles.loadingSpinner}></div>
                Conectando ao ESP32...
              </div>
            ) : sensorData ? (
              <pre className={styles.dataText}>
                {`Temperatura do Ambiente: ${sensorData.temperature?.toFixed(1) || '--'} °C
Umidade do Ambiente: ${sensorData.humidity?.toFixed(1) || '--'} %
Vapor/Chuva: ${sensorData.steam?.toFixed(1) || '--'} %
Luz Ambiente: ${sensorData.light?.toFixed(0) || '--'} %
Umidade do Solo: ${sensorData.soil?.toFixed(0) || '--'} %
Nível da Água: ${sensorData.water?.toFixed(0) || '--'} %`}
              </pre>
            ) : (
              <div className={styles.errorData}>
                ⚠️ Não foi possível obter dados dos sensores
              </div>
            )}
          </div>
          
          <div className={styles.dataInfo}>
            <p><strong>Formato:</strong> Dados brutos do ESP32</p>
            <p><strong>Atualizado:</strong> {lastUpdate || 'Nunca'}</p>
            <p><strong>Endpoint:</strong> {ESP32_IP}/sensors</p>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/" className={styles.footerLink}>
            ← Dashboard Principal
          </Link>
          <Link href="/atuadores" className={styles.footerLink}>
            Atuadores →
          </Link>
        </div>
        <div className={styles.footerInfo}>
          Smart Farm v2.0.0 | Página de Sensores | {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
}