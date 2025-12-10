// backend/mock-esp32-server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002; // Porta diferente do backend principal (3001)

app.use(cors());
app.use(express.json());

// ==================== ESTADO DO ESP32 SIMULADO ====================
let esp32State = {
  // Sensores (valores base)
  sensors: {
    temperature: 25.0,
    humidity: 60,
    steam: 15,
    soil: 45,
    light: 1500, // Valor RAW para simular sensor real
    water: 50
  },
  
  // Atuadores
  actuators: {
    LED: 'OFF',
    WATER: 'OFF',
    FAN: 'OFF',
    FEED: 'OFF'
  },
  
  // Configurações
  config: {
    light_calibration: 4095, // Máximo do sensor
    update_interval: 2000,
    version: 'ESP32-MOCK-v1.0'
  }
};

// Controle de cenário
let currentScenario = null;
let useRandomData = true; // Começa com dados randômicos

// ==================== FUNÇÕES AUXILIARES ====================
function normalizeLight(raw) {
  // Simula exatamente o que o ESP32 real faz
  let light = Math.pow(raw / esp32State.config.light_calibration, 0.6) * 100.0;
  light = Math.round(light / 10) * 10;
  return Math.min(100, Math.max(0, light));
}

function generateRandomSensorData() {
  // Gera dados randômicos realistas
  const baseValues = {
    temperature: 20 + Math.random() * 15, // 20-35°C
    humidity: 30 + Math.random() * 50, // 30-80%
    steam: 10 + Math.random() * 15, // 10-25
    soil: 20 + Math.random() * 60, // 20-80%
    light: 100 + Math.random() * 1900, // 100-2000 RAW
    water: 20 + Math.random() * 70 // 20-90%
  };
  
  // Adiciona um pouco de variação natural (drift)
  return {
    temperature: Math.round((baseValues.temperature + (Math.random() - 0.5) * 2) * 10) / 10,
    humidity: Math.round(baseValues.humidity + (Math.random() - 0.5) * 5),
    steam: Math.round(baseValues.steam + (Math.random() - 0.5) * 3),
    soil: Math.round(baseValues.soil + (Math.random() - 0.5) * 10),
    light: Math.round(baseValues.light),
    water: Math.round(baseValues.water + (Math.random() - 0.5) * 5)
  };
}

function generateSensorData() {
  if (useRandomData) {
    // Se estiver em modo randômico, gera dados aleatórios
    const randomData = generateRandomSensorData();
    
    // Atualiza o estado com os dados randômicos (para manter consistência)
    esp32State.sensors = { ...esp32State.sensors, ...randomData };
    
    return randomData;
  } else {
    // Se estiver em cenário, retorna os dados exatos do estado
    return {
      temperature: esp32State.sensors.temperature,
      humidity: esp32State.sensors.humidity,
      steam: esp32State.sensors.steam,
      soil: esp32State.sensors.soil,
      light: esp32State.sensors.light,
      water: esp32State.sensors.water
    };
  }
}

// ==================== ENDPOINTS IDÊNTICOS AO ESP32 REAL ====================

// GET /sensors - Exatamente igual ao ESP32 real
app.get('/sensors', (req, res) => {
  console.log(`[MOCK ESP32] ${new Date().toLocaleTimeString()} - GET /sensors (modo: ${useRandomData ? 'RANDÔMICO' : 'CENÁRIO: ' + currentScenario})`);
  
  const sensorData = generateSensorData();
  
  // Retorna RAW light (igual ESP32) e também normalized para facilitar
  const response = {
    ...sensorData,
    light_normalized: normalizeLight(sensorData.light)
  };
  
  // Simula latência de rede (50-150ms)
  setTimeout(() => {
    res.json(response);
  }, 50 + Math.random() * 100);
});

// GET /actuator - Exatamente igual ao ESP32 real
app.get('/actuator', (req, res) => {
  const { cmd, value } = req.query;
  
  console.log(`[MOCK ESP32] ${new Date().toLocaleTimeString()} - GET /actuator?cmd=${cmd}&value=${value || ''}`);
  
  if (!cmd) {
    return res.status(400).send('ERRO: Parâmetro "cmd" é obrigatório');
  }
  
  const command = cmd.toUpperCase();
  
  // Verifica se é um atuador válido
  if (!esp32State.actuators.hasOwnProperty(command)) {
    return res.status(400).send(`ERRO: Comando "${command}" não reconhecido`);
  }
  
  // Processa o comando
  if (value) {
    esp32State.actuators[command] = value.toUpperCase();
  } else {
    // Toggle se não especificar valor
    esp32State.actuators[command] = esp32State.actuators[command] === 'ON' ? 'OFF' : 'ON';
  }
  
  // Simula resposta do ESP32
  const response = `OK:${command}=${esp32State.actuators[command]}`;
  
  // Log do estado atualizado
  console.log(`[MOCK ESP32] Estado atual:`, esp32State.actuators);
  
  setTimeout(() => {
    res.send(response);
  }, 100);
});

// ==================== ENDPOINTS DE CONTROLE (DEV ONLY) ====================

// GET /dev/state - Ver estado completo
app.get('/dev/state', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    mode: useRandomData ? 'random' : 'scenario',
    scenario: currentScenario,
    state: esp32State,
    endpoints: {
      real: '/sensors, /actuator',
      dev: '/dev/state, /dev/set, /dev/scenario/*, /dev/control/*, /dev/reset'
    }
  });
});

