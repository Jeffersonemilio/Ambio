const { Router } = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');
const { uploadAvatar } = require('../../shared/middlewares/upload.middleware');
const { canImpersonate } = require('../../config/roles');

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Fazer login
 *     description: Autentica o usuário e retorna tokens JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ambio.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 refreshToken:
 *                   type: string
 *                   description: Token para renovar o accessToken
 *                 expiresIn:
 *                   type: integer
 *                   description: Tempo de expiração em segundos
 *                   example: 900
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar token
 *     description: Renova o accessToken usando o refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       401:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', (req, res) => authController.refresh(req, res));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar reset de senha
 *     description: Envia email com link para redefinir senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Se o email existir, instruções serão enviadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Redefinir senha
 *     description: Redefine a senha usando o token recebido por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token recebido por email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Fazer logout
 *     description: Invalida o refresh token atual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout realizado
 *       401:
 *         description: Não autenticado
 */
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obter usuário atual
 *     description: Retorna dados do usuário autenticado e suas permissões
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Não autenticado
 */
router.get('/me', authenticate, (req, res) => authController.me(req, res));

/**
 * @swagger
 * /api/auth/impersonate:
 *   post:
 *     tags: [Auth]
 *     summary: Impersonar usuário
 *     description: Permite que suporte/super_admin acesse como outro usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Token de impersonação gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Sem permissão para impersonar
 */
router.post('/impersonate', authenticate, (req, res, next) => {
  if (!canImpersonate(req.user.userType, req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para impersonar usuários' });
  }
  next();
}, (req, res) => authController.impersonate(req, res));

/**
 * @swagger
 * /api/auth/end-impersonate:
 *   post:
 *     tags: [Auth]
 *     summary: Encerrar impersonação
 *     description: Retorna ao token original do usuário de suporte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Impersonação encerrada
 */
router.post('/end-impersonate', authenticate, (req, res) => authController.endImpersonate(req, res));

/**
 * @swagger
 * /api/auth/admin-reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset de senha por admin
 *     description: Admin redefine a senha de um usuário (gera senha temporária)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Senha resetada (email enviado ao usuário)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Sem permissão
 */
router.post('/admin-reset-password',
  authenticate,
  requirePermission('users.management:write'),
  (req, res) => authController.adminResetPassword(req, res)
);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Atualizar perfil próprio
 *     description: Permite ao usuário atualizar seu próprio nome
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "João Silva"
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
router.put('/me', authenticate, (req, res) => authController.updateProfile(req, res));

/**
 * @swagger
 * /api/auth/me/avatar:
 *   post:
 *     tags: [Auth]
 *     summary: Upload de avatar
 *     description: Faz upload de uma imagem de avatar para o usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Imagem JPG, PNG ou WebP (máx 2MB)
 *     responses:
 *       200:
 *         description: Avatar atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 avatarUrl:
 *                   type: string
 *       400:
 *         description: Arquivo inválido ou erro no upload
 *       401:
 *         description: Não autenticado
 */
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), (req, res) => authController.uploadAvatar(req, res));

/**
 * @swagger
 * /api/auth/me/avatar:
 *   delete:
 *     tags: [Auth]
 *     summary: Remover avatar
 *     description: Remove o avatar do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Usuário não possui avatar
 *       401:
 *         description: Não autenticado
 */
router.delete('/me/avatar', authenticate, (req, res) => authController.removeAvatar(req, res));

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Alterar senha própria
 *     description: Permite ao usuário alterar sua própria senha
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Senha atual incorreta ou nova senha inválida
 *       401:
 *         description: Não autenticado
 */
router.post('/change-password', authenticate, (req, res) => authController.changePassword(req, res));

/**
 * @swagger
 * /api/auth/me/preferences:
 *   get:
 *     tags: [Auth]
 *     summary: Obter preferências do usuário
 *     description: Retorna as preferências de notificação do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferências do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: object
 *                   properties:
 *                     sensor_alerts:
 *                       type: boolean
 *                     periodic_reports:
 *                       type: boolean
 *                     system_updates:
 *                       type: boolean
 *       401:
 *         description: Não autenticado
 */
router.get('/me/preferences', authenticate, (req, res) => authController.getPreferences(req, res));

/**
 * @swagger
 * /api/auth/me/preferences:
 *   put:
 *     tags: [Auth]
 *     summary: Atualizar preferências do usuário
 *     description: Atualiza as preferências de notificação do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   sensor_alerts:
 *                     type: boolean
 *                   periodic_reports:
 *                     type: boolean
 *                   system_updates:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferências atualizadas
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
router.put('/me/preferences', authenticate, (req, res) => authController.updatePreferences(req, res));

module.exports = router;
