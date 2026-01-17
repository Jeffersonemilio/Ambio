const { Router } = require('express');
const sensorsController = require('./sensors.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD de sensores
router.get('/',
  requirePermission('sensors.management:read'),
  (req, res) => sensorsController.list(req, res)
);

router.get('/:id',
  requirePermission('sensors.management:read'),
  (req, res) => sensorsController.get(req, res)
);

router.post('/',
  requirePermission('sensors.management:write'),
  (req, res) => sensorsController.create(req, res)
);

router.put('/:id',
  requirePermission('sensors.management:write'),
  (req, res) => sensorsController.update(req, res)
);

router.delete('/:id',
  requirePermission('sensors.management:delete'),
  (req, res) => sensorsController.delete(req, res)
);

// Atribuição de sensores (apenas Ambio)
router.put('/:id/assign',
  requirePermission('companies.sensors:assign'),
  (req, res) => sensorsController.assign(req, res)
);

router.put('/:id/unassign',
  requirePermission('companies.sensors:assign'),
  (req, res) => sensorsController.unassign(req, res)
);

// Grupos de sensores
router.get('/groups/:id',
  requirePermission('sensors.groups:read'),
  (req, res) => sensorsController.getGroup(req, res)
);

router.put('/groups/:id',
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.updateGroup(req, res)
);

router.delete('/groups/:id',
  requirePermission('sensors.groups:delete'),
  (req, res) => sensorsController.deleteGroup(req, res)
);

router.put('/groups/:id/sensors',
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.moveSensors(req, res)
);

module.exports = router;

// Rotas de grupos por empresa (para ser usada com /api/companies/:companyId/groups)
const groupsRouter = Router({ mergeParams: true });

groupsRouter.get('/',
  authenticate,
  requirePermission('sensors.groups:read'),
  (req, res) => sensorsController.listGroups(req, res)
);

groupsRouter.post('/',
  authenticate,
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.createGroup(req, res)
);

module.exports.groupsRouter = groupsRouter;
