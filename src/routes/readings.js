const express = require('express');
const router = express.Router();
const { query } = require('../database');

/**
 * @swagger
 * /api/readings:
 *   get:
 *     summary: Lista leituras de sensores com filtros e paginação
 *     description: Retorna leituras de temperatura e umidade com opções de filtro
 *     tags:
 *       - Readings
 *     parameters:
 *       - in: query
 *         name: serial_number
 *         schema:
 *           type: string
 *         description: Filtrar por número de série do sensor
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial (ISO8601)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final (ISO8601)
 *       - in: query
 *         name: min_temp
 *         schema:
 *           type: number
 *         description: Temperatura mínima
 *       - in: query
 *         name: max_temp
 *         schema:
 *           type: number
 *         description: Temperatura máxima
 *       - in: query
 *         name: min_humidity
 *         schema:
 *           type: number
 *         description: Umidade mínima
 *       - in: query
 *         name: max_humidity
 *         schema:
 *           type: number
 *         description: Umidade máxima
 *       - in: query
 *         name: battery_level
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Nível da bateria
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Quantidade de registros (max 1000)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordenação por received_at
 *     responses:
 *       200:
 *         description: Lista de leituras
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */
router.get('/', async (req, res) => {
  try {
    const {
      serial_number,
      start_date,
      end_date,
      min_temp,
      max_temp,
      min_humidity,
      max_humidity,
      battery_level,
      limit = 100,
      offset = 0,
      order = 'desc',
    } = req.query;

    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = parseInt(offset) || 0;
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (serial_number) {
      conditions.push(`serial_number = $${paramIndex++}`);
      params.push(serial_number);
    }
    if (start_date) {
      conditions.push(`received_at >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`received_at <= $${paramIndex++}`);
      params.push(end_date);
    }
    if (min_temp !== undefined) {
      conditions.push(`temperature >= $${paramIndex++}`);
      params.push(parseFloat(min_temp));
    }
    if (max_temp !== undefined) {
      conditions.push(`temperature <= $${paramIndex++}`);
      params.push(parseFloat(max_temp));
    }
    if (min_humidity !== undefined) {
      conditions.push(`humidity >= $${paramIndex++}`);
      params.push(parseFloat(min_humidity));
    }
    if (max_humidity !== undefined) {
      conditions.push(`humidity <= $${paramIndex++}`);
      params.push(parseFloat(max_humidity));
    }
    if (battery_level) {
      conditions.push(`battery_level = $${paramIndex++}`);
      params.push(battery_level.toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM temp_hum_readings ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get data
    const dataParams = [...params, limitNum, offsetNum];
    const dataResult = await query(
      `SELECT * FROM temp_hum_readings ${whereClause}
       ORDER BY received_at ${orderDir}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      dataParams
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + dataResult.rows.length < total,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar leituras:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar leituras' });
  }
});

/**
 * @swagger
 * /api/readings/stats:
 *   get:
 *     summary: Estatísticas agregadas para gráficos
 *     description: Retorna estatísticas e timeseries de um sensor
 *     tags:
 *       - Readings
 *     parameters:
 *       - in: query
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de série do sensor
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial (ISO8601)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final (ISO8601)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week]
 *           default: hour
 *         description: Intervalo de agregação
 *     responses:
 *       200:
 *         description: Estatísticas do sensor
 *       400:
 *         description: serial_number é obrigatório
 */
router.get('/stats', async (req, res) => {
  try {
    const { serial_number, start_date, end_date, interval = 'hour' } = req.query;

    if (!serial_number) {
      return res.status(400).json({ success: false, error: 'serial_number é obrigatório' });
    }

    const validIntervals = ['hour', 'day', 'week'];
    const truncInterval = validIntervals.includes(interval) ? interval : 'hour';

    // Build date conditions
    const conditions = ['serial_number = $1'];
    const params = [serial_number];
    let paramIndex = 2;

    if (start_date) {
      conditions.push(`received_at >= $${paramIndex++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`received_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.join(' AND ');

    // Get summary
    const summaryResult = await query(
      `SELECT
        ROUND(AVG(temperature)::numeric, 2) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
        MIN(humidity) as min_humidity,
        MAX(humidity) as max_humidity,
        COUNT(*) as total_readings
       FROM temp_hum_readings
       WHERE ${whereClause}`,
      params
    );

    // Get timeseries
    const timeseriesResult = await query(
      `SELECT
        date_trunc('${truncInterval}', received_at) as period,
        ROUND(AVG(temperature)::numeric, 2) as avg_temperature,
        ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
        COUNT(*) as readings_count
       FROM temp_hum_readings
       WHERE ${whereClause}
       GROUP BY date_trunc('${truncInterval}', received_at)
       ORDER BY period ASC`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        timeseries: timeseriesResult.rows,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * @swagger
 * /api/readings/{id}:
 *   get:
 *     summary: Busca uma leitura específica por ID
 *     tags:
 *       - Readings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da leitura
 *     responses:
 *       200:
 *         description: Leitura encontrada
 *       404:
 *         description: Leitura não encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM temp_hum_readings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Leitura não encontrada' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar leitura:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar leitura' });
  }
});

module.exports = router;
