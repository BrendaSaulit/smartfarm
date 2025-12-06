// migrations/index.js 
const { getDatabase } = require('../../src/config/database');

async function runInitialMigration() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // 1. PRIMEIRO verifica se a tabela já existe
    db.get(
      `SELECT name FROM sqlite_master 
       WHERE type='table' AND name='users'`,
      [],
      async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          // 2. Só executa a migration se a tabela NÃO existir
          console.log('📋 Executando migration inicial...');
          
          try {
            const migration = require('./001_create_users');
            await migration.up(db);
            console.log('✅ Migration aplicada com sucesso');
            resolve(true); // Tabela foi criada agora
          } catch (migrationError) {
            console.error('❌ Erro na migration:', migrationError);
            reject(migrationError);
          }
        } else {
          console.log('✅ Tabela users já existe (migration não necessária)');
          resolve(false); // Tabela já existia
        }
      }
    );
  });
}

// Função para ver status (opcional)
async function checkMigrationStatus() {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master 
       WHERE type='table' AND name='users'`,
      [],
      (err, row) => {
        if (err) reject(err);
        else resolve({
          tableExists: !!row,
          needsMigration: !row
        });
      }
    );
  });
}

module.exports = {
  runInitialMigration,
  checkMigrationStatus
};