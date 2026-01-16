const { consumeQueue, connectQueue, QUEUES } = require('./queue');
const { query, runMigration, testConnection } = require('./database');

async function processReading(msg) {
  const content = msg.content.toString();
  const data = JSON.parse(content);

  console.log('Processando leitura:', { serial_number: data.serial_number, received_at: data.received_at });

  const insertQuery = `
    INSERT INTO temp_hum_readings (serial_number, temperature, humidity, battery_level, received_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const result = await query(insertQuery, [
    data.serial_number,
    data.temperature,
    data.humidity,
    data.battery_level,
    data.received_at,
  ]);

  console.log('Leitura salva com sucesso:', { id: result.rows[0].id, serial_number: data.serial_number });
}

async function startWorker() {
  console.log('Iniciando worker...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Falha ao conectar ao PostgreSQL.');
    throw new Error('Database connection failed');
  }
  console.log('PostgreSQL conectado');

  // Run migration
  const migrationSuccess = await runMigration();
  if (!migrationSuccess) {
    console.error('Falha ao executar migration.');
    throw new Error('Migration failed');
  }

  // Connect to RabbitMQ
  try {
    await connectQueue();
    console.log('RabbitMQ conectado');
  } catch (error) {
    console.error('Falha ao conectar ao RabbitMQ:', error.message);
    throw error;
  }

  // Start consuming
  await consumeQueue(QUEUES.READINGS_PROCESS, processReading, { prefetch: 10 });

  console.log('Worker rodando. Aguardando mensagens...');
}

module.exports = { startWorker };

// Se executado diretamente (não importado)
if (require.main === module) {
  require('dotenv').config();

  process.on('SIGINT', async () => {
    console.log('Recebido SIGINT. Encerrando worker...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM. Encerrando worker...');
    process.exit(0);
  });

  startWorker().catch((error) => {
    console.error('Erro fatal no worker:', error);
    process.exit(1);
  });
}
