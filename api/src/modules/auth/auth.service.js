const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRepository = require('./auth.repository');
const auditService = require('../audit/audit.service');
const emailService = require('../email/email.service');
const { getRolePermissions } = require('../../config/roles');
const config = require('../../config');

const JWT_SECRET = process.env.JWT_SECRET || 'ambio-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

class AuthService {
  async login(email, password, deviceInfo, ipAddress) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.is_active) {
      throw new Error('Usuário inativo');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, deviceInfo, ipAddress);

    // Atualizar último login
    await authRepository.updateLastLogin(user.id);

    // Audit log
    await auditService.log({
      userId: user.id,
      action: 'login',
      resourceType: 'auth',
      resourceId: user.id,
      details: { deviceInfo },
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new Error('Refresh token inválido ou expirado');
    }

    if (!storedToken.user_is_active) {
      throw new Error('Usuário inativo');
    }

    const user = await authRepository.findUserById(storedToken.user_id);
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      expiresIn: 900,
    };
  }

  async logout(userId, refreshToken, ipAddress) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await authRepository.revokeRefreshToken(tokenHash);
    }

    await auditService.log({
      userId,
      action: 'logout',
      resourceType: 'auth',
      resourceId: userId,
      ipAddress,
    });
  }

  async impersonate(supportUserId, targetUserId, ipAddress) {
    const targetUser = await authRepository.findUserById(targetUserId);

    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    // Gera token com claim de impersonação
    const accessToken = this.generateAccessToken(targetUser, supportUserId);

    await auditService.log({
      userId: targetUserId,
      impersonatedBy: supportUserId,
      action: 'impersonate_start',
      resourceType: 'auth',
      resourceId: targetUserId,
      ipAddress,
    });

    return {
      accessToken,
      expiresIn: 900,
      user: this.sanitizeUser(targetUser),
    };
  }

  async forgotPassword(email) {
    const user = await authRepository.findUserByEmail(email);

    // Não revelar se o email existe ou não
    if (!user) {
      return { message: 'Se o email existir, você receberá instruções de recuperação' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await authRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    // Enviar email com o link de reset
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordReset(user, resetLink);

    return {
      message: 'Se o email existir, você receberá instruções de recuperação',
    };
  }

  async resetPassword(token, newPassword) {
    const tokenHash = this.hashToken(token);
    const resetRecord = await authRepository.findPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new Error('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updateUserPassword(resetRecord.user_id, passwordHash);
    await authRepository.markPasswordResetUsed(resetRecord.id);
    await authRepository.revokeAllUserRefreshTokens(resetRecord.user_id);

    await auditService.log({
      userId: resetRecord.user_id,
      action: 'password_reset',
      resourceType: 'auth',
      resourceId: resetRecord.user_id,
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async adminResetPassword(adminUserId, targetUserId, ipAddress) {
    const targetUser = await authRepository.findUserById(targetUserId);

    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await authRepository.updateUserPassword(targetUserId, passwordHash);
    await authRepository.revokeAllUserRefreshTokens(targetUserId);

    await auditService.log({
      userId: targetUserId,
      action: 'admin_password_reset',
      resourceType: 'user',
      resourceId: targetUserId,
      details: { resetBy: adminUserId },
      ipAddress,
    });

    // Enviar email com a senha temporária
    await emailService.sendTempPassword(targetUser, tempPassword);

    return {
      message: 'Senha resetada com sucesso',
    };
  }

  async getMe(userId) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const permissions = await this.getUserPermissions(user);

    return {
      ...this.sanitizeUser(user),
      permissions,
    };
  }

  // Helpers
  generateAccessToken(user, impersonatedBy = null) {
    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.user_type,
      role: user.user_type === 'ambio' ? user.ambio_role : user.company_role,
      companyId: user.company_id,
    };

    if (impersonatedBy) {
      payload.impersonatedBy = impersonatedBy;
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  async generateRefreshToken(userId, deviceInfo, ipAddress) {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken(userId, tokenHash, deviceInfo, ipAddress, expiresAt);

    return token;
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  async getUserPermissions(user) {
    const role = user.user_type === 'ambio' ? user.ambio_role : user.company_role;
    let permissions = getRolePermissions(user.user_type, role);

    // Se é admin Ambio, buscar módulos assignados
    if (user.user_type === 'ambio' && user.ambio_role === 'admin') {
      const modules = await authRepository.getAmbioAdminModules(user.id);
      permissions = modules.flatMap(module => [
        `${module}.*:read`,
        `${module}.*:write`,
        `${module}.*:delete`,
      ]);
    }

    // Adicionar permissões customizadas
    const customPermissions = await authRepository.getUserCustomPermissions(user.id);
    for (const cp of customPermissions) {
      for (const action of cp.actions) {
        permissions.push(`${cp.resource}:${action}`);
      }
    }

    return [...new Set(permissions)]; // Remove duplicatas
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.user_type,
      role: user.user_type === 'ambio' ? user.ambio_role : user.company_role,
      companyId: user.company_id,
      companyName: user.company_name,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      preferences: user.preferences || {},
    };
  }

  // Profile Management
  async updateProfile(userId, data, ipAddress) {
    const allowedFields = ['name'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    // Validação do nome
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length < 2) {
        throw new Error('Nome deve ter no mínimo 2 caracteres');
      }
      updateData.name = updateData.name.trim();
    }

    const updatedUser = await authRepository.updateUserProfile(userId, updateData);

    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    await auditService.log({
      userId,
      action: 'profile_update',
      resourceType: 'user',
      resourceId: userId,
      details: { fields: Object.keys(updateData) },
      ipAddress,
    });

    return this.sanitizeUser(updatedUser);
  }

  async updateAvatar(userId, avatarUrl, ipAddress) {
    const oldAvatarUrl = await authRepository.getUserAvatarUrl(userId);

    const updatedUser = await authRepository.updateUserProfile(userId, { avatarUrl });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    await auditService.log({
      userId,
      action: 'avatar_update',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return {
      user: this.sanitizeUser(updatedUser),
      oldAvatarUrl,
    };
  }

  async removeAvatar(userId, ipAddress) {
    const oldAvatarUrl = await authRepository.getUserAvatarUrl(userId);

    if (!oldAvatarUrl) {
      throw new Error('Usuário não possui avatar');
    }

    const updatedUser = await authRepository.updateUserProfile(userId, { avatarUrl: null });

    await auditService.log({
      userId,
      action: 'avatar_remove',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return {
      user: this.sanitizeUser(updatedUser),
      oldAvatarUrl,
    };
  }

  async changePassword(userId, currentPassword, newPassword, ipAddress) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Validar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    // Validar nova senha
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Nova senha deve ter no mínimo 8 caracteres');
    }

    // Atualizar senha
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updateUserPassword(userId, passwordHash);

    // Revogar todos os refresh tokens (exceto o atual seria ideal, mas por segurança revogamos todos)
    await authRepository.revokeAllUserRefreshTokens(userId);

    await auditService.log({
      userId,
      action: 'password_change',
      resourceType: 'auth',
      resourceId: userId,
      ipAddress,
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async getPreferences(userId) {
    const preferences = await authRepository.getUserPreferences(userId);
    return preferences;
  }

  async updatePreferences(userId, preferences, ipAddress) {
    // Validar estrutura das preferências
    const validPreferences = {
      notifications: {
        sensor_alerts: preferences?.notifications?.sensor_alerts ?? true,
        periodic_reports: preferences?.notifications?.periodic_reports ?? true,
        system_updates: preferences?.notifications?.system_updates ?? false,
      },
    };

    const updatedUser = await authRepository.updateUserProfile(userId, {
      preferences: validPreferences,
    });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    await auditService.log({
      userId,
      action: 'preferences_update',
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
    });

    return validPreferences;
  }
}

module.exports = new AuthService();
