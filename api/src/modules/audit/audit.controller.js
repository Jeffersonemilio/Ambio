const auditService = require('./audit.service');

class AuditController {
  async list(req, res) {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        startDate,
        endDate,
        impersonatedOnly,
        limit = 50,
        offset = 0,
      } = req.query;

      const filters = {};
      if (userId) filters.userId = userId;
      if (action) filters.action = action;
      if (resourceType) filters.resourceType = resourceType;
      if (resourceId) filters.resourceId = resourceId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (impersonatedOnly === 'true') filters.impersonatedOnly = true;

      const result = await auditService.findAll(filters, {
        limit: Math.min(parseInt(limit, 10) || 50, 100),
        offset: parseInt(offset, 10) || 0,
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao listar audit logs:', error.message);
      res.status(500).json({ error: 'Erro ao listar audit logs' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const log = await auditService.findById(id);

      if (!log) {
        return res.status(404).json({ error: 'Audit log não encontrado' });
      }

      res.json(log);
    } catch (error) {
      console.error('Erro ao buscar audit log:', error.message);
      res.status(500).json({ error: 'Erro ao buscar audit log' });
    }
  }
}

module.exports = new AuditController();
