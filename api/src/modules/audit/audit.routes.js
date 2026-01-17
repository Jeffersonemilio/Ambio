const { Router } = require('express');
const auditController = require('./audit.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

router.get('/',
  authenticate,
  requirePermission('audit.logs:read'),
  (req, res) => auditController.list(req, res)
);

router.get('/:id',
  authenticate,
  requirePermission('audit.logs:read'),
  (req, res) => auditController.get(req, res)
);

module.exports = router;
