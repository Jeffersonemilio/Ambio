const express = require('express');
const router = express.Router();
const { publishToQueue, QUEUES } = require('../queue');

const VALID_BATTERY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

function validatePayload(body) {
  const errors = [];

  if (!body.serial_number || typeof body.serial_number !== 'string') {
    errors.push('serial_number é obrigatório e deve ser uma string');
  } else if (body.serial_number.length > 50) {
    errors.push('serial_number deve ter no máximo 50 caracteres');
  }

  if (body.temperature === undefined || typeof body.temperature !== 'number') {
    errors.push('temperature é obrigatório e deve ser um número');
  } else if (body.temperature < -50 || body.temperature > 100) {
    errors.push('temperature deve estar entre -50 e 100');
  }

  if (body.humidity === undefined || typeof body.humidity !== 'number') {
    errors.push('humidity é obrigatório e deve ser um número');
  } else if (body.humidity < 0 || body.humidity > 100) {
    errors.push('humidity deve estar entre 0 e 100');
  }

  const batteryLevel = body['battery level'];
  if (!batteryLevel || typeof batteryLevel !== 'string') {
    errors.push('battery level é obrigatório e deve ser uma string');
  } else if (!VALID_BATTERY_LEVELS.includes(batteryLevel.toUpperCase())) {
    errors.push(`battery level deve ser um dos valores: ${VALID_BATTERY_LEVELS.join(', ')}`);
  }

  return errors;
}

/**
 * @swagger
 * /ingest-temp-hum:
 *   post:
 *     summary: Recebe leitura de temperatura e umidade de sensores
 *     description: Endpoint para ingestão de dados de sensores. Os dados são enfileirados para processamento assíncrono.
 *     tags:
 *       - Ingest
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - temperature
 *               - humidity
 *               - battery level
 *             properties:
 *               serial_number:
 *                 type: string
 *                 maxLength: 50
 *                 example: "JV005SMHO000000"
 *                 description: Número de série único do equipamento
 *               temperature:
 *                 type: number
 *                 minimum: -50
 *                 maximum: 100
 *                 example: 22.8
 *                 description: Temperatura em Celsius
 *               humidity:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 64.5
 *                 description: Umidade relativa em percentual
 *               battery level:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: "LOW"
 *                 description: Nível da bateria do sensor
 *     responses:
 *       202:
 *         description: Leitura aceita e enfileirada para processamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Leitura enfileirada com sucesso"
 *                 received_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-16T10:30:00.000Z"
 *       400:
 *         description: Payload inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Erro interno ao processar a requisição
 */
router.post('/ingest-temp-hum', async (req, res) => {
  try {
    const validationErrors = validatePayload(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    const receivedAt = new Date().toISOString();

    const queuedReading = {
      serial_number: req.body.serial_number,
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      battery_level: req.body['battery level'].toUpperCase(),
      received_at: receivedAt,
    };

    const published = await publishToQueue(QUEUES.READINGS_PROCESS, queuedReading);

    if (!published) {
      console.error('Falha ao publicar mensagem na fila');
      return res.status(500).json({
        success: false,
        error: 'Erro ao enfileirar leitura',
      });
    }

    console.log('Leitura enfileirada:', { serial_number: queuedReading.serial_number, received_at: receivedAt });

    return res.status(202).json({
      success: true,
      message: 'Leitura enfileirada com sucesso',
      received_at: receivedAt,
    });
  } catch (error) {
    console.error('Erro ao processar ingestão:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar a requisição',
    });
  }
});

module.exports = router;
