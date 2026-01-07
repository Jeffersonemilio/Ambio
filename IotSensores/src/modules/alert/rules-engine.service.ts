import { logger } from '../../shared/logger/index.js';
import { Reading, BatteryLevel } from '../reading/reading.entity.js';
import { Rule, RuleCondition } from '../rule/rule.entity.js';
import { RuleRepository } from '../rule/rule.repository.js';
import { Alert, AlertType, CreateAlertDTO } from './alert.entity.js';
import { AlertRepository } from './alert.repository.js';
import { CooldownRepository } from './cooldown.repository.js';

export interface RuleViolation {
  rule: Rule;
  reading: Reading;
  actualValue: number;
  threshold: number;
  message: string;
  alertType: AlertType;
}

const BATTERY_LEVEL_VALUES: Record<BatteryLevel, number> = {
  HIGH: 100,
  MEDIUM: 50,
  LOW: 20,
  CRITICAL: 5,
};

export class RulesEngineService {
  private ruleRepository: RuleRepository;
  private alertRepository: AlertRepository;
  private cooldownRepository: CooldownRepository;

  constructor() {
    this.ruleRepository = new RuleRepository();
    this.alertRepository = new AlertRepository();
    this.cooldownRepository = new CooldownRepository();
  }

  async evaluate(reading: Reading): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get all active rules for this sensor (including tenant-wide rules)
    const rules = await this.ruleRepository.findBySensorId(reading.sensor_id, reading.tenant_id);

    logger.debug(
      { sensorId: reading.sensor_id, rulesCount: rules.length },
      'Evaluating rules for reading'
    );

    for (const rule of rules) {
      const violation = this.checkViolation(reading, rule);

      if (violation) {
        // Check cooldown
        const inCooldown = await this.cooldownRepository.isInCooldown(
          reading.sensor_id,
          rule.id,
          rule.cooldown_minutes
        );

        if (inCooldown) {
          logger.debug(
            { ruleId: rule.id, sensorId: reading.sensor_id },
            'Rule violation skipped due to cooldown'
          );
          continue;
        }

        // Create alert
        const alertData: CreateAlertDTO = {
          tenant_id: reading.tenant_id,
          sensor_id: reading.sensor_id,
          reading_id: reading.id,
          rule_id: rule.id,
          type: violation.alertType,
          severity: rule.severity,
          title: this.generateTitle(violation),
          message: violation.message,
          value: violation.actualValue,
          threshold: violation.threshold,
          metadata: {
            serial_number: reading.serial_number,
            rule_name: rule.name,
            rule_condition: rule.condition,
          },
        };

        const alert = await this.alertRepository.create(alertData);
        alerts.push(alert);

        // Update cooldown
        await this.cooldownRepository.upsert(reading.sensor_id, rule.id);

        logger.info(
          {
            alertId: alert.id,
            ruleId: rule.id,
            type: violation.alertType,
            severity: rule.severity,
            value: violation.actualValue,
            threshold: violation.threshold,
          },
          'Alert created from rule violation'
        );
      }
    }

    // Check battery-specific alerts (always active)
    const batteryAlert = await this.checkBattery(reading);
    if (batteryAlert) {
      alerts.push(batteryAlert);
    }

