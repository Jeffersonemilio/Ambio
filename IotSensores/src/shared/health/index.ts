import { Router, Request, Response } from 'express';
import { testConnection } from '../database/index.js';
import { testQueueConnection } from '../queue/index.js';

export function createHealthRouter(): Router {
  const router = Router();

  // Basic health check
  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Database health check
  router.get('/db', async (_req: Request, res: Response) => {
    const isHealthy = await testConnection();
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'error',
      service: 'postgresql',
      timestamp: new Date().toISOString(),
    });
  });

  // Queue health check
  router.get('/queue', async (_req: Request, res: Response) => {
    const isHealthy = await testQueueConnection();
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'error',
      service: 'rabbitmq',
      timestamp: new Date().toISOString(),
    });
  });

  // Full health check (all services)
  router.get('/ready', async (_req: Request, res: Response) => {
    const [dbHealthy, queueHealthy] = await Promise.all([
      testConnection(),
      testQueueConnection(),
    ]);

    const isHealthy = dbHealthy && queueHealthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      services: {
        database: dbHealthy ? 'ok' : 'error',
        queue: queueHealthy ? 'ok' : 'error',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
