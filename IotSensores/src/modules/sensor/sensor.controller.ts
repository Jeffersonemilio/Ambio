import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SensorService } from './sensor.service.js';
import { SensorRepository } from './sensor.repository.js';
import { ValidationError } from '../../shared/errors/index.js';

const createSensorSchema = z.object({
  serial_number: z.string().min(1).max(50),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
});

const updateSensorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional(),
});

export function createSensorRouter(): Router {
  const router = Router();
  const repository = new SensorRepository();
  const service = new SensorService(repository);

  // List all sensors
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant_id = req.query.tenant_id as string | undefined;
      const is_active =
        req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
      const sensors = await service.findAll({ tenant_id, is_active });
      res.json(sensors);
    } catch (error) {
      next(error);
    }
  });

  // Get sensor by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sensor = await service.findById(req.params.id);
      res.json(sensor);
    } catch (error) {
      next(error);
    }
  });

  // Get sensor by serial number
  router.get('/serial/:serial', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sensor = await service.findBySerialNumber(req.params.serial);
      res.json(sensor);
    } catch (error) {
      next(error);
    }
  });

  // Create sensor
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSensorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const sensor = await service.create(parsed.data);
      res.status(201).json(sensor);
    } catch (error) {
      next(error);
    }
  });

  // Update sensor
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSensorSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const sensor = await service.update(req.params.id, parsed.data);
      res.json(sensor);
    } catch (error) {
      next(error);
    }
  });

  // Delete (soft) sensor
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
