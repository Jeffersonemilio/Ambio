const { Router } = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requirePermission } = require('../../shared/middlewares/permission.middleware');
const { canImpersonate } = require('../../config/roles');

const router = Router();

// Rotas públicas
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// Rotas autenticadas
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.get('/me', authenticate, (req, res) => authController.me(req, res));

// Rotas de impersonate (apenas suporte/super_admin)
router.post('/impersonate', authenticate, (req, res, next) => {
  if (!canImpersonate(req.user.userType, req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para impersonar usuários' });
  }
  next();
}, (req, res) => authController.impersonate(req, res));

router.post('/end-impersonate', authenticate, (req, res) => authController.endImpersonate(req, res));

// Reset de senha por admin
router.post('/admin-reset-password',
  authenticate,
  requirePermission('users.management:write'),
  (req, res) => authController.adminResetPassword(req, res)
);

module.exports = router;
