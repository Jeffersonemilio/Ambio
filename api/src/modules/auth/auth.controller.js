const authService = require('./auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const deviceInfo = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login(email, password, deviceInfo, ipAddress);
      res.json(result);
    } catch (error) {
      console.error('Erro no login:', error.message);
      res.status(401).json({ error: error.message });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token é obrigatório' });
      }

      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (error) {
      console.error('Erro no refresh:', error.message);
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await authService.logout(req.user.sub, refreshToken, ipAddress);
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error.message);
      res.status(500).json({ error: 'Erro ao realizar logout' });
    }
  }

  async impersonate(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await authService.impersonate(req.user.sub, userId, ipAddress);
      res.json(result);
    } catch (error) {
      console.error('Erro no impersonate:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async endImpersonate(req, res) {
    try {
      // Simplesmente retorna os dados do usuário original
      // O frontend deve usar o token original guardado
      res.json({ message: 'Impersonação encerrada' });
    } catch (error) {
      console.error('Erro ao encerrar impersonate:', error.message);
      res.status(500).json({ error: 'Erro ao encerrar impersonação' });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      console.error('Erro no forgot password:', error.message);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
      }

      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Erro no reset password:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async adminResetPassword(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await authService.adminResetPassword(req.user.sub, userId, ipAddress);
      res.json(result);
    } catch (error) {
      console.error('Erro no admin reset password:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async me(req, res) {
    try {
      const result = await authService.getMe(req.user.sub);
      res.json(result);
    } catch (error) {
      console.error('Erro no me:', error.message);
      res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
  }
}

module.exports = new AuthController();
