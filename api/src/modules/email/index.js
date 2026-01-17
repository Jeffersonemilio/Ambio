/**
 * Módulo de Email Portátil
 *
 * Este módulo é auto-contido e pode ser facilmente copiado para outros projetos.
 *
 * Uso:
 *   const { emailService } = require('./modules/email');
 *   await emailService.sendWelcome(user, password);
 *
 * Com config customizada:
 *   const { EmailService } = require('./modules/email');
 *   const service = new EmailService({ apiKey: '...', url: '...', fromEmail: '...' });
 */

const emailService = require('./email.service');
const { EmailService } = require('./email.service');
const templates = require('./email.templates');
const config = require('./email.config');

module.exports = {
  // Singleton pronto para usar
  emailService,

  // Classe para criar instância com config customizada
  EmailService,

  // Templates para referência/customização
  templates,

  // Config para referência
  config,
};
