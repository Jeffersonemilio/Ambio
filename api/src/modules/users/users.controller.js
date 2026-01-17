const usersService = require('./users.service');

class UsersController {
  async list(req, res) {
    try {
      const {
        userType,
        companyId,
        isActive,
        search,
        role,
        limit = 50,
        offset = 0,
      } = req.query;

      const filters = {};
      if (userType) filters.userType = userType;
      if (companyId) filters.companyId = companyId;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) filters.search = search;
      if (role) filters.role = role;

      const result = await usersService.findAll(
        filters,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao listar usuários:', error.message);
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const user = await usersService.findById(id, req.user);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }

  async create(req, res) {
    try {
      const { email, password, name, userType, ambioRole, companyId, companyRole } = req.body;

      if (!email || !password || !name || !userType) {
        return res.status(400).json({ error: 'Campos obrigatórios: email, password, name, userType' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const user = await usersService.create(
        { email, password, name, userType, ambioRole, companyId, companyRole },
        req.user,
        ipAddress
      );

      res.status(201).json(user);
    } catch (error) {
      console.error('Erro ao criar usuário:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, isActive, ambioRole, companyRole, companyId } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const user = await usersService.update(
        id,
        { name, email, isActive, ambioRole, companyRole, companyId },
        req.user,
        ipAddress
      );

      res.json(user);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error.message);
      if (error.message === 'Usuário não encontrado') {
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

      await usersService.delete(id, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error.message);
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  // Permissões
  async getPermissions(req, res) {
    try {
      const { id } = req.params;
      const permissions = await usersService.getUserPermissions(id, req.user);
      res.json(permissions);
    } catch (error) {
      console.error('Erro ao buscar permissões:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async setPermission(req, res) {
    try {
      const { id } = req.params;
      const { resource, actions } = req.body;

      if (!resource || !actions || !Array.isArray(actions)) {
        return res.status(400).json({ error: 'resource e actions (array) são obrigatórios' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const permission = await usersService.setUserPermission(id, resource, actions, req.user, ipAddress);
      res.json(permission);
    } catch (error) {
      console.error('Erro ao definir permissão:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async removePermission(req, res) {
    try {
      const { id, resource } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await usersService.removeUserPermission(id, resource, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover permissão:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // Módulos admin
  async getAdminModules(req, res) {
    try {
      const { id } = req.params;
      const modules = await usersService.getAdminModules(id);
      res.json(modules);
    } catch (error) {
      console.error('Erro ao buscar módulos:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async assignModule(req, res) {
    try {
      const { id } = req.params;
      const { module } = req.body;

      if (!module) {
        return res.status(400).json({ error: 'module é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await usersService.assignAdminModule(id, module, req.user, ipAddress);
      res.json(result);
    } catch (error) {
      console.error('Erro ao atribuir módulo:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async removeModule(req, res) {
    try {
      const { id, module } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await usersService.removeAdminModule(id, module, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover módulo:', error.message);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UsersController();
