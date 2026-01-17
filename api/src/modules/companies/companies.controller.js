const companiesService = require('./companies.service');

class CompaniesController {
  async list(req, res) {
    try {
      const { isActive, search, limit = 50, offset = 0 } = req.query;

      const filters = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) filters.search = search;

      const result = await companiesService.findAll(
        filters,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao listar empresas:', error.message);
      res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const company = await companiesService.findById(id, req.user);

      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      res.json(company);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  async create(req, res) {
    try {
      const { name, cnpj, email, phone, settings } = req.body;

      if (!name || !cnpj || !email) {
        return res.status(400).json({ error: 'Campos obrigatórios: name, cnpj, email' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const company = await companiesService.create(
        { name, cnpj, email, phone, settings },
        req.user,
        ipAddress
      );

      res.status(201).json(company);
    } catch (error) {
      console.error('Erro ao criar empresa:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, isActive, settings } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const company = await companiesService.update(
        id,
        { name, email, phone, isActive, settings },
        req.user,
        ipAddress
      );

      res.json(company);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error.message);
      if (error.message === 'Empresa não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await companiesService.delete(id, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error.message);
      if (error.message === 'Empresa não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getUsers(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await companiesService.getCompanyUsers(
        id,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  async getSensors(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await companiesService.getCompanySensors(
        id,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar sensores da empresa:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar sensores' });
    }
  }

  // =====================
  // MY COMPANY - Endpoints de auto-serviço
  // =====================

  async getMyCompany(req, res) {
    try {
      const company = await companiesService.getMyCompany(req.user);
      res.json(company);
    } catch (error) {
      console.error('Erro ao buscar minha empresa:', error.message);
      if (error.message === 'Empresa não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async updateMyCompany(req, res) {
    try {
      const { name, email, phone } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const company = await companiesService.updateMyCompany(
        { name, email, phone },
        req.user,
        ipAddress
      );

      res.json(company);
    } catch (error) {
      console.error('Erro ao atualizar minha empresa:', error.message);
      if (error.message === 'Empresa não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getMyCompanyUsers(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const result = await companiesService.getMyCompanyUsers(
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar usuários da minha empresa:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async createMyCompanyUser(req, res) {
    try {
      const { email, name, role } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await companiesService.createMyCompanyUser(
        { email, name, role },
        req.user,
        ipAddress
      );

      res.status(201).json(user);
    } catch (error) {
      console.error('Erro ao criar usuário na empresa:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async updateMyCompanyUser(req, res) {
    try {
      const { userId } = req.params;
      const { name, role, isActive } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await companiesService.updateMyCompanyUser(
        userId,
        { name, role, isActive },
        req.user,
        ipAddress
      );

      res.json(user);
    } catch (error) {
      console.error('Erro ao atualizar usuário da empresa:', error.message);
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new CompaniesController();
