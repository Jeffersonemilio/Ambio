import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RuleService } from './rule.service.js';
import { RuleRepository } from './rule.repository.js';
import { ValidationError } from '../../shared/errors/index.js';

const createRuleSchema = z.object({
  tenant_id: z.string().uuid(),
  sensor_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(255),
  type: z.enum(['TEMPERATURE', 'HUMIDITY', 'BATTERY']),
  condition: z.enum(['ABOVE', 'BELOW', 'BETWEEN', 'OUTSIDE']),
  threshold_min: z.number().optional().nullable(),
  threshold_max: z.number().optional().nullable(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  cooldown_minutes: z.number().int().min(1).optional(),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['TEMPERATURE', 'HUMIDITY', 'BATTERY']).optional(),
  condition: z.enum(['ABOVE', 'BELOW', 'BETWEEN', 'OUTSIDE']).optional(),
  threshold_min: z.number().optional().nullable(),
  threshold_max: z.number().optional().nullable(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  is_active: z.boolean().optional(),
  cooldown_minutes: z.number().int().min(1).optional(),
});

export function createRuleRouter(): Router {
  const router = Router();
  const repository = new RuleRepository();
  const service = new RuleService(repository);

  // List rules
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        tenant_id: req.query.tenant_id as string | undefined,
        sensor_id: req.query.sensor_id as string | undefined,
        type: req.query.type as 'TEMPERATURE' | 'HUMIDITY' | 'BATTERY' | undefined,
        is_active:
          req.query.is_active === 'true'
            ? true
            : req.query.is_active === 'false'
              ? false
              : undefined,
      };
      const rules = await service.findAll(filters);
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  // Get rule by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rule = await service.findById(req.params.id);
      res.json(rule);
    } catch (error) {
      next(error);
    }
  });

  // Get rules for a sensor
  router.get('/sensor/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant_id = req.query.tenant_id as string;
      if (!tenant_id) {
        throw new ValidationError('tenant_id query parameter is required');
      }
      const rules = await service.findBySensorId(req.params.id, tenant_id);
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  // Create rule
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const rule = await service.create(parsed.data);
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  });

  // Update rule
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const rule = await service.update(req.params.id, parsed.data);
      res.json(rule);
    } catch (error) {
      next(error);
    }
  });

  // Delete rule
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
