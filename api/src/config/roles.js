// USUÁRIOS AMBIO
const AMBIO_ROLES = {
  super_admin: ['*'], // Acesso total

  admin: 'assigned_modules', // Só módulos assignados (verificado dinamicamente)

  analyst: [
    'companies.management:read',
    'sensors.management:read',
    'sensors.readings:read',
    'sensors.groups:read',
    'notifications.alerts:read',
    'reports.dashboard:read',
    'reports.export:read',
  ],

  support: [
    'companies.management:read',
    'sensors.management:read',
    'sensors.readings:read',
    'sensors.groups:read',
    'users.management:read',
    'reports.dashboard:read',
    // + impersonate (verificado separadamente)
  ],
};

// USUÁRIOS EMPRESA
const COMPANY_ROLES = {
  admin: [
    'companies.management:read', // Própria empresa apenas (escopo validado no service)
    'users.management:read',
    'users.management:write',
    'users.management:delete',
    'sensors.management:read',
    'sensors.management:write',
    'sensors.management:delete',
    'sensors.groups:read',
    'sensors.groups:write',
    'sensors.groups:delete',
    'sensors.readings:read',
    'notifications.management:read',
    'notifications.management:write',
    'notifications.management:delete',
    'notifications.alerts:read',
    'notifications.alerts:write',
    'reports.dashboard:read',
    'reports.export:read',
  ],

  analyst: [
    'companies.management:read', // Própria empresa apenas (escopo validado no service)
    'sensors.management:read',
    'sensors.groups:read',
    'sensors.readings:read',
    'notifications.alerts:read',
    'reports.dashboard:read',
    'reports.export:read',
  ],

  user: [
    'companies.management:read', // Própria empresa apenas (escopo validado no service)
    'sensors.readings:read',
    'reports.dashboard:read',
  ],
};

function getRolePermissions(userType, role) {
  if (userType === 'ambio') {
    return AMBIO_ROLES[role] || [];
  }
  if (userType === 'company') {
    return COMPANY_ROLES[role] || [];
  }
  return [];
}

function canImpersonate(userType, role) {
  return userType === 'ambio' && (role === 'super_admin' || role === 'support');
}

module.exports = {
  AMBIO_ROLES,
  COMPANY_ROLES,
  getRolePermissions,
  canImpersonate,
};
