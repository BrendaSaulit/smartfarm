//SOMENTE EM DESENVOLVIMENTO
const Users = require('../../db/models/users');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    // Só criar admin se não existir
    const adminExists = await Users.exists('admin');
    
    if (!adminExists) {
      console.log('🌱 Criando usuário admin padrão...');
      await Users.create('admin', 'Administrador', 'admin123');
      console.log('👑 Admin criado (username: admin, senha: admin123)');
    } else {
      console.log('👑 Usuário admin já existe');
    }
  } catch (error) {
    console.error('❌ Erro no seed:', error);
  }
}

// Exportar função mas NÃO executar automaticamente
module.exports = { seedDatabase };

