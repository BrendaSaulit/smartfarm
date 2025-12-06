// backend/server.js
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Seu frontend Next.js
  credentials: true
}));
app.use(express.json());

// Conectar ao SQLite (cria arquivo automaticamente)
const db = new sqlite3.Database('./smartfarm.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err);
  } else {
    console.log('✅ Conectado ao SQLite');
    initializeDatabase();
  }
});

// Criar tabelas
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err);
    } else {
      console.log('✅ Tabela users pronta');
      
      // Criar usuário admin padrão (opcional)
      createDefaultUser();
    }
  });
}

// Criar usuário admin padrão (senha: admin123)
async function createDefaultUser() {
  const defaultUser = {
    username: 'admin',
    name: 'Administrador',
    password: 'admin123'
  };
  
  const hash = await bcrypt.hash(defaultUser.password, 10);
  
  db.get('SELECT id FROM users WHERE username = ?', [defaultUser.username], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)',
        [defaultUser.username, defaultUser.name, hash],
        (err) => {
          if (err) {
            console.error('Erro ao criar usuário padrão:', err);
          } else {
            console.log('👑 Usuário admin criado (username: admin, senha: admin123)');
          }
        }
      );
    }
  });
}

// ==================== ROTAS DA API ====================

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend Smart Farm Online' });
});

// [1] ROTA DE LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Tentativa de login: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Usuário e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário no banco
    db.get(
      'SELECT * FROM users WHERE username = ?', 
      [username], 
      async (err, user) => {
        if (err) {
          console.error('Erro no banco:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
          });
        }
        
        if (!user) {
          console.log(`❌ Usuário não encontrado: ${username}`);
          return res.status(401).json({ 
            success: false, 
            error: 'Credenciais inválidas' 
          });
        }
        
        // Verificar senha
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
          console.log(`❌ Senha incorreta para: ${username}`);
          return res.status(401).json({ 
            success: false, 
            error: 'Credenciais inválidas' 
          });
        }
        
        // Atualizar último login
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );
        
        // Gerar JWT Token
        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username,
            name: user.name
          },
          JWT_SECRET,
          { expiresIn: '7d' } // Token válido por 7 dias
        );
        
        console.log(`✅ Login bem-sucedido: ${username}`);
        
        // Retornar resposta
        res.json({ 
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            created_at: user.created_at,
            last_login: user.last_login || new Date().toISOString()
          }
        });
      }
    );
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// [2] ROTA DE CADASTRO
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, name, password } = req.body;
    
    console.log(`📝 Tentativa de cadastro: ${username}`);
    
    // Validações básicas
    if (!username || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
      });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Usuário deve ter pelo menos 3 caracteres' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    // Verificar se usuário já existe
    db.get(
      'SELECT id FROM users WHERE username = ?', 
      [username], 
      async (err, existingUser) => {
        if (err) {
          console.error('Erro no banco:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
          });
        }
        
        if (existingUser) {
          console.log(`❌ Usuário já existe: ${username}`);
          return res.status(400).json({ 
            success: false, 
            error: 'Usuário já cadastrado' 
          });
        }
        
        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Inserir novo usuário
        db.run(
          'INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)',
          [username, name, passwordHash],
          function(err) {
            if (err) {
              console.error('Erro ao criar usuário:', err);
              return res.status(500).json({ 
                success: false, 
                error: 'Erro ao criar conta' 
              });
            }
            
            console.log(`✅ Usuário criado: ${username} (ID: ${this.lastID})`);
            
            // Gerar token automaticamente após cadastro
            const token = jwt.sign(
              { 
                userId: this.lastID, 
                username: username,
                name: name
              },
              JWT_SECRET,
              { expiresIn: '7d' }
            );
            
            res.json({ 
              success: true,
              token,
              user: {
                id: this.lastID,
                username,
                name,
                created_at: new Date().toISOString()
              },
              message: 'Conta criada com sucesso!'
            });
          }
        );
      }
    );
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// [3] ROTA DE VERIFICAÇÃO DE TOKEN
app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({ valid: false, error: 'Token não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.json({ valid: false, error: 'Token inválido ou expirado' });
      }
      
      // Token válido - buscar dados atualizados do usuário
      db.get(
        'SELECT id, username, name, created_at, last_login FROM users WHERE id = ?',
        [decoded.userId],
        (err, user) => {
          if (err || !user) {
            return res.json({ valid: false, error: 'Usuário não encontrado' });
          }
          
          res.json({ 
            valid: true, 
            user,
            decoded 
          });
        }
      );
    });
    
  } catch (error) {
    res.json({ valid: false, error: 'Erro na verificação' });
  }
});

// [4] MIDDLEWARE DE AUTENTICAÇÃO (para rotas protegidas)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    req.user = user;
    next();
  });
}

// [5] EXEMPLO: ROTA PROTEGIDA
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ 
    success: true,
    message: 'Acesso autorizado ao dashboard',
    user: req.user,
    data: {
      sensores: 5,
      atuadores: 3,
      ultimaLeitura: new Date().toISOString()
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend Smart Farm rodando em: http://localhost:${PORT}`);
  console.log(`🔑 JWT Secret: ${JWT_SECRET ? 'Configurado' : 'NÃO CONFIGURADO!'}`);
});