const authService = require('../../modules/auth/auth.service');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token inválido, mas como é opcional, continua sem autenticação
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth,
};
