import { useState, useEffect, useCallback, useRef} from 'react';
import ESP32Context from './ESP32Context';

const ESP32_IP = "http://localhost:3002";

export default function ESP32Provider({ children }) {
  // Estado principal
  const [sensorData, setSensorData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [dataSource, setDataSource] = useState('ESP32 (Real)');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const [isSendingCommand, setIsSendingCommand] = useState(false);

  // Função para normalizar luminosidade
  const normalizeLight = (raw) => {
    let light = Math.pow(raw / 4095.0, 0.6) * 100.0;
    light = Math.round(light / 10) * 10;
    return Math.min(100, Math.max(0, light));
  };

  // Função principal para buscar dados do ESP32
  const fetchSensorData = useCallback(async () => {
    try {
      
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true); 
      }
      
      
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

      if (lastError) {
        setLastError(null);
      }
      
      // Validação básica dos dados
      if (!data || typeof data !== 'object') {
        throw new Error('Dados recebidos em formato inválido');
      }
      
      // Normaliza a luminosidade (se necessário)
      if (data.light !== undefined) {
        data.light = normalizeLight(data.light);
      }
      
      // Atualiza estados
      setSensorData(data);
      setConnectionStatus('Conectado');
      setDataSource('ESP32 (Real)');
      
      // Atualiza histórico (mantém últimos 20 pontos)
      setSensorHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          steam: data.steam || 0,
          soil: data.soil || 0,
          light: data.light || 0,
          water: data.water || 0
        }];
        
        return newHistory.slice(-20);
      });
      
      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Erro ao buscar dados do ESP32:', error);
      setConnectionStatus('Desconectado');
      setDataSource('Simulação (Demo)');
      if (error.message !== lastError) {
        setLastError(error.message);
      }
      
      // Dados simulados para demonstração
      const simulatedData = {
        temperature: 25.3 + (Math.random() * 2 - 1),
        humidity: 60 + (Math.random() * 10 - 5),
        steam: 15 + (Math.random() * 10 - 5),
        soil: 45 + (Math.random() * 20 - 10),
        light: 70 + (Math.random() * 30 - 15),
        water: 30 + (Math.random() * 40 - 20)
      };
      
      setSensorData(simulatedData);
      
      // Atualiza histórico mesmo em modo simulação
      setSensorHistory(prev => {
        const newHistory = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          temperature: simulatedData.temperature,
          humidity: simulatedData.humidity,
          steam: simulatedData.steam,
          soil: simulatedData.soil,
          light: simulatedData.light,
          water: simulatedData.water
        }];
        
        return newHistory.slice(-20);
      });
      
      setLastUpdate(new Date().toLocaleTimeString());
      
    } finally {

      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
      }
      setIsLoading(false);
    }
  }, []);

  // Função para enviar comandos aos atuadores
  const sendCommand = useCallback(async (cmd) => {
    if (isSendingCommand) return { success: false, error: 'Já está enviando um comando' };
    
    setIsSendingCommand(true);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);
      
      await fetch(`${ESP32_IP}/actuator?cmd=${cmd}`, {
        signal: controller.signal 
      });
      
      clearTimeout(timeout);
      
      console.log("Comando enviado com sucesso:", cmd);
      return { success: true, command: cmd };
      
    } catch (error) {
      console.warn("Erro ao enviar comando:", error);
      return { 
        success: false, 
        command: cmd, 
        error: error.message || 'Falha na comunicação'
      };
      
    } finally {
      setIsSendingCommand(false);
    }
  }, [isSendingCommand]);

  // Função para limpar erros
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Configura atualização periódica
  useEffect(() => {
    // Busca dados inicial
    fetchSensorData();
    
    // Configura intervalo de atualização
    const intervalId = setInterval(fetchSensorData, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchSensorData]);

  // Valor do contexto
  const contextValue = {
    // Dados
    sensorData,
    sensorHistory,
    
    // Status
    connectionStatus,
    dataSource,
    lastUpdate,
    lastError,
    
    // Estados
    isLoading,
    isSendingCommand,
    
    // Funções
    fetchSensorData,
    sendCommand,
    clearError,
    
    // Configuração
    config: {
      ip: ESP32_IP,
      updateInterval: 2000,
      timeout: 3000,
      maxHistory: 20
    }
  };

  return (
    <ESP32Context.Provider value={contextValue}>
      {children}
    </ESP32Context.Provider>
  );
}