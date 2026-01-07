import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TenantService } from './tenant.service.js';
import { TenantRepository } from './tenant.repository.js';
import { ValidationError } from '../../shared/errors/index.js';

const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  document: z.string().min(11).max(18), // CPF or CNPJ
  email: z.string().email(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  document: z.string().min(11).max(18).optional(),
  email: z.string().email().optional(),
  is_active: z.boolean().optional(),
});

export function createTenantRouter(): Router {
  const router = Router();
  const repository = new TenantRepository();
  const service = new TenantService(repository);

  // List all tenants
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
      const tenants = await service.findAll({ is_active });
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });

  // Get tenant by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await service.findById(req.params.id);
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  // Create tenant
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const tenant = await service.create(parsed.data);
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  });

  // Update tenant
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const tenant = await service.update(req.params.id, parsed.data);
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  // Delete (soft) tenant
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
