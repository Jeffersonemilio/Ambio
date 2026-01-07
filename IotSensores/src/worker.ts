import { config } from './config/index.js';
import { logger } from './shared/logger/index.js';
import { testConnection } from './shared/database/index.js';
import { connectQueue, closeQueue } from './shared/queue/index.js';
import { ReadingConsumer } from './modules/ingest/index.js';
import { NotificationConsumer } from './modules/notification/index.js';
import { OfflineSensorChecker } from './jobs/index.js';

async function start() {
  try {
    logger.info({ env: config.env }, 'Starting worker...');

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Connect to queue
    await connectQueue();

    // Start consumers
    const readingConsumer = new ReadingConsumer();
    await readingConsumer.start();

    const notificationConsumer = new NotificationConsumer();
    await notificationConsumer.start();

    // Start scheduled jobs
    const offlineChecker = new OfflineSensorChecker();
    offlineChecker.start('*/5 * * * *'); // Every 5 minutes

    logger.info('Worker started successfully');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down worker...');
      await closeQueue();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start worker');
    process.exit(1);
  }
}

start();
