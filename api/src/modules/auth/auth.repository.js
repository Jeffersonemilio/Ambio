const { query } = require('../../database');

class AuthRepository {
  async findUserByEmail(email) {
    const result = await query(
      `SELECT u.*, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const result = await query(
      `SELECT u.*, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  // Refresh Tokens
  async createRefreshToken(userId, tokenHash, deviceInfo, ipAddress, expiresAt) {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, tokenHash, deviceInfo, ipAddress, expiresAt]
    );
    return result.rows[0];
  }

  async findRefreshToken(tokenHash) {
    const result = await query(
      `SELECT rt.*, u.is_active as user_is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async revokeRefreshToken(tokenHash) {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );
  }

  async revokeAllUserRefreshTokens(userId) {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  // Password Reset
  async createPasswordReset(userId, tokenHash, expiresAt) {
    const result = await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, tokenHash, expiresAt]
    );
    return result.rows[0];
  }

  async findPasswordReset(tokenHash) {
    const result = await query(
      `SELECT pr.*, u.email, u.name
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token_hash = $1
         AND pr.used_at IS NULL
         AND pr.expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async markPasswordResetUsed(id) {
    await query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = $1',
      [id]
    );
  }

  async updateUserPassword(userId, passwordHash) {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
  }

  // User Permissions
  async getUserCustomPermissions(userId) {
    const result = await query(
      'SELECT resource, actions FROM user_permissions WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  async getAmbioAdminModules(userId) {
    const result = await query(
      'SELECT module FROM ambio_admin_modules WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => row.module);
  }

  // Profile Update
  async updateUserProfile(userId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatarUrl);
    }

    if (data.preferences !== undefined) {
      fields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(data.preferences));
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async getUserAvatarUrl(userId) {
    const result = await query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.avatar_url || null;
  }

  async getUserPreferences(userId) {
    const result = await query(
      'SELECT preferences FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.preferences || {};
  }
}

module.exports = new AuthRepository();
