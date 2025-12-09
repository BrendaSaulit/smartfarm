require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./config/database');
const { runInitialMigration } = require('../db/migrations');
const { seedDatabase } = require('./utils/seed'); // SOMENTE DEV
const Users = require('../db/models/users');

// Controllers - CORRIGIR AQUI! Adicionar src/
const AuthController = require('./controllers/auth'); // ← ADICIONAR src/

const app = express();
const PORT = process.env.PORT || 3001; // Use porta 3002 para não conflitar com v1
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rota de boas-vindas
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Smart Farm API v2 (Estrutura Organizada)',
    version: '2.0.0',
    environment: NODE_ENV,
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        signup: 'POST /api/auth/signup',
        verify: 'POST /api/auth/verify'
      },
      dashboard: 'GET /api/dashboard (protected)'
    }
  });
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend Smart Farm Online',
    timestamp: new Date().toISOString()
  });
});

// Rotas de autenticação
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/signup', AuthController.signup);
app.post('/api/auth/verify', AuthController.verify);

// Rota protegida de exemplo
app.get('/api/dashboard', (req, res) => {
  // TODO: Implementar middleware de autenticação
  res.json({ 
    success: true,
    message: 'Dashboard protegido',
    data: {
      sensores: 5,
      atuadores: 3,
      ultimaLeitura: new Date().toISOString()
    }
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Backend v2...');
    
    // 1. Conectar ao banco
    await connectDatabase();
    
    // 2. Executar migration INICIAL (só se tabela não existir) 
    const tableWasCreated = await runInitialMigration();
    
    // 3. Seed APENAS se for desenvolvimento E tabela foi criada agora
    if (NODE_ENV === 'development') {
      if (tableWasCreated) {
        console.log('🌱 Primeira execução - criando usuário admin...');
        await seedDatabase();
      } else {
        console.log('👤 Ambiente DEV - admin já deve existir');
      }
    }
    
    // 4. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`   📍 http://localhost:${PORT}`);
      console.log(`   🔐 Ambiente: ${NODE_ENV}`);
      if (NODE_ENV === 'production') {
        console.log('🔒 MODO PRODUÇÃO - Seed automático desativado');
      }
      console.log(`   🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configurado' : 'USANDO PADRÃO!'}`);
      console.log(`   👤 Admin user: ${NODE_ENV === 'development' ? 'Criado' : 'NÃO CRIADO (produção)'}`);
    });
    
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();