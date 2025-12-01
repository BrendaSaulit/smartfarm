const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const db = require('./db/sqlite');
const authRoutes = require('./routes/auth');
const sensorsRoutes = require('./routes/sensors');
const actuatorsRoutes = require('./routes/actuators');

const app = express();
app.use(cors());
app.use(express.json());

// Config: IP do ESP32
const ESP32_BASE = process.env.ESP32_BASE || 'http://10.106.33.1';

// Mount routes (passamos o ESP32_BASE para o módulo)
app.use('/auth', authRoutes);
app.use('/api/sensors', sensorsRoutes(ESP32_BASE));
app.use('/api/actuator', actuatorsRoutes(ESP32_BASE));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));