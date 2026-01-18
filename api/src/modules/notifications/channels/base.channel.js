/**
 * Classe base abstrata para canais de notificacao
 * Todos os canais (email, sms, whatsapp, phone) devem estender esta classe
 */
class BaseNotificationChannel {
  constructor(name) {
    if (this.constructor === BaseNotificationChannel) {
      throw new Error('BaseNotificationChannel nao pode ser instanciada diretamente');
    }
    this.name = name;
  }

  /**
   * Envia uma notificacao de alerta
   * @param {Object} alert - Dados do alerta
   * @param {Object} recipient - Dados do destinatario (user)
   * @returns {Promise<{success: boolean, providerResponse?: any, error?: string}>}
   */
  async send(alert, recipient) {
    throw new Error('Metodo send() deve ser implementado pela subclasse');
  }

  /**
   * Obtem o endereco do destinatario para este canal
   * @param {Object} user - Usuario
   * @returns {string} Endereco (email, telefone, etc)
   */
  getRecipientAddress(user) {
    throw new Error('Metodo getRecipientAddress() deve ser implementado pela subclasse');
  }

  /**
   * Verifica se o canal esta disponivel para o usuario
   * @param {Object} user - Usuario
   * @returns {boolean}
   */
  isAvailableForUser(user) {
    return true;
  }

  /**
   * Envia notificacao com tracking de resultado
   * @param {Object} alert - Dados do alerta
   * @param {Object} recipient - Dados do destinatario
   * @returns {Promise<{success: boolean, providerResponse?: any, error?: string}>}
   */
  async sendWithTracking(alert, recipient) {
    try {
      const result = await this.send(alert, recipient);
      return {
        success: true,
        providerResponse: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Formata o tipo de violacao para exibicao
   * @param {string} violationType
   * @returns {string}
   */
  formatViolationType(violationType) {
    const labels = {
      temperature_min: 'Temperatura abaixo do minimo',
      temperature_max: 'Temperatura acima do maximo',
      humidity_min: 'Umidade abaixo do minimo',
      humidity_max: 'Umidade acima do maximo',
    };
    return labels[violationType] || violationType;
  }

  /**
   * Formata valor com unidade apropriada
   * @param {string} violationType
   * @param {number} value
   * @returns {string}
   */
  formatValue(violationType, value) {
    if (violationType.startsWith('temperature')) {
      return `${value}°C`;
    }
    if (violationType.startsWith('humidity')) {
      return `${value}%`;
    }
    return String(value);
  }
}

module.exports = BaseNotificationChannel;
