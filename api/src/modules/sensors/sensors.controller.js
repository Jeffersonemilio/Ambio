const sensorsService = require('./sensors.service');

class SensorsController {
  async list(req, res) {
    try {
      const { companyId, groupId, isActive, unassigned, search, limit = 50, offset = 0 } = req.query;

      const filters = {};
      if (companyId) filters.companyId = companyId;
      if (groupId) filters.groupId = groupId;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (unassigned === 'true') filters.unassigned = true;
      if (search) filters.search = search;

      const result = await sensorsService.findAll(
        filters,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao listar sensores:', error.message);
      res.status(500).json({ error: 'Erro ao listar sensores' });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const sensor = await sensorsService.findById(id, req.user);

      if (!sensor) {
        return res.status(404).json({ error: 'Sensor não encontrado' });
      }

      res.json(sensor);
    } catch (error) {
      console.error('Erro ao buscar sensor:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar sensor' });
    }
  }

  async create(req, res) {
    try {
      const { serialNumber, companyId, groupId, name, description } = req.body;

      if (!serialNumber) {
        return res.status(400).json({ error: 'serialNumber é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const sensor = await sensorsService.create(
        { serialNumber, companyId, groupId, name, description },
        req.user,
        ipAddress
      );

      res.status(201).json(sensor);
    } catch (error) {
      console.error('Erro ao criar sensor:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, groupId, isActive } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const sensor = await sensorsService.update(
        id,
        { name, description, groupId, isActive },
        req.user,
        ipAddress
      );

      res.json(sensor);
    } catch (error) {
      console.error('Erro ao atualizar sensor:', error.message);
      if (error.message === 'Sensor não encontrado') {
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

      await sensorsService.delete(id, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar sensor:', error.message);
      if (error.message === 'Sensor não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async assign(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({ error: 'companyId é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const sensor = await sensorsService.assignToCompany(id, companyId, req.user, ipAddress);

      res.json(sensor);
    } catch (error) {
      console.error('Erro ao atribuir sensor:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async unassign(req, res) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const sensor = await sensorsService.unassign(id, req.user, ipAddress);
      res.json(sensor);
    } catch (error) {
      console.error('Erro ao desatribuir sensor:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // Grupos
  async listGroups(req, res) {
    try {
      const { companyId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await sensorsService.findAllGroups(
        companyId,
        {
          limit: Math.min(parseInt(limit, 10) || 50, 100),
          offset: parseInt(offset, 10) || 0,
        },
        req.user
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao listar grupos:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao listar grupos' });
    }
  }

  async getGroup(req, res) {
    try {
      const { id } = req.params;
      const group = await sensorsService.findGroupById(id, req.user);

      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      res.json(group);
    } catch (error) {
      console.error('Erro ao buscar grupo:', error.message);
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar grupo' });
    }
  }

  async createGroup(req, res) {
    try {
      const { companyId } = req.params;
      const { parentId, name, type, metadata } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const group = await sensorsService.createGroup(
        { companyId, parentId, name, type, metadata },
        req.user,
        ipAddress
      );

      res.status(201).json(group);
    } catch (error) {
      console.error('Erro ao criar grupo:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const { name, parentId, type, metadata } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const group = await sensorsService.updateGroup(
        id,
        { name, parentId, type, metadata },
        req.user,
        ipAddress
      );

      res.json(group);
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error.message);
      if (error.message === 'Grupo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;

      await sensorsService.deleteGroup(id, req.user, ipAddress);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar grupo:', error.message);
      if (error.message === 'Grupo não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async moveSensors(req, res) {
    try {
      const { id } = req.params;
      const { sensorIds } = req.body;

      if (!sensorIds || !Array.isArray(sensorIds) || sensorIds.length === 0) {
        return res.status(400).json({ error: 'sensorIds (array) é obrigatório' });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const count = await sensorsService.moveSensorsToGroup(id, sensorIds, req.user, ipAddress);

      res.json({ moved: count });
    } catch (error) {
      console.error('Erro ao mover sensores:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // Configurações de sensores
  async getConfiguration(req, res) {
    try {
      const { id } = req.params;
      const configuration = await sensorsService.getConfiguration(id, req.user);

      if (!configuration) {
        return res.json({
          sensor_id: id,
          installation_location: null,
          temperature_min: null,
          temperature_max: null,
          humidity_min: null,
          humidity_max: null,
          alerts_enabled: true,
          configured: false,
        });
      }

      res.json({
        ...configuration,
        configured: true,
      });
    } catch (error) {
      console.error('Erro ao buscar configuração:', error.message);
      if (error.message === 'Sensor não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
  }

  async updateConfiguration(req, res) {
    try {
      const { id } = req.params;
      const {
        installationLocation,
        temperatureMin,
        temperatureMax,
        humidityMin,
        humidityMax,
        alertsEnabled,
      } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const configuration = await sensorsService.updateConfiguration(
        id,
        {
          installationLocation,
          temperatureMin: temperatureMin !== undefined && temperatureMin !== '' ? parseFloat(temperatureMin) : null,
          temperatureMax: temperatureMax !== undefined && temperatureMax !== '' ? parseFloat(temperatureMax) : null,
          humidityMin: humidityMin !== undefined && humidityMin !== '' ? parseFloat(humidityMin) : null,
          humidityMax: humidityMax !== undefined && humidityMax !== '' ? parseFloat(humidityMax) : null,
          alertsEnabled,
        },
        req.user,
        ipAddress
      );

      res.json(configuration);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error.message);
      if (error.message === 'Sensor não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Acesso negado') {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SensorsController();
