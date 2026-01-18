const { query } = require('../../database');
const alertsService = require('../alerts/alerts.service');
const notificationsService = require('../notifications/notifications.service');
const sensorsRepository = require('../sensors/sensors.repository');

// Configuracao
const STALE_READING_THRESHOLD_MINUTES = 30; // Ignorar sensores sem leitura recente
const BATCH_SIZE = 100; // Processar em lotes para evitar sobrecarga

/**
 * Worker de Alertas
 *
 * Executa periodicamente (via cron) para:
 * 1. Detectar novas violacoes de limite
 * 2. Resolver alertas quando leituras voltam ao normal
 * 3. Enviar notificacoes pendentes
 */
class AlertWorker {
  constructor() {
    this.isRunning = false;
    this.metrics = this.resetMetrics();
  }

  resetMetrics() {
    return {
      sensorsChecked: 0,
      readingsEvaluated: 0,
      alertsCreated: 0,
      alertsResolved: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
    };
  }

  /**
   * Ponto de entrada principal do worker
   */
  async run() {
    if (this.isRunning) {
      console.warn('[AlertWorker] Ja esta em execucao, pulando...');
      return;
    }

    this.isRunning = true;
    this.metrics = this.resetMetrics();
    let runId = null;

    try {
      console.log('[AlertWorker] Iniciando execucao...');
      runId = await alertsService.startProcessingRun();

      // FASE 1: Detectar novas violacoes
      await this.detectNewViolations();

      // FASE 2: Resolver alertas que voltaram ao normal
      await this.resolveCleared();

      // FASE 3: Enviar notificacoes pendentes
      await this.sendPendingNotifications();

      // Finalizar execucao com sucesso
      await alertsService.completeProcessingRun(runId, this.metrics);

      console.log('[AlertWorker] Execucao concluida:', this.metrics);
    } catch (error) {
      console.error('[AlertWorker] Erro na execucao:', error);

      if (runId) {
        await alertsService.failProcessingRun(runId, [
          { message: error.message, stack: error.stack },
        ]);
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * FASE 1: Detectar novas violacoes
   */
  async detectNewViolations() {
    console.log('[AlertWorker] Fase 1: Detectando novas violacoes...');

    // Buscar sensores com alertas habilitados
    const sensors = await sensorsRepository.findSensorsWithActiveAlerts();
    this.metrics.sensorsChecked = sensors.length;

    if (sensors.length === 0) {
      console.log('[AlertWorker] Nenhum sensor com alertas habilitados');
      return;
    }

    // Processar em lotes
    for (let i = 0; i < sensors.length; i += BATCH_SIZE) {
      const batch = sensors.slice(i, i + BATCH_SIZE);
      await this.processSensorBatch(batch);
    }
  }

  async processSensorBatch(sensors) {
    // Buscar ultimas leituras em batch
    const serialNumbers = sensors.map(s => s.serial_number);
    const readings = await this.getLatestReadingsBatch(serialNumbers);
    const readingMap = new Map(readings.map(r => [r.serial_number, r]));

    for (const sensor of sensors) {
      try {
        const reading = readingMap.get(sensor.serial_number);

        if (!reading) {
          continue; // Sensor sem leituras recentes
        }

        this.metrics.readingsEvaluated++;

        // Obter limites efetivos (sensor ou padrao)
        const thresholds = await alertsService.getEffectiveThresholds(sensor.id);

        // Detectar violacoes
        const violations = alertsService.detectViolations(reading, thresholds);

        for (const violation of violations) {
          // Verificar se ja existe alerta ativo para este tipo
          const existingAlert = await alertsService.findActiveByTypeAndSensor(
            sensor.id,
            violation.type
          );

          if (!existingAlert) {
            // Criar novo alerta
            const alert = await alertsService.createAlert({
              companyId: sensor.company_id,
              sensorId: sensor.id,
              readingId: reading.id,
              violationType: violation.type,
              actualValue: violation.actualValue,
              thresholdValue: violation.thresholdValue,
              thresholdSource: thresholds.source,
            });

            if (alert) {
              this.metrics.alertsCreated++;
              console.log(
                `[AlertWorker] Novo alerta criado: ${sensor.serial_number} - ${violation.type}`
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `[AlertWorker] Erro ao processar sensor ${sensor.serial_number}:`,
          error.message
        );
      }
    }
  }

  /**
   * FASE 2: Resolver alertas que voltaram ao normal
   */
  async resolveCleared() {
    console.log('[AlertWorker] Fase 2: Resolvendo alertas...');

    // Buscar sensores com alertas ativos ou esgotados
    const result = await query(
      `SELECT DISTINCT a.sensor_id, s.serial_number
       FROM alerts a
       JOIN sensors s ON a.sensor_id = s.id
       WHERE a.status IN ('active', 'exhausted')`
    );

    const sensorsWithAlerts = result.rows;

    for (const sensor of sensorsWithAlerts) {
      try {
        // Buscar ultima leitura
        const reading = await this.getLatestReading(sensor.serial_number);

        if (!reading) {
          continue;
        }

        // Buscar alertas nao resolvidos do sensor
        const unresolvedAlerts = await alertsService.findUnresolvedBySensor(sensor.sensor_id);

        // Obter limites efetivos
        const thresholds = await alertsService.getEffectiveThresholds(sensor.sensor_id);

        for (const alert of unresolvedAlerts) {
          // Verificar se leitura resolve a violacao
          const isResolved = alertsService.checkIfReadingResolvesViolation(
            reading,
            alert.violation_type,
            thresholds
          );

          if (isResolved) {
            await alertsService.resolveAlert(alert.id, reading.id);
            this.metrics.alertsResolved++;
            console.log(
              `[AlertWorker] Alerta resolvido: ${sensor.serial_number} - ${alert.violation_type}`
            );
          }
        }
      } catch (error) {
        console.error(
          `[AlertWorker] Erro ao verificar resolucao do sensor ${sensor.serial_number}:`,
          error.message
        );
      }
    }
  }

  /**
   * FASE 3: Enviar notificacoes pendentes
   */
  async sendPendingNotifications() {
    console.log('[AlertWorker] Fase 3: Enviando notificacoes...');

    // Buscar alertas que precisam de notificacao
    const alerts = await alertsService.findPendingNotification(BATCH_SIZE);

    if (alerts.length === 0) {
      console.log('[AlertWorker] Nenhuma notificacao pendente');
      return;
    }

    for (const alert of alerts) {
      try {
        // Verificar se ja esgotou tentativas
        if (alert.notification_count >= 3) {
          await alertsService.markExhausted(alert.id);
          console.log(`[AlertWorker] Alerta esgotado: ${alert.id}`);
          continue;
        }

        // Enviar notificacoes
        const results = await notificationsService.sendAlertNotifications(alert);

        this.metrics.notificationsSent += results.sent;
        this.metrics.notificationsFailed += results.failed;

        // Atualizar tracking do alerta
        const nextNotificationAt = await notificationsService.calculateNextNotificationTime(
          alert.notification_count + 1
        );

        await alertsService.updateNotificationTracking(alert.id, {
          notificationCount: alert.notification_count + 1,
          lastNotificationAt: new Date(),
          nextNotificationAt,
        });

        // Se esgotou tentativas, marcar como exhausted
        if (!nextNotificationAt) {
          await alertsService.markExhausted(alert.id);
        }

        console.log(
          `[AlertWorker] Notificacoes enviadas para alerta ${alert.id}: ` +
          `${results.sent} enviadas, ${results.failed} falhas, ${results.skipped} puladas`
        );
      } catch (error) {
        console.error(
          `[AlertWorker] Erro ao enviar notificacoes do alerta ${alert.id}:`,
          error.message
        );
        this.metrics.notificationsFailed++;
      }
    }
  }

  /**
   * Busca ultima leitura de um sensor (dentro do threshold de tempo)
   */
  async getLatestReading(serialNumber) {
    const result = await query(
      `SELECT * FROM temp_hum_readings
       WHERE serial_number = $1
         AND received_at > NOW() - INTERVAL '${STALE_READING_THRESHOLD_MINUTES} minutes'
       ORDER BY received_at DESC
       LIMIT 1`,
      [serialNumber]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca ultimas leituras em batch
   */
  async getLatestReadingsBatch(serialNumbers) {
    if (serialNumbers.length === 0) {
      return [];
    }

    const result = await query(
      `SELECT DISTINCT ON (serial_number) *
       FROM temp_hum_readings
       WHERE serial_number = ANY($1)
         AND received_at > NOW() - INTERVAL '${STALE_READING_THRESHOLD_MINUTES} minutes'
       ORDER BY serial_number, received_at DESC`,
      [serialNumbers]
    );
    return result.rows;
  }
}

// Exporta instancia singleton
module.exports = new AlertWorker();
