const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuários
 *     description: Retorna lista paginada de usuários. Usuários de empresa só veem usuários da sua empresa.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [ambio, company]
 *         description: Filtrar por tipo de usuário
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por empresa
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
router.get('/',
  requirePermission('users.management:read'),
  (req, res) => usersController.list(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obter usuário por ID
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
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id',
  requirePermission('users.management:read'),
  (req, res) => usersController.get(req, res)
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Criar usuário
 *     description: Cria novo usuário e envia email de boas-vindas com credenciais
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, userType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [ambio, company]
 *               ambioRole:
 *                 type: string
 *                 enum: [super_admin, admin, analyst, support]
 *                 description: Obrigatório se userType=ambio
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: Obrigatório se userType=company
 *               companyRole:
 *                 type: string
 *                 enum: [admin, analyst, user]
 *                 description: Obrigatório se userType=company
 *     responses:
 *       201:
 *         description: Usuário criado (email de boas-vindas enviado)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *       403:
 *         description: Sem permissão
 */
router.post('/',
  requirePermission('users.management:write'),
  (req, res) => usersController.create(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Atualizar usuário
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
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               companyRole:
 *                 type: string
 *                 enum: [admin, analyst, user]
 *               ambioRole:
 *                 type: string
 *                 enum: [super_admin, admin, analyst, support]
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id',
  requirePermission('users.management:write'),
  (req, res) => usersController.update(req, res)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Excluir usuário
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
 *         description: Usuário excluído
 *       400:
 *         description: Não é possível excluir (ex. próprio usuário)
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id',
  requirePermission('users.management:delete'),
  (req, res) => usersController.delete(req, res)
);

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   get:
 *     tags: [Users]
 *     summary: Obter permissões customizadas
 *     description: Lista permissões customizadas atribuídas ao usuário
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
 *         description: Lista de permissões
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   resource:
 *                     type: string
 *                   actions:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/:id/permissions',
  requirePermission('users.roles:read'),
  (req, res) => usersController.getPermissions(req, res)
);

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   put:
 *     tags: [Users]
 *     summary: Definir permissão customizada
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
 *             required: [resource, actions]
 *             properties:
 *               resource:
 *                 type: string
 *                 example: "sensors.management"
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["read", "write"]
 *     responses:
 *       200:
 *         description: Permissão definida
 */
router.put('/:id/permissions',
  requirePermission('users.roles:write'),
  (req, res) => usersController.setPermission(req, res)
);

/**
 * @swagger
 * /api/users/{id}/permissions/{resource}:
 *   delete:
 *     tags: [Users]
 *     summary: Remover permissão customizada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do recurso (ex. sensors.management)
 *     responses:
 *       200:
 *         description: Permissão removida
 */
router.delete('/:id/permissions/:resource',
  requirePermission('users.roles:write'),
  (req, res) => usersController.removePermission(req, res)
);

/**
 * @swagger
 * /api/users/{id}/modules:
 *   get:
 *     tags: [Users]
 *     summary: Listar módulos do admin
 *     description: Lista módulos atribuídos a um admin Ambio
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
 *         description: Lista de módulos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   module:
 *                     type: string
 *                   assignedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/:id/modules',
  requirePermission('users.roles:read'),
  (req, res) => usersController.getAdminModules(req, res)
);

/**
 * @swagger
 * /api/users/{id}/modules:
 *   post:
 *     tags: [Users]
 *     summary: Atribuir módulo ao admin
 *     description: Atribui um módulo a um admin Ambio (apenas super_admin)
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
 *             required: [module]
 *             properties:
 *               module:
 *                 type: string
 *                 enum: [users, companies, sensors]
 *     responses:
 *       200:
 *         description: Módulo atribuído
 *       400:
 *         description: Usuário não é admin Ambio
 */
router.post('/:id/modules',
  requirePermission('users.roles:write'),
  (req, res) => usersController.assignModule(req, res)
);

/**
 * @swagger
 * /api/users/{id}/modules/{module}:
 *   delete:
 *     tags: [Users]
 *     summary: Remover módulo do admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Módulo removido
 */
router.delete('/:id/modules/:module',
  requirePermission('users.roles:write'),
  (req, res) => usersController.removeModule(req, res)
);

module.exports = router;
