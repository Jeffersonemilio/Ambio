const PERMISSIONS = {
  // Módulo de Usuários
  users: {
    management: ['read', 'write', 'delete'],
    roles: ['read', 'write'],
  },

  // Módulo de Empresas
  companies: {
    management: ['read', 'write', 'delete'],
    sensors: ['read', 'write', 'assign'],
  },

  // Módulo de Sensores
  sensors: {
    management: ['read', 'write', 'delete'],
    readings: ['read'],
    groups: ['read', 'write', 'delete'],
  },

  // Módulo de Notificações
  notifications: {
    management: ['read', 'write', 'delete'],
    alerts: ['read', 'write'],
  },

  // Módulo de Relatórios
  reports: {
    dashboard: ['read'],
    export: ['read'],
  },

  // Módulo de Auditoria
  audit: {
    logs: ['read'],
  },

  // Módulo de Configuracoes do Sistema (apenas Ambio)
  'system-settings': {
    management: ['read', 'write'],
  },
};

function parsePermission(permissionString) {
  // Formato: "module.submodule:action" ou "module.submodule:*" ou "module.*:action"
  const [resourcePart, action] = permissionString.split(':');
  const [module, submodule] = resourcePart.split('.');
  return { module, submodule, action };
}

function buildPermission(module, submodule, action) {
  return `${module}.${submodule}:${action}`;
}

function hasPermission(userPermissions, requiredPermission) {
  // Super admin tem acesso total
  if (userPermissions.includes('*')) {
    return true;
  }

  const { module, submodule, action } = parsePermission(requiredPermission);

  return userPermissions.some(permission => {
    const parsed = parsePermission(permission);

    // Wildcard total no módulo: "module.*:*"
    if (parsed.submodule === '*' && parsed.action === '*' && parsed.module === module) {
      return true;
    }

    // Wildcard na ação: "module.submodule:*"
    if (parsed.module === module && parsed.submodule === submodule && parsed.action === '*') {
      return true;
    }

    // Wildcard no submódulo: "module.*:action"
    if (parsed.module === module && parsed.submodule === '*' && parsed.action === action) {
      return true;
    }

    // Match exato
    return permission === requiredPermission;
  });
}

module.exports = {
  PERMISSIONS,
  parsePermission,
  buildPermission,
  hasPermission,
};
