const express = require('express');
const router = express.Router();
const systemSettingsController = require('./system-settings.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

// Todas as rotas requerem autenticacao
router.use(authenticate);

// GET /api/system-settings - Listar todas as configuracoes
router.get(
  '/',
  requirePermission('system-settings:read'),
  (req, res) => systemSettingsController.findAll(req, res)
);

// GET /api/system-settings/:key - Obter configuracao por chave
router.get(
  '/:key',
  requirePermission('system-settings:read'),
  (req, res) => systemSettingsController.findByKey(req, res)
);

// PUT /api/system-settings/:key - Atualizar configuracao
router.put(
  '/:key',
  requirePermission('system-settings:write'),
  (req, res) => systemSettingsController.update(req, res)
);

module.exports = router;