    return alerts;
  }

  private checkViolation(reading: Reading, rule: Rule): RuleViolation | null {
    let actualValue: number;
    let alertType: AlertType;

    switch (rule.type) {
      case 'TEMPERATURE':
        actualValue = reading.temperature;
        alertType = this.getTemperatureAlertType(rule.condition);
        break;
      case 'HUMIDITY':
        actualValue = reading.humidity;
        alertType = this.getHumidityAlertType(rule.condition);
        break;
      case 'BATTERY':
        actualValue = BATTERY_LEVEL_VALUES[reading.battery_level];
        alertType = actualValue <= 10 ? 'BATTERY_CRITICAL' : 'BATTERY_LOW';
        break;
      default:
        return null;
    }

    const isViolation = this.evaluateCondition(
      actualValue,
      rule.condition,
      rule.threshold_min,
      rule.threshold_max
    );

    if (!isViolation) {
      return null;
    }

    const threshold = this.getRelevantThreshold(rule);

    return {
      rule,
      reading,
      actualValue,
      threshold,
      alertType,
      message: this.generateMessage(rule, actualValue, threshold),
    };
  }

  private evaluateCondition(
    value: number,
    condition: RuleCondition,
    min: number | null,
    max: number | null
  ): boolean {
    switch (condition) {
      case 'ABOVE':
        return max !== null && value > max;
      case 'BELOW':
        return min !== null && value < min;
      case 'BETWEEN':
        // BETWEEN means value should be within range - violation if outside
        return (min !== null && value < min) || (max !== null && value > max);
      case 'OUTSIDE':
        // OUTSIDE triggers when value is outside the range
        return (min !== null && value < min) || (max !== null && value > max);
      default:
        return false;
    }
  }

  private getTemperatureAlertType(condition: RuleCondition): AlertType {
    switch (condition) {
      case 'ABOVE':
        return 'TEMPERATURE_HIGH';
      case 'BELOW':
        return 'TEMPERATURE_LOW';
      case 'BETWEEN':
      case 'OUTSIDE':
      default:
        return 'TEMPERATURE_HIGH'; // Default, will be refined in message
    }
  }

  private getHumidityAlertType(condition: RuleCondition): AlertType {
    switch (condition) {
      case 'ABOVE':
        return 'HUMIDITY_HIGH';
      case 'BELOW':
        return 'HUMIDITY_LOW';
      case 'BETWEEN':
      case 'OUTSIDE':
      default:
        return 'HUMIDITY_HIGH';
    }
  }

  private getRelevantThreshold(rule: Rule): number {
    switch (rule.condition) {
      case 'ABOVE':
        return rule.threshold_max ?? 0;
      case 'BELOW':
        return rule.threshold_min ?? 0;
      default:
        return rule.threshold_max ?? rule.threshold_min ?? 0;
    }
  }

  private generateTitle(violation: RuleViolation): string {
    const typeLabels: Record<AlertType, string> = {
      TEMPERATURE_HIGH: 'Temperatura acima do limite',
      TEMPERATURE_LOW: 'Temperatura abaixo do limite',
      HUMIDITY_HIGH: 'Umidade acima do limite',
      HUMIDITY_LOW: 'Umidade abaixo do limite',
      BATTERY_LOW: 'Bateria baixa',
      BATTERY_CRITICAL: 'Bateria crítica',
      SENSOR_OFFLINE: 'Sensor offline',
    };

    return typeLabels[violation.alertType] || 'Alerta';
  }

  private generateMessage(rule: Rule, actualValue: number, threshold: number): string {
    const unit = rule.type === 'TEMPERATURE' ? '°C' : rule.type === 'HUMIDITY' ? '%' : '%';

    switch (rule.condition) {
      case 'ABOVE':
        return `Valor atual: ${actualValue}${unit}. Limite máximo: ${threshold}${unit}. Regra: ${rule.name}`;
      case 'BELOW':
        return `Valor atual: ${actualValue}${unit}. Limite mínimo: ${threshold}${unit}. Regra: ${rule.name}`;
      case 'OUTSIDE':
        return `Valor atual: ${actualValue}${unit}. Faixa permitida: ${rule.threshold_min}${unit} - ${rule.threshold_max}${unit}. Regra: ${rule.name}`;
      default:
        return `Valor atual: ${actualValue}${unit}. Limite: ${threshold}${unit}. Regra: ${rule.name}`;
    }
  }

  private async checkBattery(reading: Reading): Promise<Alert | null> {
    // Only create alert for CRITICAL battery, LOW is handled by rules
    if (reading.battery_level !== 'CRITICAL') {
      return null;
    }

    // Check if there's already an open battery alert
    const existingAlert = await this.alertRepository.findOpenBySensor(
      reading.sensor_id,
      'BATTERY_CRITICAL'
    );

    if (existingAlert) {
      return null;
    }

    const alert = await this.alertRepository.create({
      tenant_id: reading.tenant_id,
      sensor_id: reading.sensor_id,
      reading_id: reading.id,
      type: 'BATTERY_CRITICAL',
      severity: 'CRITICAL',
      title: 'Bateria crítica',
      message: `Nível de bateria crítico. Substitua a bateria imediatamente.`,
      value: BATTERY_LEVEL_VALUES.CRITICAL,
      threshold: 10,
      metadata: {
        serial_number: reading.serial_number,
        battery_level: reading.battery_level,
      },
    });

    logger.info(
      { alertId: alert.id, sensorId: reading.sensor_id },
      'Battery critical alert created'
    );

    return alert;
  }
}
