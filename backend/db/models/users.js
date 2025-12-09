//(MODEL - apenas operações com dados)
// db/models/User.js
const { getDatabase } = require('../../src/config/database');
const bcrypt = require('bcrypt');

class User {
  // Buscar por username
  static findByUsername(username) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?', 
        [username], 
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
  }
  
  // Criar usuário
  static async create(username, name, password) {
    const db = getDatabase();
    const passwordHash = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)',
        [username, name, passwordHash],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, name });
        }
      );
    });
  }
  
  // Buscar por ID
  static findById(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?', 
        [id], 
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
  }
  
  // Atualizar último login
  static updateLastLogin(userId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  // Verificar se usuário existe
  static async exists(username) {
    try {
      const user = await this.findByUsername(username);
      return !!user;
    } catch (error) {
      return false;
    }
  }
  
  // Listar todos os usuários (opcional)
  static findAll() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, name, created_at, last_login FROM users ORDER BY created_at DESC',
        [],
        (err, users) => {
          if (err) reject(err);
          else resolve(users);
        }
      );
    });
  }
}

module.exports = User;