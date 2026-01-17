const express = require('express');
const router = express.Router();
const { query } = require('../database');

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Lista sensores únicos com última leitura
 *     description: Retorna todos os sensores que já enviaram dados, com estatísticas
 *     tags:
 *       - Sensors
 *     responses:
 *       200:
 *         description: Lista de sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serial_number:
 *                         type: string
 *                       total_readings:
 *                         type: integer
 *                       first_reading_at:
 *                         type: string
 *                         format: date-time
 *                       last_reading_at:
 *                         type: string
 *                         format: date-time
 *                       last_temperature:
 *                         type: number
 *                       last_humidity:
 *                         type: number
 *                       last_battery_level:
 *                         type: string
 */
router.get('/', async (req, res) => {
  try {
    // Get sensors with aggregated data
    const sensorsResult = await query(`
      SELECT
        serial_number,
        COUNT(*) as total_readings,
        MIN(received_at) as first_reading_at,
        MAX(received_at) as last_reading_at
      FROM temp_hum_readings
      GROUP BY serial_number
      ORDER BY last_reading_at DESC
    `);

    // Get last reading for each sensor
    const sensors = await Promise.all(
      sensorsResult.rows.map(async (sensor) => {
        const lastReadingResult = await query(
          `SELECT temperature, humidity, battery_level, received_at
           FROM temp_hum_readings
           WHERE serial_number = $1
           ORDER BY received_at DESC
           LIMIT 1`,
          [sensor.serial_number]
        );

        const lastReading = lastReadingResult.rows[0];

        return {
          serial_number: sensor.serial_number,
          total_readings: parseInt(sensor.total_readings),
          first_reading_at: sensor.first_reading_at,
          last_reading_at: sensor.last_reading_at,
          last_reading: lastReading
            ? {
                temperature: parseFloat(lastReading.temperature),
                humidity: parseFloat(lastReading.humidity),
                battery_level: lastReading.battery_level,
                received_at: lastReading.received_at,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: sensors,
    });
  } catch (error) {
    console.error('Erro ao buscar sensores:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar sensores' });
  }
});

/**
 * @swagger
 * /api/sensors/{serial_number}:
 *   get:
 *     summary: Busca informações de um sensor específico
 *     tags:
 *       - Sensors
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de série do sensor
 *     responses:
 *       200:
 *         description: Informações do sensor
 *       404:
 *         description: Sensor não encontrado
 */
router.get('/:serial_number', async (req, res) => {
  try {
    const { serial_number } = req.params;

    // Get sensor stats
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_readings,
        MIN(received_at) as first_reading_at,
        MAX(received_at) as last_reading_at,
        ROUND(AVG(temperature)::numeric, 2) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity
       FROM temp_hum_readings
       WHERE serial_number = $1`,
      [serial_number]
    );

    if (parseInt(statsResult.rows[0].total_readings) === 0) {
      return res.status(404).json({ success: false, error: 'Sensor não encontrado' });
    }

    // Get last reading
    const lastReadingResult = await query(
      `SELECT * FROM temp_hum_readings
       WHERE serial_number = $1
       ORDER BY received_at DESC
       LIMIT 1`,
      [serial_number]
    );

    res.json({
      success: true,
      data: {
        serial_number,
        stats: statsResult.rows[0],
        last_reading: lastReadingResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Erro ao buscar sensor:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar sensor' });
  }
});

module.exports = router;
