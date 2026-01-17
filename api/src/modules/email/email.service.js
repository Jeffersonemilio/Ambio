const { UseSend } = require('usesend-js');
const defaultConfig = require('./email.config');
const templates = require('./email.templates');

/**
 * Serviço de email portátil usando useSend
 *
 * Uso básico:
 *   const emailService = require('./email').emailService;
 *   await emailService.sendWelcome(user, password);
 *
 * Uso com config customizada:
 *   const { EmailService } = require('./email');
 *   const customService = new EmailService({ apiKey: '...', url: '...', fromEmail: '...' });
 */
class EmailService {
  constructor(customConfig = null) {
    const cfg = customConfig || defaultConfig;
    this.config = cfg;
    this.client = cfg.apiKey ? new UseSend(cfg.apiKey, cfg.url) : null;

    if (!this.client) {
      console.warn('[Email] API key não configurada - emails não serão enviados');
    }
  }

  /**
   * Envia um email genérico
   * @param {Object} options - { to, subject, html, text }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async send({ to, subject, html, text }) {
    if (!this.client) {
      console.warn(`[Email] Cliente não configurado - email para ${to} não enviado`);
      return { success: false, error: 'Email não configurado' };
    }

    try {
      await this.client.emails.send({
        to,
        from: this.config.fromEmail,
        subject,
        html,
        text,
      });
      console.log(`[Email] Enviado para ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      console.error(`[Email] Erro ao enviar para ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envia email de boas-vindas para novo usuário
   * @param {Object} user - { email, name }
   * @param {string|null} password - Senha para incluir no email (opcional)
   */
  async sendWelcome(user, password = null) {
    const template = templates.welcome(user, password, this.config.appName);
    return this.send({ to: user.email, ...template });
  }

  /**
   * Envia email de reset de senha com link
   * @param {Object} user - { email, name }
   * @param {string} resetLink - Link para reset de senha
   */
  async sendPasswordReset(user, resetLink) {
    const template = templates.passwordReset(user, resetLink, this.config.appName);
    return this.send({ to: user.email, ...template });
  }

  /**
   * Envia email com senha temporária (reset por admin)
   * @param {Object} user - { email, name }
   * @param {string} tempPassword - Senha temporária
   */
  async sendTempPassword(user, tempPassword) {
    const template = templates.tempPassword(user, tempPassword, this.config.appName);
    return this.send({ to: user.email, ...template });
  }
}

// Exporta singleton e classe
module.exports = new EmailService();
module.exports.EmailService = EmailService;
