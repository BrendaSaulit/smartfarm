import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import LineChart from '../components/LineChart';
import styles from '../styles/home.module.css';

// Configuração do ESP32 
const ESP32_IP = "http://10.106.33.1"; 

export default function Home() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [isLoading, setIsLoading] =  useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [dataSource, setDataSource] = useState('ESP32 (Real)');
  const [lastError, setLastError] = useState(null);

  // Função para buscar dados do ESP32
  const fetchSensorData = async () => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      // Timeout de 3 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${ESP32_IP}/sensors`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validação básica dos dados recebidos
      if (!data || typeof data !== 'object') {
        throw new Error('Dados recebidos em formato inválido');
      }
      
      // Normaliza a luminosidade (como no tutorial)
      if (data.light !== undefined) {
        data.light = normalizeLight(data.light);
      }
      
      setSensorData(data);
      setConnectionStatus('Conectado');
      setDataSource('ESP32 (Real)');
      
      // Atualiza histórico (mantém últimos 20 pontos)
      setSensorHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soil: data.soil || 0,
          light: data.light || 0,
          water: data.water || 0
        }];
        
        // Mantém apenas últimos 20 pontos
        return newHistory.slice(-20);
      });
      
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Erro ao buscar dados do ESP32:', error);
      setConnectionStatus('Desconectado');
      setDataSource('Simulação (Demo)');
      setLastError(error.message);
      
      // Dados simulados para demonstração - SEMPRE gera novos dados
      const simulatedData = {
        temperature: 25.3 + (Math.random() * 2 - 1),
        humidity: 60 + (Math.random() * 10 - 5),
        soil: 45 + (Math.random() * 20 - 10),
        light: 70 + (Math.random() * 30 - 15),
        water: 30 + (Math.random() * 40 - 20)
      };
      
      // Atualiza sempre com novos dados simulados
      setSensorData(simulatedData);
      
      // Adiciona ao histórico mesmo em modo simulação
      setSensorHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: simulatedData.temperature,
          humidity: simulatedData.humidity,
          soil: simulatedData.soil,
          light: simulatedData.light,
          water: simulatedData.water
        }];
        
        return newHistory.slice(-20);
      });
      
      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };

  // Função para normalizar luminosidade (do tutorial)
  const normalizeLight = (raw) => {
    let light = Math.pow(raw / 4095.0, 0.6) * 100.0;
    light = Math.round(light / 10) * 10;
    return Math.min(100, Math.max(0, light));
  };

  // Busca dados inicial e configura atualização periódica
  useEffect(() => {
    fetchSensorData();
    
    const intervalId = setInterval(fetchSensorData, 2000); // Atualiza a cada 2 segundos
    
    return () => clearInterval(intervalId);
  }, []);

  // Cards de navegação
  const navCards = [
    { 
      id: 1, 
      title: 'Sensores', 
      path: '/sensores', 
      icon: '📡', 
      description: 'Monitoramento detalhado de todos os sensores',
      color: '#ff6b6b'
    },
    { 
      id: 2, 
      title: 'Atuadores', 
      path: '/atuadores', 
      icon: '⚙️', 
      description: 'Controle de dispositivos e automação',
      color: '#4ecdc4'
    },
    { 
      id: 3, 
      title: 'Indicadores', 
      path: '/indicadores', 
      icon: '📊', 
      description: 'Métricas e análises avançadas',
      color: '#45b7d1'
    },
    { 
      id: 4, 
      title: 'Logs', 
      path: '/logs', 
      icon: '📋', 
      description: 'Histórico de eventos e atividades',
      color: '#96ceb4'
    },
  ];

  // Prepara dados para o gráfico
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
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🌱</span>
          Dashboard Smart Farm
        </h1>
      </div>

      {/* Indicador de Modo de Operação (Temporário) */}
      <div className={styles.modeIndicator}>
        <div className={`${styles.modeCard} ${dataSource === 'ESP32 (Real)' ? styles.modeReal : styles.modeSimulated}`}>
          <div className={styles.modeHeader}>
            <span className={styles.modeIcon}>
              {dataSource === 'ESP32 (Real)' ? '🔌' : '🔄'}
            </span>
            <h3>Modo de Operação</h3>
            <span className={styles.modeBadge}>
              {dataSource === 'ESP32 (Real)' ? 'REAL' : 'DEMO'}
            </span>
          </div>
          <div className={styles.modeDetails}>
            <p><strong>Fonte de dados:</strong> {dataSource}</p>
            <p><strong>Status da conexão:</strong> 
              <span className={`${styles.statusText} ${connectionStatus === 'Conectado' ? styles.statusConnected : styles.statusDisconnected}`}>
                {connectionStatus}
              </span>
            </p>
            <p><strong>Última atualização:</strong> {lastUpdate || '--:--'}</p>
            {lastError && (
              <p className={styles.errorText}>
                <strong>Último erro:</strong> {lastError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de cards de status */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>🌡️</span>
            <h3>Temperatura</h3>
            <span className={`${styles.statBadge} ${sensorData?.temperature > 30 ? styles.high : styles.normal}`}>
              {sensorData?.temperature > 30 ? 'Alta' : 'Normal'}
            </span>
          </div>
          <div className={styles.statValue}>
            {isLoading ? (
              <div className={styles.loading}>Conectando...</div>
            ) : (
              <>
                <span className={styles.value}>{sensorData?.temperature?.toFixed(1) || '--'}</span>
                <span className={styles.unit}>°C</span>
              </>
            )}
          </div>
          <div className={styles.statFooter}>
            Ideal: 20-30°C
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>💧</span>
            <h3>Umidade do Solo</h3>
            <span className={`${styles.statBadge} ${sensorData?.soil < 30 ? styles.low : styles.normal}`}>
              {sensorData?.soil < 30 ? 'Baixa' : 'Normal'}
            </span>
          </div>
          <div className={styles.statValue}>
            {isLoading ? (
              <div className={styles.loading}>Conectando...</div>
            ) : (
              <>
                <span className={styles.value}>{sensorData?.soil?.toFixed(0) || '--'}</span>
                <span className={styles.unit}>%</span>
              </>
            )}
          </div>
          <div className={styles.statFooter}>
            Ideal: 40-60%
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>☀️</span>
            <h3>Luminosidade</h3>
            <span className={`${styles.statBadge} ${sensorData?.light > 80 ? styles.high : styles.normal}`}>
              {sensorData?.light > 80 ? 'Alta' : 'Normal'}
            </span>
          </div>
          <div className={styles.statValue}>
            {isLoading ? (
              <div className={styles.loading}>Conectando...</div>
            ) : (
              <>
                <span className={styles.value}>{sensorData?.light?.toFixed(0) || '--'}</span>
                <span className={styles.unit}>%</span>
              </>
            )}
          </div>
          <div className={styles.statFooter}>
            Ideal: 50-80%
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>🚰</span>
            <h3>Nível da Água</h3>
            <span className={`${styles.statBadge} ${sensorData?.water < 20 ? styles.low : styles.normal}`}>
              {sensorData?.water < 20 ? 'Baixo' : 'Normal'}
            </span>
          </div>
          <div className={styles.statValue}>
            {isLoading ? (
              <div className={styles.loading}>Conectando...</div>
            ) : (
              <>
                <span className={styles.value}>{sensorData?.water?.toFixed(0) || '--'}</span>
                <span className={styles.unit}>%</span>
              </>
            )}
          </div>
          <div className={styles.statFooter}>
            Ideal: acima de 20%
          </div>
        </div>
      </div>

      {/* Seção do gráfico */}
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
              onClick={fetchSensorData} 
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

      {/* Cards de navegação */}
      <div className={styles.navigationSection}>
        <h2>🚀 Navegação Rápida</h2>
        <div className={styles.navGrid}>
          {navCards.map((card) => (
            <Link key={card.id} href={card.path} className={styles.navCard}>
              <div 
                className={styles.navCardContent}
                style={{ borderLeftColor: card.color }}
              >
                <div className={styles.navCardIcon}>{card.icon}</div>
                <h3 className={styles.navCardTitle}>{card.title}</h3>
                <p className={styles.navCardDescription}>{card.description}</p>
                <div className={styles.navCardArrow}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Informações do sistema */}
      <div className={styles.systemInfo}>
        <div className={styles.infoCard}>
          <h3>🌐 Conexão ESP32</h3>
          <p><strong>Endereço IP:</strong> {ESP32_IP}</p>
          <p><strong>Status:</strong> 
            <span className={`${connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}`}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Intervalo de atualização:</strong> 2 segundos</p>
          <p><strong>Tentativas de reconexão:</strong> Automáticas (2s)</p>
        </div>
        
        <div className={styles.infoCard}>
          <h3>📋 Informações do Sistema</h3>
          <p><strong>Usuário:</strong> {user ? user.username : 'demo_user'}</p>
          <p><strong>Sessão iniciada:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
          <p><strong>Versão:</strong> Smart Farm v2.0.0</p>
          <p><strong>Modo atual:</strong> {dataSource}</p>
        </div>
      </div>
    </div>
  );
}