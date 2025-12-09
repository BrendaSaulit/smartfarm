const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Users = require('../../db/models/users');

const JWT_SECRET = process.env.JWT_SECRET;

const AuthController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validação
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Usuário e senha são obrigatórios' 
        });
      }
      
      // Buscar usuário
      const user = await Users.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciais inválidas' 
        });
      }
      
      // Verificar senha
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciais inválidas' 
        });
      }
      
      // Atualizar último login
      await Users.updateLastLogin(user.id);
      
      // Gerar JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ 
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          created_at: user.created_at,
          last_login: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  },
  
  signup: async (req, res) => {
    try {
      const { username, name, password } = req.body;
      
      // Validações
      if (!username || !name || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Todos os campos são obrigatórios' 
        });
      }
      
      if (username.length < 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'Usuário deve ter pelo menos 5 caracteres' 
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'Senha deve ter pelo menos 6 caracteres' 
        });
      }
      
      // Verificar se usuário já existe
      const exists = await Users.exists(username);
      
      if (exists) {
        return res.status(400).json({ 
          success: false, 
          error: 'Usuário já cadastrado' 
        });
      }
      
      // Criar usuário
      const newUser = await Users.create(username, name, password);
      
      // Gerar token automaticamente
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          username: newUser.username,
          name: newUser.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ 
        success: true,
        token,
        user: newUser,
        message: 'Conta criada com sucesso!'
      });
      
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao criar conta' 
      });
    }
  },
  
  verify: (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.json({ valid: false, error: 'Token não fornecido' });
      }
      
      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.json({ valid: false, error: 'Token inválido ou expirado' });
        }
        
        // Buscar dados atualizados do usuário
        const user = await Users.findByUsername(decoded.username);
        
        if (!user) {
          return res.json({ valid: false, error: 'Usuário não encontrado' });
        }
        
        res.json({ 
          valid: true, 
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            created_at: user.created_at,
            last_login: user.last_login
          }
        });
      });
      
    } catch (error) {
      res.json({ valid: false, error: 'Erro na verificação' });
    }
  }
};

module.exports = AuthController;