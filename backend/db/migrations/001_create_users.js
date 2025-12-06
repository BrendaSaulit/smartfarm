// migrations/001_create_users.js
//futuramente adicionar migrations ao projeto, por enquanto está sendo criado na inicialização do sevidor

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

module.exports = {
  up: async (db) => {
    await db.run(sql);
    console.log('✅ Tabela users criada');
  },
  down: async (db) => {
    await db.run('DROP TABLE IF EXISTS users');
    console.log('🗑️  Tabela users removida');
  }
};