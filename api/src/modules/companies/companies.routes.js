const { Router } = require('express');
const companiesController = require('./companies.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD de empresas
router.get('/',
  requirePermission('companies.management:read'),
  (req, res) => companiesController.list(req, res)
);

router.get('/:id',
  requirePermission('companies.management:read'),
  (req, res) => companiesController.get(req, res)
);

router.post('/',
  requirePermission('companies.management:write'),
  (req, res) => companiesController.create(req, res)
);

router.put('/:id',
  requirePermission('companies.management:write'),
  (req, res) => companiesController.update(req, res)
);

router.delete('/:id',
  requirePermission('companies.management:delete'),
  (req, res) => companiesController.delete(req, res)
);

// Relacionamentos
router.get('/:id/users',
  requirePermission('users.management:read'),
  (req, res) => companiesController.getUsers(req, res)
);

router.get('/:id/sensors',
  requirePermission('sensors.management:read'),
  (req, res) => companiesController.getSensors(req, res)
);

module.exports = router;
