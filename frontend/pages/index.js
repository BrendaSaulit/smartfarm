import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import LineChart from '../components/LineChart';
import styles from '../styles/home.module.css';
import { useESP32 } from '../contexts/ESP32Context';
import {
  FiPower,
  FiRefreshCw,
  FiThermometer,
  FiLayers,
  FiSun,
  FiDroplet,
  FiActivity,
  FiTool,
  FiBarChart2,
  FiFileText,
  FiNavigation,
  FiGlobe, // adicionado
  FiInfo,  // adicionado
} from 'react-icons/fi';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Redireciona para login se não estiver logado
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  // Usando o contexto ESP32 - TODO O FALLBACK ESTÁ AQUI!
  const { 
    sensorData,            // Dados reais OU simulados (fallback)
    sensorHistory,         // Histórico real OU simulado
    connectionStatus,      // 'Conectado' OU 'Desconectado'
    dataSource,           // 'ESP32 (Real)' OU 'Simulação (Demo)'
    lastUpdate,           // Timestamp da última atualização
    lastError,            // Último erro (se houver)
    isLoading,            // Estado de loading
    fetchSensorData,      // Função para atualização manual
    config                // Configuração (inclui ESP32_IP)
  } = useESP32();

  // Funções auxiliares simplificadas
  const getTemperatureStatus = (temp) => {
    if (!temp) return 'normal';
    if (temp > 30) return 'high';
    if (temp < 20) return 'low';
    return 'normal';
  };

  const getSoilStatus = (soil) => {
    if (!soil) return 'normal';
    if (soil > 60) return 'high';
    if (soil < 40) return 'low';
    return 'normal';
  };

  const getLightStatus = (light) => {
    if (!light) return 'normal';
    if (light > 80) return 'high';
    if (light < 50) return 'low';
    return 'normal';
  };

  const getWaterStatus = (water) => {
    if (!water) return 'normal';
    if (water < 20) return 'low';
    return 'normal';
  };

  // Cards de navegação (mantendo igual)
  const navCards = [
    { id: 1, title: 'Sensores',    path: '/sensores',    Icon: FiActivity,  description: 'Monitoramento detalhado de todos os sensores', color: '#ff6b6b' },
    { id: 2, title: 'Atuadores',   path: '/atuadores',   Icon: FiTool,      description: 'Controle de dispositivos e automação',         color: '#4ecdc4' },
    { id: 3, title: 'Indicadores', path: '/indicadores', Icon: FiBarChart2, description: 'Métricas e análises avançadas',                color: '#45b7d1' },
    { id: 4, title: 'Logs',        path: '/logs',        Icon: FiFileText,  description: 'Histórico de eventos e atividades',            color: '#96ceb4' },
  ];

  // Prepara dados para o gráfico (mantendo igual)
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
      {/* Cabeçalho - mantendo igual */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🌱</span>
          Dashboard Smart Farm
        </h1>
      </div>

      {/* Indicador de Modo de Operação - mantendo igual */}
      <div className={styles.modeIndicator}>
        <div className={`${styles.modeCard} ${dataSource === 'ESP32 (Real)' ? styles.modeReal : styles.modeSimulated}`}>
          <div className={styles.modeHeader}>
            <span className={styles.modeIcon}>
              {dataSource === 'ESP32 (Real)' ? <FiPower /> : <FiRefreshCw />}
            </span>
            <h3>Modo de Operação</h3>
            <span className={styles.modeBadge}>
              {dataSource === 'ESP32 (Real)' ? 'REAL' : 'DEMO'}
            </span>
          </div>
          <div className={styles.modeDetails}>
            <p><strong>Fonte de dados:</strong> {dataSource}</p>
            <p><strong>Status da conexão:</strong> 
              <span className={`${styles.statusText} ${connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}`}>
                {connectionStatus}
              </span>
            </p>
            <p><strong>Última atualização:</strong> {lastUpdate || '--:--'}</p>
            {lastError && connectionStatus != 'Conectado' && (
              <p className={styles.errorText}>
                <strong>Último erro:</strong> {lastError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de cards de status - VOLTANDO AO ESTILO ORIGINAL */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}><FiThermometer /></span>
            <h3>Temperatura</h3>
            <span className={`${styles.statBadge} ${
              getTemperatureStatus(sensorData?.temperature) === 'high' ? styles.high : 
              getTemperatureStatus(sensorData?.temperature) === 'low' ? styles.low : 
              styles.normal
            }`}>
              {getTemperatureStatus(sensorData?.temperature) === 'high' ? 'Alta' : 
               getTemperatureStatus(sensorData?.temperature) === 'low' ? 'Baixa' : 
               'Normal'}
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
            <span className={styles.statIcon}><FiLayers /></span>
            <h3>Umidade do Solo</h3>
            <span className={`${styles.statBadge} ${
              getSoilStatus(sensorData?.soil) === 'high' ? styles.high : 
              getSoilStatus(sensorData?.soil) === 'low' ? styles.low : 
              styles.normal
            }`}>
              {getSoilStatus(sensorData?.soil) === 'high' ? 'Alta' : 
               getSoilStatus(sensorData?.soil) === 'low' ? 'Baixa' : 
               'Normal'}
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
            <span className={styles.statIcon}><FiSun /></span>
            <h3>Luminosidade</h3>
            <span className={`${styles.statBadge} ${
              getLightStatus(sensorData?.light) === 'high' ? styles.high : 
              getLightStatus(sensorData?.light) === 'low' ? styles.low : 
              styles.normal
            }`}>
              {getLightStatus(sensorData?.light) === 'high' ? 'Alta' : 
               getLightStatus(sensorData?.light) === 'low' ? 'Baixa' : 
               'Normal'}
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
            <span className={styles.statIcon}><FiDroplet /></span>
            <h3>Nível da Água</h3>
            <span className={`${styles.statBadge} ${
              getWaterStatus(sensorData?.water) === 'low' ? styles.low : styles.normal
            }`}>
              {getWaterStatus(sensorData?.water) === 'low' ? 'Baixo' : 'Normal'}
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

      {/* Seção do gráfico - mantendo igual */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h2>📈 Evolução Temporal dos Sensores</h2>
          <div className={styles.chartControls}>
            <span className={styles.chartInfo}>
              {dataSource === 'ESP32 (Real)' 
                ? 'Dados em tempo real do ESP32 | Atualização: 2s' 
                : 'Dados simulados para demonstração | Atualização: 2s'}
            </span>
          </div>
        </div>
        
        <div className={styles.chartContainer}>
          {sensorHistory.length > 0 ? (
            <LineChart data={chartData} />
          ) : (
            <div className={styles.noData}>
              <div className={styles.noDataIcon}>📊</div>
              <h3>Aguardando dados do ESP32...</h3>
              <p>Conectando ao ESP32 em {config?.ip}</p>
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

      {/* Cards de navegação - mantendo igual */}
      <div className={styles.navigationSection}>
        <h2><FiNavigation /> Navegação Rápida</h2>
        <div className={styles.navGrid}>
          {navCards.map((card) => (
            <Link key={card.id} href={card.path} className={styles.navCard}>
              <div 
                className={styles.navCardContent}
                style={{ borderLeftColor: card.color }}
              >
                <div className={styles.navCardIcon}>{card.Icon ? <card.Icon /> : null}</div>
                <h3 className={styles.navCardTitle}>{card.title}</h3>
                <p className={styles.navCardDescription}>{card.description}</p>
                <div className={styles.navCardArrow}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Informações do sistema - ajustando para usar config?.ip */}
      <div className={styles.systemInfo}>
        <div className={styles.infoCard}>
          <h3><FiGlobe /> Conexão ESP32</h3>
          <p><strong>Endereço IP:</strong> {config?.ip}</p>
          <p><strong>Status:</strong> 
            <span className={`${connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}`}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Intervalo de atualização:</strong> 2 segundos</p>
        </div>
        
        <div className={styles.infoCard}>
          <h3><FiInfo /> Informações do Sistema</h3>
          <p><strong>Usuário:</strong> {user ? user.username : 'demo_user'}</p>
          <p><strong>Sessão iniciada:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
          <p><strong>Versão:</strong> Smart Farm v1.0.0</p>
          <p><strong>Modo atual:</strong> {dataSource}</p>
        </div>
      </div>
    </div>
  );
}