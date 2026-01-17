const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD de usuários
router.get('/',
  requirePermission('users.management:read'),
  (req, res) => usersController.list(req, res)
);

router.get('/:id',
  requirePermission('users.management:read'),
  (req, res) => usersController.get(req, res)
);

router.post('/',
  requirePermission('users.management:write'),
  (req, res) => usersController.create(req, res)
);

router.put('/:id',
  requirePermission('users.management:write'),
  (req, res) => usersController.update(req, res)
);

router.delete('/:id',
  requirePermission('users.management:delete'),
  (req, res) => usersController.delete(req, res)
);

// Permissões customizadas
router.get('/:id/permissions',
  requirePermission('users.roles:read'),
  (req, res) => usersController.getPermissions(req, res)
);

router.put('/:id/permissions',
  requirePermission('users.roles:write'),
  (req, res) => usersController.setPermission(req, res)
);

router.delete('/:id/permissions/:resource',
  requirePermission('users.roles:write'),
  (req, res) => usersController.removePermission(req, res)
);

// Módulos para admin Ambio (apenas super_admin)
router.get('/:id/modules',
  requirePermission('users.roles:read'),
  (req, res) => usersController.getAdminModules(req, res)
);

router.post('/:id/modules',
  requirePermission('users.roles:write'),
  (req, res) => usersController.assignModule(req, res)
);

router.delete('/:id/modules/:module',
  requirePermission('users.roles:write'),
  (req, res) => usersController.removeModule(req, res)
);

module.exports = router;
