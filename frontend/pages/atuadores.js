import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useESP32 } from '../contexts/ESP32Context';
import styles from '../styles/atuadores.module.css';
import QuickControls from '../components/QuickControls';
import {
  FiTool,
  FiGlobe,
  FiCpu,
  FiThermometer,
  FiLayers,
  FiDroplet,
  FiSun,
  FiWind,
  FiZap,
  FiList,
  FiCheckCircle,
  FiXCircle,
  FiTrash,
  FiInbox,
  FiSettings,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import { FaApple } from 'react-icons/fa';

export default function Atuador() {
  const router = useRouter();
  
  const {
    sensorData,
    connectionStatus,
    lastError,
    config,
    sendCommand,
    isSendingCommand,
    lastUpdate
  } = useESP32();

  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [localCommandStatus, setLocalCommandStatus] = useState('Pronto');

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
      
      setCommandHistory(prev => [
        {
          id: Date.now(),
          command: cmd,
          timestamp,
          status: 'success'
        },
        ...prev.slice(0, 9)
      ]);
      
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
      
      setCommandHistory(prev => [
        {
          id: Date.now(),
          command: cmd,
          timestamp,
          status: 'error',
          error: result.error || 'Falha na comunicação'
        },
        ...prev.slice(0, 9)
      ]);
      
      setLocalCommandStatus('Erro ao enviar comando');
      
      setTimeout(() => {
        setLocalCommandStatus('Pronto');
      }, 3000);
    }
  };

  const actuators = [
    { 
      id: 'LED', 
      name: 'Controle de LED', 
      description: 'Liga/Desliga LEDs da estufa',
      Icon: FiSun, 
      color: '#ffd166',
      cmd: 'LED'
    },
    { 
      id: 'FAN', 
      name: 'Ventilador', 
      description: 'Controle do sistema de ventilação',
      Icon: FiWind, 
      color: '#4ecdc4',
      cmd: 'FAN'
    },
    { 
      id: 'FEED', 
      name: 'Sistema de Alimentação', 
      description: 'Aciona o dispensador de ração',
      Icon: FaApple, // ← Trocado para FaApple
      color: '#06d6a0',
      cmd: 'FEED'
    },
    { 
      id: 'WATER', 
      name: 'Sistema de Irrigação', 
      description: 'Aciona a bomba de água',
      Icon: FiDroplet, 
      color: '#118ab2',
      cmd: 'WATER'
    },
    { 
      id: 'AUTO', 
      name: 'Modo Automático', 
      description: 'Ativa o modo automático',
      Icon: FiCpu, 
      color: '#9d4edd',
      cmd: 'AUTO'
    }
  ];

  const getRecommendation = () => {
    if (!sensorData) return "Aguardando dados dos sensores...";
    
    const recommendations = [];
    
    if (sensorData.temperature > 28) {
      recommendations.push("Temperatura alta - Ativar ventilador");
    } else if (sensorData.temperature < 20) {
      recommendations.push("Temperatura baixa - Aquecer ambiente");
    }
    
    if (sensorData.soil < 30) {
      recommendations.push("Solo seco - Ativar irrigação");
    } else if (sensorData.soil > 70) {
      recommendations.push("Solo muito úmido - Parar irrigação");
    }
    
    if (sensorData.water < 20) {
      recommendations.push("Nível de água baixo - Verificar reservatório");
    }
    
    const lightValue = sensorData.light_normalized || sensorData.light;
    if (lightValue < 30) {
      recommendations.push("Pouca luminosidade - Ativar LEDs");
    } else if (lightValue > 80) {
      recommendations.push("Luminosidade excessiva - Reduzir iluminação");
    }
    
    if (sensorData.humidity !== undefined) {
      if (sensorData.humidity > 70) {
        recommendations.push("Umidade alta - Ventilar ambiente");
      } else if (sensorData.humidity < 40) {
        recommendations.push("Umidade baixa - Umidificar ambiente");
      }
    }
    
    return recommendations.length > 0 
      ? recommendations.join(" | ")
      : "Todos os parâmetros dentro do ideal";
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
            <span className={styles.titleIcon}><FiTool /></span>
            Controle de Atuadores
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${
              localCommandStatus.includes('Sucesso') ? styles.connected : 
              localCommandStatus.includes('Erro') ? styles.disconnected : 
              connectionStatus === 'Conectado' ? styles.connected : styles.disconnected}`}>
            </span>
              {localCommandStatus !== 'Pronto' ? localCommandStatus : connectionStatus}
          </div>
          <div className={styles.lastUpdate}>
            {lastCommand ? `Último comando: ${lastCommand.cmd}` : 'Nenhum comando enviado'}
            {lastUpdate && ` | Última Atualização: ${lastUpdate}`}
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className={styles.connectionCard}>
        <div className={styles.connectionInfo}>
          <h3><FiGlobe /> Controle do ESP32</h3>
          <p><strong>Endereço IP:</strong> {config?.ip}</p>
          <p><strong>Status ESP32:</strong> 
            <span className={connectionStatus === 'Conectado' ? styles.statusGood : styles.statusBad}>
              {connectionStatus}
            </span>
          </p>
          <p><strong>Comandos suportados:</strong> LED, FAN, FEED, WATER</p>
          {lastError && connectionStatus !== 'Conectado' && (
            <p><strong>Último erro:</strong> <span className={styles.statusBad}>{lastError}</span></p>
          )}
        </div>
      </div>

      {/* Seção de Recomendações */}
      <div className={styles.recommendationSection}>
        <div className={styles.recommendationCard}>
          <div className={styles.recommendationHeader}>
            <span className={styles.recommendationIcon}><FiCpu /></span>
            <h3>Recomendações Automáticas</h3>
          </div>
          <div className={styles.recommendationContent}>
            <p>{getRecommendation()}</p>
            <div className={styles.sensorStatus}>
              <span className={styles.sensorStatusItem}>
                <FiThermometer /> {sensorData?.temperature?.toFixed(1) || '--'}°C
              </span>
              <span className={styles.sensorStatusItem}>
                <FiLayers /> {sensorData?.soil?.toFixed(0) || '--'}%
              </span>
              <span className={styles.sensorStatusItem}>
                <FiDroplet /> {sensorData?.water?.toFixed(0) || '--'}%
              </span>
              <span className={styles.sensorStatusItem}>
                <FiSun /> {(sensorData?.light_normalized || sensorData?.light)?.toFixed(0) || '--'}%
              </span>
              {sensorData?.humidity !== undefined && (
                <span className={styles.sensorStatusItem}>
                  <FiWind /> {sensorData.humidity.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Atuadores */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FiZap /></span>
          Controle Manual dos Atuadores
        </h2>
        <p className={styles.sectionDescription}>
          Clique em qualquer atuador para enviar o comando correspondente ao ESP32.
        </p>
        
        <div className={styles.actuatorsGrid}>
          {actuators.map((actuator) => (
            <div key={actuator.id} className={styles.actuatorCard}>
              <div 
                className={styles.actuatorHeader}
                style={{ borderLeftColor: actuator.color }}
              >
                <div className={styles.actuatorIcon}>{actuator.Icon ? <actuator.Icon /> : null}</div>
                <div className={styles.actuatorInfo}>
                  <h3 className={styles.actuatorName}>{actuator.name}</h3>
                  <span className={styles.actuatorCmd}>
                    Comando: <code>{actuator.cmd}</code>
                  </span>
                </div>
                <span className={`${styles.actuatorStatus} ${styles.ready}`}>
                  {isSendingCommand ? 'ENVIANDO...' : 'PRONTO'}
                </span>
              </div>
              
              <p className={styles.actuatorDescription}>
                {actuator.description}
              </p>
              
              <div className={styles.actuatorActions}>
                <button 
                  onClick={() => sendCmd(actuator.cmd)}
                  className={styles.controlButton}
                  style={{ backgroundColor: actuator.color }}
                  disabled={isSendingCommand}
                >
                  {isSendingCommand ? 'Enviando...' : 'Executar Comando'}
                </button>
              </div>
              
              <div className={styles.actuatorFooter}>
                <span className={styles.actuatorId}>
                  ID: {actuator.id}
                </span>
                <span className={styles.actuatorEndpoint}>
                  GET /actuator?cmd={actuator.cmd}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles Rápidos */}
      <QuickControls onSend={sendCmd} isSending={isSendingCommand} />

      {/* Histórico de Comandos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FiList /></span>
          Histórico de Comandos
        </h2>
        
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h3>Últimos Comandos Enviados</h3>
            <button 
              onClick={() => setCommandHistory([])}
              className={styles.clearButton}
            >
              <FiTrash style={{ marginRight: 6 }} /> Limpar Histórico
            </button>
          </div>
          
          <div className={styles.historyContent}>
            {commandHistory.length > 0 ? (
              <div className={styles.historyList}>
                {commandHistory.map((item) => (
                  <div key={item.id} className={`${styles.historyItem} ${styles[item.status]}`}>
                    <div className={styles.historyCommand}>
                      <span className={styles.historyIcon}>
                        {item.status === 'success' ? <FiCheckCircle /> : <FiXCircle />}
                      </span>
                      <code className={styles.historyCmd}>{item.command}</code>
                    </div>
                    <div className={styles.historyDetails}>
                      <span className={styles.historyTime}>{item.timestamp}</span>
                      <span className={styles.historyStatus}>
                        {item.status === 'success' ? 'Enviado com sucesso' : `Erro: ${item.error}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noHistory}>
                <div className={styles.noHistoryIcon}><FiInbox /></div>
                <h3>Nenhum comando enviado ainda</h3>
                <p>Os comandos enviados aparecerão aqui</p>
              </div>
            )}
          </div>
          
          <div className={styles.historyInfo}>
            <p><strong>Total de comandos:</strong> {commandHistory.length}</p>
            <p><strong>Último comando:</strong> {lastCommand ? `${lastCommand.cmd} às ${lastCommand.timestamp}` : 'Nenhum'}</p>
            <p><strong>Taxa de sucesso:</strong> {
              commandHistory.length > 0 
                ? `${Math.round(
                    (commandHistory.filter(c => c.status === 'success').length / commandHistory.length) * 100
                  )}%`
                : '0%'
            }</p>
          </div>
        </div>
      </div>

      {/* Informações Técnicas */}
      <div className={styles.infoSection}>
        <div className={styles.infoCard}>
          <h3><FiSettings /> Como Funciona</h3>
          <p>1. Cada botão envia um comando HTTP GET para o ESP32</p>
          <p>2. O ESP32 processa o comando e aciona o atuador correspondente</p>
          <p>3. O sistema aguarda confirmação da execução</p>
          <p>4. O histórico mantém registro de todos os comandos</p>
        </div>
      </div>

      {/* Navegação */}
      <div className={styles.navigation}>
        <Link href="/sensores" className={styles.navButton}>
          <span className={styles.navIcon}><FiArrowLeft /></span>
          Sensores
        </Link>
        <Link href="/indicadores" className={styles.navButton}>
          Indicadores
          <span className={styles.navIcon}><FiArrowRight /></span>
        </Link>
      </div>
    </div>
  );
}