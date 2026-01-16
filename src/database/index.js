const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  max: 100,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
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

async function batchInsertReadings(readings) {
  if (readings.length === 0) return { rowCount: 0 };

  const values = [];
  const params = [];

  readings.forEach((r, i) => {
    const offset = i * 5;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
    params.push(r.serial_number, r.temperature, r.humidity, r.battery_level, r.received_at);
  });

  const queryText = `
    INSERT INTO temp_hum_readings (serial_number, temperature, humidity, battery_level, received_at)
    VALUES ${values.join(', ')}
  `;

  const start = Date.now();
  const result = await pool.query(queryText, params);
  const duration = Date.now() - start;
  console.log('Batch insert executado:', { count: readings.length, duration, rows: result.rowCount });
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
  batchInsertReadings,
  testConnection,
  runMigration,
};
