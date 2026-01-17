const authService = require('../../modules/auth/auth.service');
const authRepository = require('../../modules/auth/auth.repository');
const { hasPermission } = require('../../config/permissions');
const { getRolePermissions } = require('../../config/roles');

async function getUserPermissions(user) {
  const role = user.userType === 'ambio' ? user.role : user.role;
  let permissions = getRolePermissions(user.userType, role);

  // Se é admin Ambio, buscar módulos assignados
  if (user.userType === 'ambio' && user.role === 'admin') {
    const modules = await authRepository.getAmbioAdminModules(user.sub);
    permissions = modules.flatMap(module => [
      `${module}.*:read`,
      `${module}.*:write`,
      `${module}.*:delete`,
    ]);
  }

  // Adicionar permissões customizadas
  const customPermissions = await authRepository.getUserCustomPermissions(user.sub);
  for (const cp of customPermissions) {
    for (const action of cp.actions) {
      permissions.push(`${cp.resource}:${action}`);
    }
  }

  return [...new Set(permissions)];
}

function requirePermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const permissions = await getUserPermissions(req.user);
      req.userPermissions = permissions;

      if (!hasPermission(permissions, requiredPermission)) {
        return res.status(403).json({
          error: 'Sem permissão para esta ação',
          required: requiredPermission,
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error.message);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
}

function requireAnyPermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const permissions = await getUserPermissions(req.user);
      req.userPermissions = permissions;

      const hasAny = requiredPermissions.some(rp => hasPermission(permissions, rp));

      if (!hasAny) {
        return res.status(403).json({
          error: 'Sem permissão para esta ação',
          required: requiredPermissions,
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error.message);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
}

function requireAllPermissions(requiredPermissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const permissions = await getUserPermissions(req.user);
      req.userPermissions = permissions;

      const hasAll = requiredPermissions.every(rp => hasPermission(permissions, rp));

      if (!hasAll) {
        return res.status(403).json({
          error: 'Sem permissão para esta ação',
          required: requiredPermissions,
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error.message);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
}

// Middleware para verificar acesso a recursos da própria empresa
function requireCompanyAccess(companyIdParam = 'companyId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Usuários Ambio têm acesso a todas as empresas
      if (req.user.userType === 'ambio') {
        return next();
      }

      // Usuários de empresa só podem acessar sua própria empresa
      const requestedCompanyId = req.params[companyIdParam] || req.body[companyIdParam] || req.query[companyIdParam];

      if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Acesso negado a esta empresa' });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar acesso à empresa:', error.message);
      return res.status(500).json({ error: 'Erro ao verificar acesso' });
    }
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireCompanyAccess,
  getUserPermissions,
};
