const { consumeQueueBatch, connectQueue, QUEUES } = require('./queue');
const { batchInsertReadings, testConnection } = require('./database');
const { runMigrations } = require('./database/migrator');
const config = require('./config');

async function processBatchReadings(messages) {
  const readings = messages.map((msg) => {
    const content = msg.content.toString();
    return JSON.parse(content);
  });

  if (config.logging.verbose) {
    console.log(`Processando batch de ${readings.length} leituras`);
  }

  await batchInsertReadings(readings);

  if (config.logging.verbose) {
    console.log(`Batch de ${readings.length} leituras salvo com sucesso`);
  }
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

  // Run migrations
  try {
    await runMigrations();
  } catch (error) {
    console.error('Falha ao executar migrations:', error.message);
    throw new Error('Migrations failed');
  }

  // Connect to RabbitMQ
  try {
    await connectQueue();
    console.log('RabbitMQ conectado');
  } catch (error) {
    console.error('Falha ao conectar ao RabbitMQ:', error.message);
    throw error;
  }

  // Start consuming with batch processing
  await consumeQueueBatch(QUEUES.READINGS_PROCESS, processBatchReadings, {
    prefetch: 300,
    batchSize: 50,
    batchTimeoutMs: 100,
  });

  console.log('Worker rodando com batch processing. Aguardando mensagens...');
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
