const { Router } = require('express');
const companiesController = require('./companies.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     tags: [Companies]
 *     summary: Listar empresas
 *     description: Retorna lista paginada de empresas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou CNPJ
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
 *         description: Lista de empresas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/',
  requirePermission('companies.management:read'),
  (req, res) => companiesController.list(req, res)
);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Obter empresa por ID
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
 *         description: Dados da empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Empresa não encontrada
 */
router.get('/:id',
  requirePermission('companies.management:read'),
  (req, res) => companiesController.get(req, res)
);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     tags: [Companies]
 *     summary: Criar empresa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cnpj]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Empresa ABC Ltda"
 *               cnpj:
 *                 type: string
 *                 example: "12.345.678/0001-99"
 *     responses:
 *       201:
 *         description: Empresa criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Dados inválidos ou CNPJ já cadastrado
 */
router.post('/',
  requirePermission('companies.management:write'),
  (req, res) => companiesController.create(req, res)
);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     tags: [Companies]
 *     summary: Atualizar empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Empresa atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Empresa não encontrada
 */
router.put('/:id',
  requirePermission('companies.management:write'),
  (req, res) => companiesController.update(req, res)
);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Excluir empresa
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
 *         description: Empresa excluída
 *       400:
 *         description: Empresa possui usuários ou sensores vinculados
 *       404:
 *         description: Empresa não encontrada
 */
router.delete('/:id',
  requirePermission('companies.management:delete'),
  (req, res) => companiesController.delete(req, res)
);

/**
 * @swagger
 * /api/companies/{id}/users:
 *   get:
 *     tags: [Companies]
 *     summary: Listar usuários da empresa
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
 *         description: Lista de usuários da empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/:id/users',
  requirePermission('users.management:read'),
  (req, res) => companiesController.getUsers(req, res)
);

/**
 * @swagger
 * /api/companies/{id}/sensors:
 *   get:
 *     tags: [Companies]
 *     summary: Listar sensores da empresa
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
 *         description: Lista de sensores da empresa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 */
router.get('/:id/sensors',
  requirePermission('sensors.management:read'),
  (req, res) => companiesController.getSensors(req, res)
);

module.exports = router;
