const systemSettingsRepository = require('./system-settings.repository');
const auditService = require('../audit/audit.service');

class SystemSettingsService {
  async findAll() {
    return systemSettingsRepository.findAll();
  }

  async findByKey(key) {
    return systemSettingsRepository.findByKey(key);
  }

  async update(key, value, requestingUser, ipAddress) {
    // Apenas usuarios Ambio podem atualizar configuracoes do sistema
    if (requestingUser.userType !== 'ambio') {
      throw new Error('Apenas usuarios Ambio podem alterar configuracoes do sistema');
    }

    // Validar configuracoes especificas
    this.validateSetting(key, value);

    const setting = await systemSettingsRepository.upsert(
      key,
      value,
      null,
      requestingUser.sub
    );

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'system_setting',
      resourceId: setting.id,
      details: { key, value },
      ipAddress,
    });

    return setting;
  }

  validateSetting(key, value) {
    if (key === 'alert_defaults') {
      this.validateAlertDefaults(value);
    } else if (key === 'alert_notification_policy') {
      this.validateNotificationPolicy(value);
    }
  }

  validateAlertDefaults(value) {
    const { temperature_min, temperature_max, humidity_min, humidity_max } = value;

    if (temperature_min !== undefined && temperature_max !== undefined) {
      if (temperature_min >= temperature_max) {
        throw new Error('Temperatura minima deve ser menor que maxima');
      }
    }

    if (humidity_min !== undefined && humidity_max !== undefined) {
      if (humidity_min >= humidity_max) {
        throw new Error('Umidade minima deve ser menor que maxima');
      }
    }

    if (humidity_min !== undefined && (humidity_min < 0 || humidity_min > 100)) {
      throw new Error('Umidade minima deve estar entre 0 e 100%');
    }

    if (humidity_max !== undefined && (humidity_max < 0 || humidity_max > 100)) {
      throw new Error('Umidade maxima deve estar entre 0 e 100%');
    }

    if (temperature_min !== undefined && (temperature_min < -50 || temperature_min > 100)) {
      throw new Error('Temperatura minima deve estar entre -50 e 100 graus');
    }

    if (temperature_max !== undefined && (temperature_max < -50 || temperature_max > 100)) {
      throw new Error('Temperatura maxima deve estar entre -50 e 100 graus');
    }
  }

  validateNotificationPolicy(value) {
    const { max_attempts, retry_interval_minutes, enabled_channels } = value;

    if (max_attempts !== undefined && (max_attempts < 1 || max_attempts > 10)) {
      throw new Error('Numero maximo de tentativas deve estar entre 1 e 10');
    }

    if (retry_interval_minutes !== undefined && (retry_interval_minutes < 1 || retry_interval_minutes > 1440)) {
      throw new Error('Intervalo de retry deve estar entre 1 e 1440 minutos');
    }

    if (enabled_channels !== undefined) {
      const validChannels = ['email', 'sms', 'whatsapp', 'phone'];
      const invalidChannels = enabled_channels.filter(c => !validChannels.includes(c));
      if (invalidChannels.length > 0) {
        throw new Error(`Canais invalidos: ${invalidChannels.join(', ')}`);
      }
    }
  }

  // Metodos de acesso tipado
  async getAlertDefaults() {
    return systemSettingsRepository.getAlertDefaults();
  }

  async getNotificationPolicy() {
    return systemSettingsRepository.getNotificationPolicy();
  }
}

module.exports = new SystemSettingsService();
