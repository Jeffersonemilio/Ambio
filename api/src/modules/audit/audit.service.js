const auditRepository = require('./audit.repository');

class AuditService {
  async log(data) {
    try {
      return await auditRepository.create(data);
    } catch (error) {
      // Não falhar a operação principal se o audit log falhar
      console.error('Erro ao criar audit log:', error.message);
      return null;
    }
  }

  async findAll(filters, pagination) {
    return auditRepository.findAll(filters, pagination);
  }

  async findById(id) {
    return auditRepository.findById(id);
  }
}

module.exports = new AuditService();
