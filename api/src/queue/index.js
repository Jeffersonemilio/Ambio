const amqp = require('amqplib');
const config = require('../config');

let connection = null;
let channel = null;

const QUEUES = {
  READINGS_PROCESS: 'readings.process',
};

const EXCHANGES = {
  READINGS: 'readings',
  READINGS_DLX: 'readings.dlx',
};

async function connectQueue() {
  if (channel) return channel;

  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    // Setup Dead Letter Exchange
    await channel.assertExchange(EXCHANGES.READINGS_DLX, 'direct', { durable: true });

    // Setup main exchange
    await channel.assertExchange(EXCHANGES.READINGS, 'direct', { durable: true });

    // Setup Dead Letter Queue
    await channel.assertQueue('readings.dlq', { durable: true });
    await channel.bindQueue('readings.dlq', EXCHANGES.READINGS_DLX, 'process');

    // Setup main queue with DLX
    await channel.assertQueue(QUEUES.READINGS_PROCESS, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.READINGS_DLX,
        'x-dead-letter-routing-key': 'process',
      },
    });
    await channel.bindQueue(QUEUES.READINGS_PROCESS, EXCHANGES.READINGS, 'process');

    console.log('RabbitMQ conectado e configurado');

    connection.on('error', (err) => {
      console.error('Erro na conexão RabbitMQ:', err.message);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.log('Conexão RabbitMQ fechada');
      channel = null;
      connection = null;
    });

    return channel;
  } catch (error) {
    console.error('Erro ao conectar ao RabbitMQ:', error.message);
    throw error;
  }
}

async function publishToQueue(queue, message) {
  const ch = await connectQueue();
  const content = Buffer.from(JSON.stringify(message));

  return ch.sendToQueue(queue, content, {
    persistent: true,
    contentType: 'application/json',
  });
}

async function consumeQueue(queue, callback, options = {}) {
  const ch = await connectQueue();

  if (options.prefetch) {
    await ch.prefetch(options.prefetch);
  }

  await ch.consume(queue, async (msg) => {
    if (msg) {
      try {
        await callback(msg);
        ch.ack(msg);
      } catch (error) {
        console.error('Erro ao processar mensagem:', error.message);
        // Rejeita e envia para DLQ
        ch.nack(msg, false, false);
      }
    }
  });

  console.log(`Consumindo da fila: ${queue}`);
}

async function consumeQueueBatch(queue, callback, options = {}) {
  const ch = await connectQueue();
  const batchSize = options.batchSize || 50;
  const batchTimeoutMs = options.batchTimeoutMs || 100;
  let batch = [];
  let batchTimer = null;

  if (options.prefetch) {
    await ch.prefetch(options.prefetch);
  }

  async function processBatch() {
    if (batch.length === 0) return;

    const currentBatch = [...batch];
    batch = [];

    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    try {
      await callback(currentBatch);
      currentBatch.forEach((msg) => ch.ack(msg));
      if (config.logging.verbose) {
        console.log(`Batch de ${currentBatch.length} mensagens processado com sucesso`);
      }
    } catch (error) {
      console.error('Erro ao processar batch:', error.message);
      currentBatch.forEach((msg) => ch.nack(msg, false, false));
    }
  }

  function scheduleBatchProcessing() {
    if (batchTimer) return;
    batchTimer = setTimeout(async () => {
      batchTimer = null;
      await processBatch();
    }, batchTimeoutMs);
  }

  await ch.consume(queue, async (msg) => {
    if (msg) {
      batch.push(msg);

      if (batch.length >= batchSize) {
        await processBatch();
      } else {
        scheduleBatchProcessing();
      }
    }
  });

  console.log(`Consumindo da fila em batch: ${queue} (batchSize: ${batchSize}, timeout: ${batchTimeoutMs}ms)`);
}

async function closeConnection() {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}

async function testQueueConnection() {
  try {
    await connectQueue();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  connectQueue,
  publishToQueue,
  consumeQueue,
  consumeQueueBatch,
  closeConnection,
  testQueueConnection,
  QUEUES,
  EXCHANGES,
};
