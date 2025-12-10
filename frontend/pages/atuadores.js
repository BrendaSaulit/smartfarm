import { useState, useEffect, useRef } from 'react';
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
  FiPlayCircle,
  FiPauseCircle,
  FiAlertCircle,
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
  
  // Estados para modo automático
  const [autoMode, setAutoMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const processingRef = useRef(false);

  // Função para executar comando (com origem)
  const sendCmd = async (cmd, source = 'manual') => {
    if (isSendingCommand && source === 'manual') return;
    
    const result = await sendCommand(cmd);
    const timestamp = new Date().toLocaleTimeString();
    
    // Log no histórico
    const logEntry = {
      id: Date.now(),
      command: cmd,
      timestamp,
      status: result.success ? 'success' : 'error',
      error: result.error || null,
      source: source // 'manual' ou 'auto'
    };
    
    if (result.success) {
      console.log(`Comando ${source} enviado:`, cmd);
      
      setLastCommand({
        cmd,
        timestamp,
        status: 'success',
        source
      });
      
      if (source === 'auto') {
        setLocalCommandStatus(`Ação automática: ${cmd}`);
        setTimeout(() => {
          if (autoMode) setLocalCommandStatus('Modo automático ativo');
          else setLocalCommandStatus('Pronto');
        }, 2000);
      } else {
        setLocalCommandStatus('Comando enviado com sucesso!');
        setTimeout(() => {
          setLocalCommandStatus('Pronto');
        }, 2000);
      }
      
    } else {
      console.warn(`Erro ao enviar comando ${source}:`, result.error);
      
      setLastCommand({
        cmd,
        timestamp,
        status: 'error',
        source
      });
      
      setLocalCommandStatus('Erro ao enviar comando');
      setTimeout(() => {
        setLocalCommandStatus('Pronto');
      }, 3000);
    }
    
    // Adiciona ao histórico (mantém apenas últimos 20)
    setCommandHistory(prev => [logEntry, ...prev.slice(0, 19)]);
    
    return result.success;
  };

  // Função para gerar recomendações
  const getRecommendations = () => {
    if (!sensorData) return [];
    
    const recommendations = [];
    
    // Temperatura
    if (sensorData.temperature > 30) {
      recommendations.push({
        type: 'temperature_high',
        message: "Temperatura alta - Ativar ventilador",
        command: 'FAN',
        priority: 1
      });
    } else if (sensorData.temperature < 20) {
      recommendations.push({
        type: 'temperature_low',
        message: "Temperatura baixa - Aquecer ambiente",
        command: 'LED',
        priority: 1
      });
    }
    
    // Solo
    if (sensorData.soil < 30) {
      recommendations.push({
        type: 'soil_dry',
        message: "Solo seco - Ativar irrigação",
        command: 'WATER',
        priority: 2
      });
    } else if (sensorData.soil > 70) {
      recommendations.push({
        type: 'soil_wet',
        message: "Solo muito úmido - Parar irrigação",
        command: 'WATER',
        priority: 2
      });
    }
    
    // Água
    if (sensorData.water < 20) {
      recommendations.push({
        type: 'water_low',
        message: "Nível de água baixo - Verificar reservatório",
        command: null,
        priority: 3
      });
    }
    
    // Luminosidade
    const lightValue = sensorData.light_normalized || sensorData.light;
    if (lightValue < 50) {
      recommendations.push({
        type: 'light_low',
        message: "Pouca luminosidade - Ativar LEDs",
        command: 'LED',
        priority: 2
      });
    } else if (lightValue > 80) {
      recommendations.push({
        type: 'light_high',
        message: "Luminosidade excessiva - Reduzir iluminação",
        command: 'LED',
        priority: 2
      });
    }
    
    // Umidade
    if (sensorData.humidity !== undefined) {
      if (sensorData.humidity > 70) {
        recommendations.push({
          type: 'humidity_high',
          message: "Umidade alta - Ventilar ambiente",
          command: 'FAN',
          priority: 2
        });
      } else if (sensorData.humidity < 40) {
        recommendations.push({
          type: 'humidity_low',
          message: "Umidade baixa - Umidificar ambiente",
          command: null,
          priority: 3
        });
      }
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  };

  // Função para executar ação automática
  const executeAutomaticAction = async () => {
    if (!autoMode || processingRef.current || isSendingCommand) return;
    
    const recommendations = getRecommendations();
    if (recommendations.length === 0) return;
    
    // Pega a primeira recomendação com comando disponível
    const action = recommendations.find(rec => rec.command !== null);
    if (!action) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    setCurrentAction(action);
    
    try {
      // Executa o comando
      await sendCmd(action.command, 'auto');
      
      // Aguarda antes da próxima ação
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('Erro na ação automática:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  // Efeito para executar ações automáticas
  useEffect(() => {
    if (!autoMode) return;
    
    const interval = setInterval(() => {
      executeAutomaticAction();
    }, 1000); // Verifica a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [autoMode, sensorData]);

  // Toggle do modo automático
  const toggleAutoMode = () => {
    if (autoMode) {
      setAutoMode(false);
      setIsProcessing(false);
      setCurrentAction(null);
      setLocalCommandStatus('Modo automático desativado');
      
      // Log de desativação
      const logEntry = {
        id: Date.now(),
        command: 'AUTO_OFF',
        timestamp: new Date().toLocaleTimeString(),
        status: 'info',
        error: null,
        source: 'system'
      };
      setCommandHistory(prev => [logEntry, ...prev.slice(0, 19)]);
    } else {
      setAutoMode(true);
      setLocalCommandStatus('Modo automático ativado');
      
      // Log de ativação
      const logEntry = {
        id: Date.now(),
        command: 'AUTO_ON',
        timestamp: new Date().toLocaleTimeString(),
        status: 'info',
        error: null,
        source: 'system'
      };
      setCommandHistory(prev => [logEntry, ...prev.slice(0, 19)]);
    }
  };

  // Função para exibir recomendações
  const getRecommendationText = () => {
    const recommendations = getRecommendations();
    if (recommendations.length === 0) {
      return "Todos os parâmetros dentro do ideal";
    }
    
    // Filtra apenas recomendações com comando
    const actionable = recommendations.filter(r => r.command !== null);
    
    if (actionable.length === 0) {
      return recommendations.map(r => r.message).join(" | ");
    }
    
    if (autoMode) {
      return `Modo automático ativo | Próxima ação: ${actionable[0].message}`;
    }
    
    return recommendations.map(r => r.message).join(" | ");
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
      Icon: FaApple,
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
            <span className={styles.titleIcon}><FiTool /></span>
            Controle de Atuadores
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusDot} ${
              autoMode ? styles.autoMode : 
              localCommandStatus.includes('Sucesso') ? styles.connected : 
              localCommandStatus.includes('Erro') ? styles.disconnected : 
              connectionStatus === 'Conectado' ? styles.connected : styles.disconnected}`}>
            </span>
            {autoMode ? 'MODO AUTOMÁTICO' : 
             localCommandStatus !== 'Pronto' ? localCommandStatus : connectionStatus}
          </div>
          {currentAction && (
            <div className={styles.currentAction}>
              Executando: {currentAction.command}
            </div>
          )}
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
          <p><strong>Modo Automático:</strong> 
            <span className={autoMode ? styles.statusGood : styles.statusReady}>
              {autoMode ? 'ATIVADO' : 'DESATIVADO'}
            </span>
            {autoMode && isProcessing && (
              <span className={styles.processingIndicator}> (Processando...)</span>
            )}
          </p>
          <p><strong>Comandos suportados:</strong> LED, FAN, FEED, WATER</p>
          {lastError && connectionStatus !== 'Conectado' && (
            <p><strong>Último erro:</strong> <span className={styles.statusBad}>{lastError}</span></p>
          )}
        </div>
        
        {/* Controle do Modo Automático */}
        <div className={styles.autoModeControl}>
          <button 
            onClick={toggleAutoMode}
            className={`${styles.controlButton} ${autoMode ? styles.autoModeOn : styles.autoModeOff}`}
            disabled={isProcessing}
          >
            {autoMode ? (
              <>
                <FiPauseCircle style={{ marginRight: 8, fontSize: '1.2rem' }} />
                {isProcessing ? 'PROCESSANDO...' : 'DESATIVAR AUTOMÁTICO'}
              </>
            ) : (
              <>
                <FiPlayCircle style={{ marginRight: 8, fontSize: '1.2rem' }} />
                ATIVAR MODO AUTOMÁTICO
              </>
            )}
          </button>
          <p className={styles.autoModeInfo}>
            {autoMode 
              ? 'O sistema executará comandos automaticamente conforme necessário'
              : 'Ative para o sistema regular o ambiente automaticamente'}
          </p>
        </div>
      </div>

      {/* Seção de Recomendações */}
      <div className={styles.recommendationSection}>
        <div className={styles.recommendationCard}>
          <div className={styles.recommendationHeader}>
            <span className={styles.recommendationIcon}><FiCpu /></span>
            <h3>Recomendações Automáticas</h3>
            {autoMode && (
              <span className={styles.autoModeBadge}>
                ATIVO
              </span>
            )}
          </div>
          <div className={styles.recommendationContent}>
            <p>{getRecommendationText()}</p>
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
          {autoMode && <span className={styles.autoModeNote}> (Modo automático ativo - controle manual desabilitado)</span>}
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
                <span className={`${styles.actuatorStatus} ${autoMode ? styles.disabled : styles.ready}`}>
                  {autoMode ? 'AUTOMÁTICO' : 'PRONTO'}
                </span>
              </div>
              
              <p className={styles.actuatorDescription}>
                {actuator.description}
              </p>
              
              <div className={styles.actuatorActions}>
                <button 
                  onClick={() => sendCmd(actuator.cmd, 'manual')}
                  className={styles.controlButton}
                  style={{ backgroundColor: actuator.color }}
                  disabled={isSendingCommand || autoMode}
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
      <QuickControls onSend={(cmd) => sendCmd(cmd, 'manual')} isSending={isSendingCommand} disabled={autoMode} />

      {/* Histórico de Comandos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FiList /></span>
          Histórico de Comandos
        </h2>
        
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h3>Últimos Comandos Enviados</h3>
            <div className={styles.historyStats}>
              <span className={styles.statItem}>
                Automáticos: {commandHistory.filter(c => c.source === 'auto').length}
              </span>
              <span className={styles.statItem}>
                Manuais: {commandHistory.filter(c => c.source === 'manual').length}
              </span>
            </div>
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
                  <div key={item.id} className={`${styles.historyItem} ${styles[item.status]} ${styles[`source-${item.source}`]}`}>
                    <div className={styles.historyCommand}>
                      <span className={styles.historyIcon}>
                        {item.status === 'success' ? <FiCheckCircle /> : 
                         item.status === 'error' ? <FiXCircle /> :
                         <FiCpu />}
                      </span>
                      <code className={styles.historyCmd}>{item.command}</code>
                      <span className={styles.historySource}>
                        {item.source === 'auto' ? '(Auto)' : 
                         item.source === 'manual' ? '(Manual)' : 
                         item.source === 'system' ? '(Sistema)' : ''}
                      </span>
                    </div>
                    <div className={styles.historyDetails}>
                      <span className={styles.historyTime}>{item.timestamp}</span>
                      <span className={styles.historyStatus}>
                        {item.status === 'success' ? 'Enviado com sucesso' : 
                         item.status === 'error' ? `Erro: ${item.error}` :
                         item.status === 'info' ? 'Informação' : item.status}
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
          <h3><FiSettings /> Como Funciona o Modo Automático</h3>
          <p><strong>Prioridade das ações:</strong></p>
          <p>1. Temperatura (FAN/LED)</p>
          <p>2. Solo (WATER)</p>
          <p>3. Luminosidade (LED)</p>
          <p>4. Umidade (FAN)</p>
          <p><strong>Intervalo:</strong> Verifica a cada 5 segundos, executa 1 comando por vez</p>
        </div>
        <div className={styles.infoCard}>
          <h3><FiCpu /> Detalhes Técnicos</h3>
          <p><strong>Comandos:</strong> LED, FAN, WATER</p>
          <p><strong>Formato:</strong> HTTP GET /actuator?cmd=COMANDO</p>
          <p><strong>Resposta:</strong> OK:COMANDO=ON/OFF</p>
          <p><strong>Histórico:</strong> Mantém últimos 20 comandos</p>
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