import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/sensores.module.css';
import { useESP32 } from '../contexts/ESP32Context';
import {
  FiWifi,
  FiBarChart2,
  FiClipboard,
  FiThermometer,
  FiDroplet,
  FiCloudRain,
  FiSun,
  FiLayers,
  FiGlobe,
} from 'react-icons/fi';

export default function Sensores() {
  const router = useRouter();
  
  // Usando o contexto ESP32 - MESMO DO index.js!
  const { 
    sensorData,            // Dados reais OU simulados (fallback)
    connectionStatus,      // 'Conectado' OU 'Desconectado'
    dataSource,           // 'ESP32 (Real)' OU 'Simulação (Demo)'
    lastUpdate,           // Timestamp da última atualização
    lastError,            // Último erro (se houver)
    isLoading,            // Estado de loading inicial (TRUE apenas na primeira conexão)
    fetchSensorData,      // Função para atualização manual
    config                // Configuração (inclui ESP32_IP)
  } = useESP32();

  // Funções auxiliares para determinar status (mantidas do original)
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
    if (light < 50) return 'low';
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

  // Dados dos sensores para exibição (atualizado para usar sensorData do contexto)
  const sensors = [
    {
      id: 'temperature',
      name: 'Temperatura do Ambiente',
      value: sensorData?.temperature,
      unit: '°C',
      icon: FiThermometer,
      color: '#ff6b6b',
      status: getTemperatureStatus(sensorData?.temperature),
      ideal: '20-30°C'
    },
    {
      id: 'humidity',
      name: 'Umidade do Ambiente',
      value: sensorData?.humidity,
      unit: '%',
      icon: FiDroplet,
      color: '#4ecdc4',
      status: getHumidityStatus(sensorData?.humidity),
      ideal: '40-60%'
    },
    {
      id: 'steam',
      name: 'Vapor/Chuva',
      value: sensorData?.steam,
      unit: '%',
      icon: FiCloudRain,
      color: '#45b7d1',
      status: getSteamStatus(sensorData?.steam),
      ideal: '0-20%'
    },
    {
      id: 'light',
      name: 'Luz Ambiente',
      value: sensorData?.light,
      unit: '%',
      icon: FiSun,
      color: '#ffd166',
      status: getLightStatus(sensorData?.light),
      ideal: '50-80%'
    },
    {
      id: 'soil',
      name: 'Umidade do Solo',
      value: sensorData?.soil,
      unit: '%',
      icon: FiLayers,
      color: '#06d6a0',
      status: getSoilStatus(sensorData?.soil),
      ideal: '40-60%'
    },
    {
      id: 'water',
      name: 'Nível da Água',
      value: sensorData?.water,
      unit: '%',
      icon: FiDroplet, // ícone seguro
      color: '#118ab2',
      status: getWaterStatus(sensorData?.water),
      ideal: 'acima de 20%'
    }
  ];

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
            <span className={styles.titleIcon}><FiWifi /></span>
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
          <h3><FiGlobe /> Conexão ESP32</h3>
          <p><strong>Endereço IP:</strong> {config?.ip}</p>
          <p><strong>Status da conexão:</strong> 
            <span className={connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Fonte de dados:</strong> {dataSource}</p>
        </div>
      </div>

      {/* Grid de Sensores*/}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FiBarChart2 /></span>
          Leitura dos Sensores
        </h2>
        
        <div className={styles.sensorsGrid}>
          {sensors.map((sensor) => (
            <div key={sensor.id} className={styles.sensorCard}>
              <div 
                className={styles.sensorHeader}
                style={{ borderLeftColor: sensor.color }}
              >
                <div className={styles.sensorIcon}>{sensor.icon ? <sensor.icon /> : null}</div>
                <h3 className={styles.sensorName}>{sensor.name}</h3>
                <span className={`${styles.sensorBadge} ${styles[sensor.status]}`}>
                  {sensor.status === 'high' ? 'ALTO' : 
                   sensor.status === 'low' ? 'BAIXO' : 'NORMAL'}
                </span>
              </div>
              
              {/* EXATAMENTE IGUAL AO index.js: mostra "Carregando..." apenas no primeiro loading */}
              <div className={styles.sensorValue}>
                {isLoading ? (
                  <div className={styles.loading}>Conectando...</div>
                ) : (
                  <>
                    <span className={styles.value}>
                      {sensor.value?.toFixed(sensor.unit === '°C' ? 1 : 0) || '--'}
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
          <span className={styles.sectionIcon}><FiClipboard /></span>
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
            <p><strong>Fonte:</strong> {dataSource}</p>
            <p><strong>Atualizado:</strong> {lastUpdate || '--:--'}</p>
            <p><strong>Endpoint:</strong> {config?.ip}/sensors</p>
            {lastError && connectionStatus !== 'Conectado' && (
              <p className={styles.errorText}>
                <strong>Erro de conexão:</strong> {lastError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      {/* Navegação*/}
      <div className={styles.navigation}>
        <Link href="/" className={styles.navButton}>
          <span className={styles.navIcon}>←</span>
          Dashboard
        </Link>
        <Link href="/atuadores" className={styles.navButton}>
          Atuadores
          <span className={styles.navIcon}>→</span>
        </Link>
      </div>
    </div>
  );
}