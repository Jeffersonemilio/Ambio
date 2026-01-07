import { Router, Request, Response, NextFunction } from 'express';
import { ReadingService } from './reading.service.js';
import { ReadingRepository } from './reading.repository.js';
import { NotFoundError } from '../../shared/errors/index.js';

export function createReadingRouter(): Router {
  const router = Router();
  const repository = new ReadingRepository();
  const service = new ReadingService(repository);

  // List readings with filters
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        tenant_id: req.query.tenant_id as string | undefined,
        sensor_id: req.query.sensor_id as string | undefined,
        serial_number: req.query.serial_number as string | undefined,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const readings = await service.findAll(filters);
      res.json(readings);
    } catch (error) {
      next(error);
    }
  });

  // Get readings by sensor ID
  router.get('/sensor/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const readings = await service.findBySensorId(req.params.id, limit);
      res.json(readings);
    } catch (error) {
      next(error);
    }
  });

  // Get latest reading for a sensor
  router.get('/latest/:sensorId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reading = await service.findLatestBySensorId(req.params.sensorId);
      if (!reading) {
        throw new NotFoundError('Reading');
      }
      res.json(reading);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