// POST /dev/set - Alterar valores específicos
app.post('/dev/set', (req, res) => {
  const { sensors, actuators } = req.body;
  
  if (sensors) {
    esp32State.sensors = { ...esp32State.sensors, ...sensors };
    // Ao definir valores manualmente, desativa modo randômico
    useRandomData = false;
    currentScenario = 'custom';
  }
  
  if (actuators) {
    esp32State.actuators = { ...esp32State.actuators, ...actuators };
  }
  
  res.json({
    success: true,
    message: 'Estado atualizado',
    mode: useRandomData ? 'random' : 'scenario',
    scenario: currentScenario,
    state: esp32State
  });
});

// POST /dev/scenario/:name - Cenários predefinidos
app.post('/dev/scenario/:name', (req, res) => {
  const scenarios = {
    normal: { temperature: 25, humidity: 60, soil: 45, light: 1500, water: 50 },
    hot_day: { temperature: 35, humidity: 40, soil: 30, light: 1200, water: 30 },
    cold_night: { temperature: 15, humidity: 80, soil: 70, light: 50, water: 70 },
    dry_soil: { temperature: 28, humidity: 35, soil: 20, light: 900, water: 20 },
    flood: { temperature: 22, humidity: 85, soil: 80, light: 300, water: 90 },
    greenhouse: { temperature: 28, humidity: 75, soil: 60, light: 800, water: 60 },
    test_min: { temperature: 10, humidity: 10, soil: 10, light: 100, water: 10 },
    test_max: { temperature: 40, humidity: 90, soil: 90, light: 2000, water: 90 }
  };
  
  const scenarioName = req.params.name;
  
  if (!scenarios[scenarioName]) {
    return res.status(404).json({
      success: false,
      error: `Cenário "${scenarioName}" não encontrado`,
      available: Object.keys(scenarios)
    });
  }
  
  // Aplica o cenário e desativa modo randômico
  esp32State.sensors = { ...esp32State.sensors, ...scenarios[scenarioName] };
  useRandomData = false;
  currentScenario = scenarioName;
  
  res.json({
    success: true,
    scenario: scenarioName,
    mode: 'scenario',
    message: `Cenário "${scenarioName}" aplicado (modo randômico desativado)`,
    sensors: esp32State.sensors
  });
});

// GET /dev/reset - Reset para modo randômico
app.get('/dev/reset', (req, res) => {
  useRandomData = true;
  currentScenario = null;
  
  res.json({
    success: true,
    message: 'Modo randômico ativado',
    mode: 'random',
    scenario: null
  });
});

// GET /dev/control/mode/:mode - Alternar entre random/scenario
app.get('/dev/control/mode/:mode', (req, res) => {
  const { mode } = req.params;
  
  if (mode === 'random') {
    useRandomData = true;
    currentScenario = null;
    res.json({
      success: true,
      message: 'Modo randômico ativado',
      mode: 'random'
    });
  } else if (mode === 'scenario') {
    useRandomData = false;
    res.json({
      success: true,
      message: 'Modo cenário ativado',
      mode: 'scenario',
      scenario: currentScenario || 'none'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Modo inválido. Use "random" ou "scenario"'
    });
  }
});

// GET /dev/control/connection/:status - Simular perda de conexão
app.get('/dev/control/connection/:status', (req, res) => {
  const { status } = req.params;
  
  if (status === 'fail') {
    // Simula timeout
    setTimeout(() => {
      res.status(504).send('Timeout: ESP32 não respondeu');
    }, 5000);
  } else if (status === 'slow') {
    // Simula resposta lenta
    setTimeout(() => {
      res.json(generateSensorData());
    }, 3000);
  } else {
    // Normal
    setTimeout(() => {
      res.json(generateSensorData());
    }, 100);
  }
});

// ==================== INICIALIZAÇÃO ====================
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MOCK ESP32 SERVER INICIADO');
  console.log('='.repeat(60));
  console.log(`📍 Endereço: http://localhost:${PORT}`);
  console.log(`📡 Porta: ${PORT}`);
  console.log('');
  console.log('🌐 ENDPOINTS PRINCIPAIS (compatíveis com ESP32 real):');
  console.log(`   GET  http://localhost:${PORT}/sensors`);
  console.log(`   GET  http://localhost:${PORT}/actuator?cmd=LED&value=ON`);
  console.log('');
  console.log('🔧 ENDPOINTS DE DESENVOLVIMENTO:');
  console.log(`   GET  http://localhost:${PORT}/dev/state`);
  console.log(`   POST http://localhost:${PORT}/dev/set`);
  console.log(`   POST http://localhost:${PORT}/dev/scenario/{nome}`);
  console.log(`   GET  http://localhost:${PORT}/dev/reset`);
  console.log(`   GET  http://localhost:${PORT}/dev/control/mode/{random|scenario}`);
  console.log(`   GET  http://localhost:${PORT}/dev/control/connection/{fail|slow|normal}`);
  console.log('');
  console.log('🎲 MODO INICIAL: DADOS RANDÔMICOS');
  console.log('   Para definir cenário específico:');
  console.log(`   POST http://localhost:${PORT}/dev/scenario/hot_day`);
  console.log('');
  console.log('💡 Dica: Para usar, altere ESP32_IP no provider para:');
  console.log(`       const ESP32_IP = "http://localhost:${PORT}"`);
  console.log('='.repeat(60));
});

// Export para testes
module.exports = app;