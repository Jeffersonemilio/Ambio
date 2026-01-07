import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AlertService } from './alert.service.js';
import { AlertRepository } from './alert.repository.js';
import { ValidationError } from '../../shared/errors/index.js';
import { AlertType, AlertSeverity, AlertStatus, AlertFilters } from './alert.entity.js';

const acknowledgeSchema = z.object({
  user_id: z.string().uuid(),
});

export function createAlertRouter(): Router {
  const router = Router();
  const repository = new AlertRepository();
  const service = new AlertService(repository);

  // List alerts
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: AlertFilters = {
        tenant_id: req.query.tenant_id as string | undefined,
        sensor_id: req.query.sensor_id as string | undefined,
        type: req.query.type as AlertType | undefined,
        severity: req.query.severity as AlertSeverity | undefined,
        status: req.query.status as AlertStatus | undefined,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const alerts = await service.findAll(filters);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  // Get open alerts
  router.get('/open', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant_id = req.query.tenant_id as string | undefined;
      const alerts = await service.findOpen(tenant_id);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  // Get alert by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await service.findById(req.params.id);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  });

  // Get alerts for a sensor
  router.get('/sensor/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const alerts = await service.findBySensorId(req.params.id, limit);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  // Acknowledge alert
  router.patch('/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = acknowledgeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const alert = await service.acknowledge(req.params.id, parsed.data.user_id);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  });

  // Resolve alert
  router.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await service.resolve(req.params.id);
      res.json(alert);
    } catch (error) {
      next(error);
    }
  });

  // Get alert counts by status
  router.get('/stats/counts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant_id = req.query.tenant_id as string;
      if (!tenant_id) {
        throw new ValidationError('tenant_id query parameter is required');
      }
      const counts = await service.countByStatus(tenant_id);
      res.json(counts);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
