const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query executada:', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com PostgreSQL:', error.message);
    return false;
  }
}

async function runMigration() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS temp_hum_readings (
      id SERIAL PRIMARY KEY,
      serial_number VARCHAR(50) NOT NULL,
      temperature DECIMAL(5,2) NOT NULL,
      humidity DECIMAL(5,2) NOT NULL,
      battery_level VARCHAR(10) NOT NULL,
      received_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_readings_serial_number ON temp_hum_readings(serial_number);
    CREATE INDEX IF NOT EXISTS idx_readings_received_at ON temp_hum_readings(received_at);
  `;

  try {
    await pool.query(createTableQuery);
    console.log('Migration executada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao executar migration:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  runMigration,
};
