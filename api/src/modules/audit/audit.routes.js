const { Router } = require('express');
const auditController = require('./audit.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     tags: [Audit]
 *     summary: Listar logs de auditoria
 *     description: Retorna lista paginada de logs de auditoria do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por usuário que executou a ação
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete, login, logout, password_reset, impersonate_start]
 *         description: Filtrar por tipo de ação
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [user, company, sensor, auth, user_permission]
 *         description: Filtrar por tipo de recurso
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID do recurso
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial do período
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final do período
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para visualizar logs
 */
router.get('/',
  authenticate,
  requirePermission('audit.logs:read'),
  (req, res) => auditController.list(req, res)
);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     tags: [Audit]
 *     summary: Obter log de auditoria por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalhes do log de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 *       404:
 *         description: Log não encontrado
 */
router.get('/:id',
  authenticate,
  requirePermission('audit.logs:read'),
  (req, res) => auditController.get(req, res)
);

module.exports = router;
