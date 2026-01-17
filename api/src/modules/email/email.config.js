/**
 * Configuração do módulo de email
 * Pode ser sobrescrita via injeção de dependência ou variáveis de ambiente
 */
const config = {
  apiKey: process.env.USESEND_API_KEY,
  url: process.env.USESEND_URL,
  fromEmail: process.env.USESEND_FROM_EMAIL,
  appName: process.env.APP_NAME || 'Ambio',
};

module.exports = config;
