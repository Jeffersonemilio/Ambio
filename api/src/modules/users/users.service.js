const bcrypt = require('bcrypt');
const usersRepository = require('./users.repository');
const auditService = require('../audit/audit.service');
const { emailService } = require('../email');

class UsersService {
  async findAll(filters, pagination, requestingUser) {
    // Usuários de empresa só podem ver usuários da sua empresa
    if (requestingUser.userType === 'company') {
      filters.companyId = requestingUser.companyId;
    }

    return usersRepository.findAll(filters, pagination);
  }

  async findById(id, requestingUser) {
    const user = await usersRepository.findById(id);

    if (!user) {
      return null;
    }

    // Usuários de empresa só podem ver usuários da sua empresa
    if (requestingUser.userType === 'company' && user.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return user;
  }

  async create(data, requestingUser, ipAddress) {
    // Verificar se email já existe
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Validar regras de criação
    this.validateUserCreation(data, requestingUser);

    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await usersRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      userType: data.userType,
      ambioRole: data.ambioRole,
      companyId: data.companyId,
      companyRole: data.companyRole,
    });

    await auditService.log({
      userId: requestingUser.sub,
      action: 'create',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email, userType: user.user_type },
      ipAddress,
    });

    // Enviar email de boas-vindas com a senha
    await emailService.sendWelcome(user, data.password);

    return user;
  }

  async update(id, data, requestingUser, ipAddress) {
    const existingUser = await usersRepository.findById(id);

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Validar acesso
    this.validateUserAccess(existingUser, requestingUser);

    // Validar alterações
    this.validateUserUpdate(data, existingUser, requestingUser);

    // Se email está sendo alterado, verificar duplicidade
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await usersRepository.findByEmail(data.email);
      if (emailExists) {
        throw new Error('Email já cadastrado');
      }
    }

    const updatedUser = await usersRepository.update(id, data);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'user',
      resourceId: id,
      details: { changes: data },
      ipAddress,
    });

    return updatedUser;
  }

  async delete(id, requestingUser, ipAddress) {
    const existingUser = await usersRepository.findById(id);

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Não pode deletar a si mesmo
    if (id === requestingUser.sub) {
      throw new Error('Não é possível deletar seu próprio usuário');
    }

    // Validar acesso
    this.validateUserAccess(existingUser, requestingUser);

    await usersRepository.delete(id);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'delete',
      resourceType: 'user',
      resourceId: id,
      details: { email: existingUser.email },
      ipAddress,
    });

    return true;
  }

  // Permissões customizadas
  async getUserPermissions(userId, requestingUser) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    this.validateUserAccess(user, requestingUser);

    return usersRepository.getUserPermissions(userId);
  }

  async setUserPermission(userId, resource, actions, requestingUser, ipAddress) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    this.validateUserAccess(user, requestingUser);

    const permission = await usersRepository.setUserPermission(userId, resource, actions, requestingUser.sub);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'user_permission',
      resourceId: userId,
      details: { resource, actions },
      ipAddress,
    });

    return permission;
  }

  async removeUserPermission(userId, resource, requestingUser, ipAddress) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    this.validateUserAccess(user, requestingUser);

    await usersRepository.removeUserPermission(userId, resource);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'delete',
      resourceType: 'user_permission',
      resourceId: userId,
      details: { resource },
      ipAddress,
    });

    return true;
  }

  // Módulos para admin Ambio
  async getAdminModules(userId) {
    return usersRepository.getAdminModules(userId);
  }

  async assignAdminModule(userId, module, requestingUser, ipAddress) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.user_type !== 'ambio' || user.ambio_role !== 'admin') {
      throw new Error('Apenas admins Ambio podem receber módulos');
    }

    const result = await usersRepository.assignAdminModule(userId, module, requestingUser.sub);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'assign_module',
      resourceType: 'user',
      resourceId: userId,
      details: { module },
      ipAddress,
    });

    return result;
  }

  async removeAdminModule(userId, module, requestingUser, ipAddress) {
    await usersRepository.removeAdminModule(userId, module);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'remove_module',
      resourceType: 'user',
      resourceId: userId,
      details: { module },
      ipAddress,
    });

    return true;
  }

  // Validações
  validateUserCreation(data, requestingUser) {
    // Usuários de empresa só podem criar usuários para sua empresa
    if (requestingUser.userType === 'company') {
      if (data.userType !== 'company') {
        throw new Error('Você só pode criar usuários de empresa');
      }
      if (data.companyId && data.companyId !== requestingUser.companyId) {
        throw new Error('Você só pode criar usuários para sua empresa');
      }
      data.companyId = requestingUser.companyId;
    }

    // Apenas super_admin pode criar usuários Ambio
    if (data.userType === 'ambio') {
      if (requestingUser.userType !== 'ambio' || requestingUser.role !== 'super_admin') {
        throw new Error('Apenas super admin pode criar usuários Ambio');
      }
    }
  }

  validateUserAccess(user, requestingUser) {
    // Super admin tem acesso total
    if (requestingUser.userType === 'ambio' && requestingUser.role === 'super_admin') {
      return;
    }

    // Usuários de empresa só podem acessar usuários da sua empresa
    if (requestingUser.userType === 'company') {
      if (user.company_id !== requestingUser.companyId) {
        throw new Error('Acesso negado');
      }
    }

    // Admin Ambio só pode acessar se tiver módulo de users
    // (verificado pelo middleware de permissão)
  }

  validateUserUpdate(data, existingUser, requestingUser) {
    // Não pode alterar userType
    if (data.userType && data.userType !== existingUser.user_type) {
      throw new Error('Não é possível alterar o tipo de usuário');
    }

    // Usuário de empresa não pode alterar roles de admin
    if (requestingUser.userType === 'company') {
      if (data.companyRole === 'admin' && existingUser.company_role !== 'admin') {
        throw new Error('Você não pode promover um usuário a admin');
      }
    }

    // Apenas super_admin pode alterar roles Ambio
    if (data.ambioRole && data.ambioRole !== existingUser.ambio_role) {
      if (requestingUser.userType !== 'ambio' || requestingUser.role !== 'super_admin') {
        throw new Error('Apenas super admin pode alterar roles Ambio');
      }
    }
  }
}

module.exports = new UsersService();
