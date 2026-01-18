const alertsService = require('./alerts.service');
const { notificationsService } = require('../notifications');

class AlertsController {
  async findAll(req, res) {
    try {
      const filters = {
        companyId: req.query.companyId,
        sensorId: req.query.sensorId,
        status: req.query.status,
        violationType: req.query.violationType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const pagination = {
        limit: parseInt(req.query.limit, 10) || 50,
        offset: parseInt(req.query.offset, 10) || 0,
      };

      // Limitar maximo de registros por pagina
      if (pagination.limit > 100) {
        pagination.limit = 100;
      }

      const result = await alertsService.findAll(filters, pagination, req.user);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req, res) {
    try {
      const { id } = req.params;
      const alert = await alertsService.findById(id, req.user);

      if (!alert) {
        return res.status(404).json({ error: 'Alerta nao encontrado' });
      }

      res.json(alert);
    } catch (error) {
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async findActiveByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const alerts = await alertsService.findActiveByCompany(companyId, req.user);
      res.json({ data: alerts });
    } catch (error) {
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getNotifications(req, res) {
    try {
      const { id } = req.params;

      // Verificar acesso ao alerta
      const alert = await alertsService.findById(id, req.user);
      if (!alert) {
        return res.status(404).json({ error: 'Alerta nao encontrado' });
      }

      const notifications = await notificationsService.findByAlert(id);
      res.json({ data: notifications });
    } catch (error) {
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const filters = {
        companyId: req.query.companyId,
        sensorId: req.query.sensorId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await alertsService.getStatistics(filters, req.user);
      res.json({ data: stats });
    } catch (error) {
      if (error.message.includes('obrigatorio')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AlertsController();
