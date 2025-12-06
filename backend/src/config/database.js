const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './smartfarm.db';

let db = null;

function connectDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar ao SQLite:', err);
        return reject(err);
      }
      console.log('✅ Conectado ao SQLite:', DB_PATH);
      resolve(db);
    });
  });
}

function getDatabase() {
  if (!db) {
    throw new Error('Database não conectado. Chame connectDatabase() primeiro.');
  }
  return db;
}

module.exports = { connectDatabase, getDatabase };