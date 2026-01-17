const { Router } = require('express');
const sensorsController = require('./sensors.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     tags: [Sensors]
 *     summary: Listar sensores
 *     description: Retorna lista paginada de sensores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por empresa
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por grupo
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: unassigned
 *         schema:
 *           type: boolean
 *         description: Listar apenas sensores não atribuídos
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
 *         description: Lista de sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/',
  requirePermission('sensors.management:read'),
  (req, res) => sensorsController.list(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}:
 *   get:
 *     tags: [Sensors]
 *     summary: Obter sensor por ID
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
 *         description: Dados do sensor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor não encontrado
 */
router.get('/:id',
  requirePermission('sensors.management:read'),
  (req, res) => sensorsController.get(req, res)
);

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     tags: [Sensors]
 *     summary: Criar sensor
 *     description: Apenas usuários Ambio podem criar sensores
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serialNumber, model]
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 example: "SN-2024-001"
 *               model:
 *                 type: string
 *                 example: "Sensor Pro v2"
 *     responses:
 *       201:
 *         description: Sensor criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Serial number já cadastrado
 */
router.post('/',
  requirePermission('sensors.management:write'),
  (req, res) => sensorsController.create(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}:
 *   put:
 *     tags: [Sensors]
 *     summary: Atualizar sensor
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
 *               serialNumber:
 *                 type: string
 *               model:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sensor atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor não encontrado
 */
router.put('/:id',
  requirePermission('sensors.management:write'),
  (req, res) => sensorsController.update(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}:
 *   delete:
 *     tags: [Sensors]
 *     summary: Excluir sensor
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
 *         description: Sensor excluído
 *       404:
 *         description: Sensor não encontrado
 */
router.delete('/:id',
  requirePermission('sensors.management:delete'),
  (req, res) => sensorsController.delete(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}/assign:
 *   put:
 *     tags: [Sensors]
 *     summary: Atribuir sensor a uma empresa
 *     description: Apenas usuários Ambio podem atribuir sensores
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
 *             required: [companyId]
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Sensor atribuído à empresa
 *       400:
 *         description: Sensor já está atribuído a outra empresa
 */
router.put('/:id/assign',
  requirePermission('companies.sensors:assign'),
  (req, res) => sensorsController.assign(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}/unassign:
 *   put:
 *     tags: [Sensors]
 *     summary: Remover atribuição do sensor
 *     description: Remove o sensor de qualquer empresa e grupo
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
 *         description: Atribuição removida
 */
router.put('/:id/unassign',
  requirePermission('companies.sensors:assign'),
  (req, res) => sensorsController.unassign(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}/configuration:
 *   get:
 *     tags: [Sensors]
 *     summary: Obter configuração do sensor
 *     description: Retorna limites de temperatura/umidade e local de instalação
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
 *         description: Configuração do sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensor_id:
 *                   type: string
 *                   format: uuid
 *                 installation_location:
 *                   type: string
 *                   example: "Câmara Fria 01"
 *                 temperature_min:
 *                   type: number
 *                   example: 2.0
 *                 temperature_max:
 *                   type: number
 *                   example: 8.0
 *                 humidity_min:
 *                   type: number
 *                   example: 40.0
 *                 humidity_max:
 *                   type: number
 *                   example: 60.0
 *                 alerts_enabled:
 *                   type: boolean
 *                   default: true
 *                 configured:
 *                   type: boolean
 *       404:
 *         description: Sensor não encontrado
 */
router.get('/:id/configuration',
  requirePermission('sensors.management:read'),
  (req, res) => sensorsController.getConfiguration(req, res)
);

/**
 * @swagger
 * /api/sensors/{id}/configuration:
 *   put:
 *     tags: [Sensors]
 *     summary: Atualizar configuração do sensor
 *     description: Define limites de temperatura/umidade e local de instalação
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
 *               installationLocation:
 *                 type: string
 *                 example: "Câmara Fria 01"
 *               temperatureMin:
 *                 type: number
 *                 example: 2.0
 *               temperatureMax:
 *                 type: number
 *                 example: 8.0
 *               humidityMin:
 *                 type: number
 *                 example: 40.0
 *               humidityMax:
 *                 type: number
 *                 example: 60.0
 *               alertsEnabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Configuração atualizada
 *       400:
 *         description: Erro de validação (ex. min > max)
 *       404:
 *         description: Sensor não encontrado
 */
router.put('/:id/configuration',
  requirePermission('sensors.management:write'),
  (req, res) => sensorsController.updateConfiguration(req, res)
);

/**
 * @swagger
 * /api/sensors/groups/{id}:
 *   get:
 *     tags: [Sensor Groups]
 *     summary: Obter grupo de sensores
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
 *         description: Dados do grupo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 companyId:
 *                   type: string
 *                   format: uuid
 *                 sensors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 */
router.get('/groups/:id',
  requirePermission('sensors.groups:read'),
  (req, res) => sensorsController.getGroup(req, res)
);

/**
 * @swagger
 * /api/sensors/groups/{id}:
 *   put:
 *     tags: [Sensor Groups]
 *     summary: Atualizar grupo de sensores
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
 *     responses:
 *       200:
 *         description: Grupo atualizado
 */
router.put('/groups/:id',
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.updateGroup(req, res)
);

/**
 * @swagger
 * /api/sensors/groups/{id}:
 *   delete:
 *     tags: [Sensor Groups]
 *     summary: Excluir grupo de sensores
 *     description: Sensores do grupo ficam sem grupo (não são excluídos)
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
 *         description: Grupo excluído
 */
router.delete('/groups/:id',
  requirePermission('sensors.groups:delete'),
  (req, res) => sensorsController.deleteGroup(req, res)
);

/**
 * @swagger
 * /api/sensors/groups/{id}/sensors:
 *   put:
 *     tags: [Sensor Groups]
 *     summary: Mover sensores para um grupo
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
 *             required: [sensorIds]
 *             properties:
 *               sensorIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Sensores movidos para o grupo
 */
router.put('/groups/:id/sensors',
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.moveSensors(req, res)
);

module.exports = router;

// Rotas de grupos por empresa (para ser usada com /api/companies/:companyId/groups)
const groupsRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/companies/{companyId}/groups:
 *   get:
 *     tags: [Sensor Groups]
 *     summary: Listar grupos de sensores da empresa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de grupos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   sensorCount:
 *                     type: integer
 */
groupsRouter.get('/',
  authenticate,
  requirePermission('sensors.groups:read'),
  (req, res) => sensorsController.listGroups(req, res)
);

/**
 * @swagger
 * /api/companies/{companyId}/groups:
 *   post:
 *     tags: [Sensor Groups]
 *     summary: Criar grupo de sensores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Grupo A"
 *     responses:
 *       201:
 *         description: Grupo criado
 */
groupsRouter.post('/',
  authenticate,
  requirePermission('sensors.groups:write'),
  (req, res) => sensorsController.createGroup(req, res)
);

module.exports.groupsRouter = groupsRouter;
