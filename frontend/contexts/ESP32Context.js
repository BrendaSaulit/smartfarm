import { createContext, useContext } from 'react';

// Configuração do ESP32 (mantendo consistência)
const ESP32_IP = "http://localhost:3002"; // Padrão para mock, pode ser sobrescrito

// Estrutura do contexto
const ESP32Context = createContext({
  // Dados dos sensores
  sensorData: null,
  
  // Status e controle
  connectionStatus: 'Conectando...',
  dataSource: 'ESP32 (Real)',
  lastUpdate: null,
  lastError: null,
  
  // Estados de loading
  isLoading: true,
  isSendingCommand: false,
  
  // Histórico para gráficos
  sensorHistory: [],
  
  // Funções
  fetchSensorData: async () => {},
  sendCommand: async (cmd) => {},
  clearError: () => {},
  
  // Configuração
  config: {
    ip: ESP32_IP,
    updateInterval: 2000, // 2 segundos
    timeout: 3000, // 3 segundos timeout
    maxHistory: 20 // máximo de pontos no histórico
  }
});

// Hook customizado para usar o contexto
export const useESP32 = () => {
  const context = useContext(ESP32Context);
  
  if (context === undefined) {
    throw new Error('useESP32 deve ser usado dentro de um ESP32Provider');
  }
  
  return context;
};

export default ESP32Context;