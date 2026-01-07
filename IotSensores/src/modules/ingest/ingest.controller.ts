import { Router, Request, Response, NextFunction } from 'express';
import { IngestService } from './ingest.service.js';

export function createIngestRouter(): Router {
  const router = Router();
  const service = new IngestService();

  // POST /ingest - Receive sensor data
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.processIngest(req.body);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
