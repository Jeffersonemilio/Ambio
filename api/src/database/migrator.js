const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function markMigrationExecuted(name) {
  await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();

    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let migrationsRan = 0;

    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        continue;
      }

      console.log(`Executando migration: ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await pool.query(sql);
      await markMigrationExecuted(file);
      migrationsRan++;
      console.log(`Migration ${file} executada com sucesso`);
    }

    if (migrationsRan === 0) {
      console.log('Nenhuma nova migration para executar');
    } else {
      console.log(`${migrationsRan} migration(s) executada(s) com sucesso`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao executar migrations:', error.message);
    throw error;
  }
}

module.exports = { runMigrations };
