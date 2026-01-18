const alertsRepository = require('./alerts.repository');
const sensorsRepository = require('../sensors/sensors.repository');
const systemSettingsService = require('../system-settings/system-settings.service');

class AlertsService {
  async findAll(filters, pagination, requestingUser) {
    // Usuarios de empresa so podem ver alertas da sua empresa
    if (requestingUser.userType === 'company') {
      filters.companyId = requestingUser.companyId;
    }

    return alertsRepository.findAll(filters, pagination);
  }

  async findById(id, requestingUser) {
    const alert = await alertsRepository.findById(id);

    if (!alert) {
      return null;
    }

    // Usuarios de empresa so podem ver alertas da sua empresa
    if (requestingUser.userType === 'company' && alert.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return alert;
  }

  async findActiveByCompany(companyId, requestingUser) {
    // Usuarios de empresa so podem ver alertas da sua empresa
    if (requestingUser.userType === 'company' && companyId !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return alertsRepository.findActiveByCompany(companyId);
  }

  async getStatistics(filters, requestingUser) {
    // Usuarios de empresa so podem ver estatisticas da sua empresa
    if (requestingUser.userType === 'company') {
      filters.companyId = requestingUser.companyId;
    }

    if (filters.sensorId) {
      return alertsRepository.getStatsBySensor(filters.sensorId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.companyId) {
      return alertsRepository.getStatsByCompany(filters.companyId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    throw new Error('Filtro companyId ou sensorId e obrigatorio');
  }

  // === Metodos utilizados pelo Worker ===

  async getEffectiveThresholds(sensorId) {
    // Primeiro tenta obter configuracao especifica do sensor
    const sensorConfig = await sensorsRepository.findConfigurationBySensorId(sensorId);

    if (sensorConfig) {
      const hasCustomThresholds =
        sensorConfig.temperature_min !== null ||
        sensorConfig.temperature_max !== null ||
        sensorConfig.humidity_min !== null ||
        sensorConfig.humidity_max !== null;

      if (hasCustomThresholds) {
        return {
          source: 'sensor_config',
          temperature_min: sensorConfig.temperature_min,
          temperature_max: sensorConfig.temperature_max,
          humidity_min: sensorConfig.humidity_min,
          humidity_max: sensorConfig.humidity_max,
        };
      }
    }

    // Fallback para configuracoes padrao do sistema
    const defaults = await systemSettingsService.getAlertDefaults();
    return {
      source: 'system_default',
      ...defaults,
    };
  }

  detectViolations(reading, thresholds) {
    const violations = [];

    // Verificar temperatura minima
    if (thresholds.temperature_min !== null && thresholds.temperature_min !== undefined) {
      if (reading.temperature < thresholds.temperature_min) {
        violations.push({
          type: 'temperature_min',
          actualValue: reading.temperature,
          thresholdValue: thresholds.temperature_min,
        });
      }
    }

    // Verificar temperatura maxima
    if (thresholds.temperature_max !== null && thresholds.temperature_max !== undefined) {
      if (reading.temperature > thresholds.temperature_max) {
        violations.push({
          type: 'temperature_max',
          actualValue: reading.temperature,
          thresholdValue: thresholds.temperature_max,
        });
      }
    }

    // Verificar umidade minima
    if (thresholds.humidity_min !== null && thresholds.humidity_min !== undefined) {
      if (reading.humidity < thresholds.humidity_min) {
        violations.push({
          type: 'humidity_min',
          actualValue: reading.humidity,
          thresholdValue: thresholds.humidity_min,
        });
      }
    }

    // Verificar umidade maxima
    if (thresholds.humidity_max !== null && thresholds.humidity_max !== undefined) {
      if (reading.humidity > thresholds.humidity_max) {
        violations.push({
          type: 'humidity_max',
          actualValue: reading.humidity,
          thresholdValue: thresholds.humidity_max,
        });
      }
    }

    return violations;
  }

  checkIfReadingResolvesViolation(reading, violationType, thresholds) {
    switch (violationType) {
      case 'temperature_min':
        return thresholds.temperature_min === null ||
               thresholds.temperature_min === undefined ||
               reading.temperature >= thresholds.temperature_min;

      case 'temperature_max':
        return thresholds.temperature_max === null ||
               thresholds.temperature_max === undefined ||
               reading.temperature <= thresholds.temperature_max;

      case 'humidity_min':
        return thresholds.humidity_min === null ||
               thresholds.humidity_min === undefined ||
               reading.humidity >= thresholds.humidity_min;

      case 'humidity_max':
        return thresholds.humidity_max === null ||
               thresholds.humidity_max === undefined ||
               reading.humidity <= thresholds.humidity_max;

      default:
        return false;
    }
  }

  async createAlert(data) {
    return alertsRepository.create(data);
  }

  async resolveAlert(alertId, resolvedByReadingId) {
    return alertsRepository.markResolved(alertId, resolvedByReadingId);
  }

  async markExhausted(alertId) {
    return alertsRepository.markExhausted(alertId);
  }

  async updateNotificationTracking(alertId, data) {
    return alertsRepository.updateNotificationTracking(alertId, data);
  }

  async findActiveByTypeAndSensor(sensorId, violationType) {
    return alertsRepository.findActiveByTypeAndSensor(sensorId, violationType);
  }

  async findUnresolvedBySensor(sensorId) {
    return alertsRepository.findUnresolvedBySensor(sensorId);
  }

  async findPendingNotification(limit = 100) {
    return alertsRepository.findPendingNotification(limit);
  }

  // Processamento
  async startProcessingRun() {
    return alertsRepository.startProcessingRun();
  }

  async completeProcessingRun(runId, metrics) {
    return alertsRepository.completeProcessingRun(runId, metrics);
  }

  async failProcessingRun(runId, errors) {
    return alertsRepository.failProcessingRun(runId, errors);
  }
}

module.exports = new AlertsService();
