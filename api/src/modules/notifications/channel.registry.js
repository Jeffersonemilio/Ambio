const EmailChannel = require('./channels/email.channel');
const SmsChannel = require('./channels/sms.channel');
const WhatsAppChannel = require('./channels/whatsapp.channel');
const PhoneChannel = require('./channels/phone.channel');

/**
 * Registro de canais de notificacao
 * Permite adicionar/remover canais dinamicamente
 */
class ChannelRegistry {
  constructor() {
    this.channels = new Map();
    this.initializeDefaultChannels();
  }

  initializeDefaultChannels() {
    // Registra canal de email (unico ativo por enquanto)
    this.register('email', new EmailChannel());

    // Registra placeholders para futuros canais
    this.register('sms', new SmsChannel());
    this.register('whatsapp', new WhatsAppChannel());
    this.register('phone', new PhoneChannel());
  }

  /**
   * Registra um canal de notificacao
   * @param {string} name - Nome do canal
   * @param {BaseNotificationChannel} channel - Instancia do canal
   */
  register(name, channel) {
    this.channels.set(name, channel);
  }

  /**
   * Remove um canal do registro
   * @param {string} name - Nome do canal
   */
  unregister(name) {
    this.channels.delete(name);
  }

  /**
   * Obtem um canal pelo nome
   * @param {string} name - Nome do canal
   * @returns {BaseNotificationChannel|undefined}
   */
  get(name) {
    return this.channels.get(name);
  }

  /**
   * Verifica se um canal esta registrado
   * @param {string} name - Nome do canal
   * @returns {boolean}
   */
  has(name) {
    return this.channels.has(name);
  }

  /**
   * Retorna todos os canais registrados
   * @returns {Map<string, BaseNotificationChannel>}
   */
  getAll() {
    return this.channels;
  }

  /**
   * Retorna canais filtrados por uma lista de nomes habilitados
   * @param {string[]} enabledList - Lista de nomes de canais habilitados
   * @returns {BaseNotificationChannel[]}
   */
  getEnabled(enabledList) {
    return enabledList
      .filter(name => this.channels.has(name))
      .map(name => this.channels.get(name));
  }

  /**
   * Lista os nomes de todos os canais registrados
   * @returns {string[]}
   */
  listChannels() {
    return Array.from(this.channels.keys());
  }
}

// Exporta singleton
module.exports = new ChannelRegistry();
