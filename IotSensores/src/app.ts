import express, { Request } from 'express';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { logger } from './shared/logger/index.js';
import { testConnection } from './shared/database/index.js';
import { connectQueue } from './shared/queue/index.js';
import { migrate } from './shared/database/migrate.js';
import { errorHandler } from './shared/middleware/index.js';
import { createHealthRouter } from './shared/health/index.js';
import { createTenantRouter } from './modules/tenant/index.js';
import { createSensorRouter } from './modules/sensor/index.js';
import { createReadingRouter } from './modules/reading/index.js';
import { createIngestRouter } from './modules/ingest/index.js';
import { createRuleRouter } from './modules/rule/index.js';
import { createAlertRouter } from './modules/alert/index.js';

const app = express();

// Middleware
app.use(express.json());
app.use(
  pinoHttp.default({
    logger,
    autoLogging: {
      ignore: (req: Request) => req.url === '/health',
    },
  })
);

// Routes
app.use('/health', createHealthRouter());
app.use('/api/tenants', createTenantRouter());
app.use('/api/sensors', createSensorRouter());
app.use('/api/readings', createReadingRouter());
app.use('/api/rules', createRuleRouter());
app.use('/api/alerts', createAlertRouter());
app.use('/ingest', createIngestRouter());

// Error handler
app.use(errorHandler);

// Startup
async function start() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Run migrations
    await migrate();

    // Connect to queue
    await connectQueue();

    // Start server
    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.env }, 'Server started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();

export default app;
