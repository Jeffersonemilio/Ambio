/**
 * Script para criar o primeiro super admin do sistema
 * Uso: node scripts/create-super-admin.js
 */

require('dotenv').config();

const bcrypt = require('bcrypt');
const { query, pool } = require('../src/database');

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@ambio.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  console.log('Criando super admin...');
  console.log(`Email: ${email}`);

  try {
    // Verificar se já existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      console.log('Super admin já existe!');
      process.exit(0);
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const result = await query(
      `INSERT INTO users (email, password_hash, name, user_type, ambio_role)
       VALUES ($1, $2, $3, 'ambio', 'super_admin')
       RETURNING id, email, name`,
      [email, passwordHash, name]
    );

    console.log('Super admin criado com sucesso!');
    console.log('ID:', result.rows[0].id);
    console.log('Email:', result.rows[0].email);
    console.log('Nome:', result.rows[0].name);
    console.log('\nSenha:', password);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
  } catch (error) {
    console.error('Erro ao criar super admin:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();
