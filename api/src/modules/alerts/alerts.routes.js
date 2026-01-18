const express = require('express');
const router = express.Router();
const alertsController = require('./alerts.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

// Todas as rotas requerem autenticacao
router.use(authenticate);

// GET /api/alerts - Listar alertas (paginado, filtros)
router.get(
  '/',
  requirePermission('notifications.alerts:read'),
  (req, res) => alertsController.findAll(req, res)
);

// GET /api/alerts/statistics - Estatisticas de alertas
router.get(
  '/statistics',
  requirePermission('notifications.alerts:read'),
  (req, res) => alertsController.getStatistics(req, res)
);

// GET /api/alerts/:id - Obter alerta por ID
router.get(
  '/:id',
  requirePermission('notifications.alerts:read'),
  (req, res) => alertsController.findById(req, res)
);

// GET /api/alerts/:id/notifications - Historico de notificacoes do alerta
router.get(
  '/:id/notifications',
  requirePermission('notifications.alerts:read'),
  (req, res) => alertsController.getNotifications(req, res)
);

// GET /api/companies/:companyId/alerts/active - Alertas ativos de uma empresa
router.get(
  '/companies/:companyId/active',
  requirePermission('notifications.alerts:read'),
  (req, res) => alertsController.findActiveByCompany(req, res)
);

module.exports = router;
