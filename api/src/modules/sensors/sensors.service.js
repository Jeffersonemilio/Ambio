const sensorsRepository = require('./sensors.repository');
const auditService = require('../audit/audit.service');

class SensorsService {
  async findAll(filters, pagination, requestingUser) {
    // Usuários de empresa só podem ver sensores da sua empresa
    if (requestingUser.userType === 'company') {
      filters.companyId = requestingUser.companyId;
    }

    return sensorsRepository.findAll(filters, pagination);
  }

  async findById(id, requestingUser) {
    // Verificar se é UUID ou serial_number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const sensor = isUuid
      ? await sensorsRepository.findById(id)
      : await sensorsRepository.findBySerialNumber(id);

    if (!sensor) {
      return null;
    }

    // Usuários de empresa só podem ver sensores da sua empresa
    if (requestingUser.userType === 'company' && sensor.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return sensor;
  }

  async findBySerialNumber(serialNumber) {
    return sensorsRepository.findBySerialNumber(serialNumber);
  }

  async create(data, requestingUser, ipAddress) {
    // Verificar se serial_number já existe
    const existingSensor = await sensorsRepository.findBySerialNumber(data.serialNumber);
    if (existingSensor) {
      throw new Error('Serial number já cadastrado');
    }

    // Usuários de empresa só podem criar sensores para sua empresa
    if (requestingUser.userType === 'company') {
      data.companyId = requestingUser.companyId;
    }

    const sensor = await sensorsRepository.create({
      serialNumber: data.serialNumber,
      companyId: data.companyId,
      groupId: data.groupId,
      name: data.name,
      description: data.description,
    });

    await auditService.log({
      userId: requestingUser.sub,
      action: 'create',
      resourceType: 'sensor',
      resourceId: sensor.id,
      details: { serialNumber: sensor.serial_number },
      ipAddress,
    });

    return sensor;
  }

  async update(id, data, requestingUser, ipAddress) {
    const existingSensor = await sensorsRepository.findById(id);

    if (!existingSensor) {
      throw new Error('Sensor não encontrado');
    }

    // Usuários de empresa só podem atualizar sensores da sua empresa
    if (requestingUser.userType === 'company' && existingSensor.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    // Serial number não pode ser alterado
    if (data.serialNumber) {
      delete data.serialNumber;
    }

    // Usuários de empresa não podem mudar a empresa do sensor
    if (requestingUser.userType === 'company') {
      delete data.companyId;
    }

    // Se mudar de grupo, verificar se o grupo pertence à mesma empresa
    if (data.groupId) {
      const group = await sensorsRepository.findGroupById(data.groupId);
      if (!group || group.company_id !== existingSensor.company_id) {
        throw new Error('Grupo inválido');
      }
    }

    const updatedSensor = await sensorsRepository.update(id, data);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'sensor',
      resourceId: id,
      details: { changes: data },
      ipAddress,
    });

    return updatedSensor;
  }

  async delete(id, requestingUser, ipAddress) {
    const existingSensor = await sensorsRepository.findById(id);

    if (!existingSensor) {
      throw new Error('Sensor não encontrado');
    }

    // Usuários de empresa não podem deletar sensores
    if (requestingUser.userType === 'company') {
      throw new Error('Apenas usuários Ambio podem deletar sensores');
    }

    await sensorsRepository.delete(id);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'delete',
      resourceType: 'sensor',
      resourceId: id,
      details: { serialNumber: existingSensor.serial_number },
      ipAddress,
    });

    return true;
  }

  async assignToCompany(id, companyId, requestingUser, ipAddress) {
    const existingSensor = await sensorsRepository.findById(id);

    if (!existingSensor) {
      throw new Error('Sensor não encontrado');
    }

    // Apenas usuários Ambio podem atribuir sensores a empresas
    if (requestingUser.userType !== 'ambio') {
      throw new Error('Apenas usuários Ambio podem atribuir sensores');
    }

    const updatedSensor = await sensorsRepository.assignToCompany(id, companyId);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'assign',
      resourceType: 'sensor',
      resourceId: id,
      details: { companyId, serialNumber: existingSensor.serial_number },
      ipAddress,
    });

    return updatedSensor;
  }

  async unassign(id, requestingUser, ipAddress) {
    const existingSensor = await sensorsRepository.findById(id);

    if (!existingSensor) {
      throw new Error('Sensor não encontrado');
    }

    // Apenas usuários Ambio podem desatribuir sensores
    if (requestingUser.userType !== 'ambio') {
      throw new Error('Apenas usuários Ambio podem desatribuir sensores');
    }

    const updatedSensor = await sensorsRepository.unassign(id);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'unassign',
      resourceType: 'sensor',
      resourceId: id,
      details: { previousCompanyId: existingSensor.company_id },
      ipAddress,
    });

    return updatedSensor;
  }

  // Grupos
  async findAllGroups(companyId, pagination, requestingUser) {
    // Usuários de empresa só podem ver grupos da sua empresa
    if (requestingUser.userType === 'company' && companyId !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return sensorsRepository.findAllGroups(companyId, pagination);
  }

  async findGroupById(id, requestingUser) {
    const group = await sensorsRepository.findGroupById(id);

    if (!group) {
      return null;
    }

    // Usuários de empresa só podem ver grupos da sua empresa
    if (requestingUser.userType === 'company' && group.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return group;
  }

  async createGroup(data, requestingUser, ipAddress) {
    // Usuários de empresa só podem criar grupos para sua empresa
    if (requestingUser.userType === 'company') {
      data.companyId = requestingUser.companyId;
    }

    // Se tiver parentId, verificar se pertence à mesma empresa
    if (data.parentId) {
      const parentGroup = await sensorsRepository.findGroupById(data.parentId);
      if (!parentGroup || parentGroup.company_id !== data.companyId) {
        throw new Error('Grupo pai inválido');
      }
    }

    const group = await sensorsRepository.createGroup({
      companyId: data.companyId,
      parentId: data.parentId,
      name: data.name,
      type: data.type,
      metadata: data.metadata,
    });

    await auditService.log({
      userId: requestingUser.sub,
      action: 'create',
      resourceType: 'sensor_group',
      resourceId: group.id,
      details: { name: group.name, companyId: group.company_id },
      ipAddress,
    });

    return group;
  }

  async updateGroup(id, data, requestingUser, ipAddress) {
    const existingGroup = await sensorsRepository.findGroupById(id);

    if (!existingGroup) {
      throw new Error('Grupo não encontrado');
    }

    // Usuários de empresa só podem atualizar grupos da sua empresa
    if (requestingUser.userType === 'company' && existingGroup.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    // Não pode mudar companyId
    delete data.companyId;

    // Se mudar parentId, verificar se pertence à mesma empresa e não cria ciclo
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Grupo não pode ser pai de si mesmo');
      }
      const parentGroup = await sensorsRepository.findGroupById(data.parentId);
      if (!parentGroup || parentGroup.company_id !== existingGroup.company_id) {
        throw new Error('Grupo pai inválido');
      }
    }

    const updatedGroup = await sensorsRepository.updateGroup(id, data);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'sensor_group',
      resourceId: id,
      details: { changes: data },
      ipAddress,
    });

    return updatedGroup;
  }

  async deleteGroup(id, requestingUser, ipAddress) {
    const existingGroup = await sensorsRepository.findGroupById(id);

    if (!existingGroup) {
      throw new Error('Grupo não encontrado');
    }

    // Usuários de empresa só podem deletar grupos da sua empresa
    if (requestingUser.userType === 'company' && existingGroup.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    await sensorsRepository.deleteGroup(id);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'delete',
      resourceType: 'sensor_group',
      resourceId: id,
      details: { name: existingGroup.name },
      ipAddress,
    });

    return true;
  }

  async moveSensorsToGroup(groupId, sensorIds, requestingUser, ipAddress) {
    const group = groupId ? await sensorsRepository.findGroupById(groupId) : null;

    if (groupId && !group) {
      throw new Error('Grupo não encontrado');
    }

    // Usuários de empresa só podem mover sensores para grupos da sua empresa
    if (requestingUser.userType === 'company') {
      if (group && group.company_id !== requestingUser.companyId) {
        throw new Error('Acesso negado');
      }
    }

    const count = await sensorsRepository.moveSensorsToGroup(groupId, sensorIds);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'move_sensors',
      resourceType: 'sensor_group',
      resourceId: groupId,
      details: { sensorIds, count },
      ipAddress,
    });

    return count;
  }

  // Configurações de sensores
  async getConfiguration(sensorId, requestingUser) {
    const sensor = await sensorsRepository.findById(sensorId);

    if (!sensor) {
      throw new Error('Sensor não encontrado');
    }

    // Verificar acesso
    if (requestingUser.userType === 'company' && sensor.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return sensorsRepository.findConfigurationBySensorId(sensorId);
  }

  async updateConfiguration(sensorId, config, requestingUser, ipAddress) {
    const sensor = await sensorsRepository.findById(sensorId);

    if (!sensor) {
      throw new Error('Sensor não encontrado');
    }

    // Apenas sensores atribuídos a empresas podem ser configurados
    if (!sensor.company_id) {
      throw new Error('Sensor não está atribuído a nenhuma empresa');
    }

    // Verificar acesso
    if (requestingUser.userType === 'company' && sensor.company_id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    // Validações de negócio
    this.validateThresholds(config);

    const configuration = await sensorsRepository.upsertConfiguration(
      sensorId,
      config,
      requestingUser.sub
    );

    await auditService.log({
      userId: requestingUser.sub,
      action: 'configure',
      resourceType: 'sensor',
      resourceId: sensorId,
      details: { configuration: config },
      ipAddress,
    });

    return configuration;
  }

  validateThresholds(config) {
    const { temperatureMin, temperatureMax, humidityMin, humidityMax } = config;

    // Validar range de temperatura
    if (temperatureMin !== null && temperatureMin !== undefined &&
        temperatureMax !== null && temperatureMax !== undefined) {
      if (temperatureMin >= temperatureMax) {
        throw new Error('Temperatura mínima deve ser menor que máxima');
      }
    }

    // Validar range de umidade
    if (humidityMin !== null && humidityMin !== undefined &&
        humidityMax !== null && humidityMax !== undefined) {
      if (humidityMin >= humidityMax) {
        throw new Error('Umidade mínima deve ser menor que máxima');
      }
    }

    // Validar valores de umidade (0-100%)
    if (humidityMin !== null && humidityMin !== undefined && (humidityMin < 0 || humidityMin > 100)) {
      throw new Error('Umidade mínima deve estar entre 0 e 100%');
    }
    if (humidityMax !== null && humidityMax !== undefined && (humidityMax < 0 || humidityMax > 100)) {
      throw new Error('Umidade máxima deve estar entre 0 e 100%');
    }

    // Validar valores razoáveis de temperatura (-50 a 100 C)
    if (temperatureMin !== null && temperatureMin !== undefined && (temperatureMin < -50 || temperatureMin > 100)) {
      throw new Error('Temperatura mínima deve estar entre -50 e 100 graus');
    }
    if (temperatureMax !== null && temperatureMax !== undefined && (temperatureMax < -50 || temperatureMax > 100)) {
      throw new Error('Temperatura máxima deve estar entre -50 e 100 graus');
    }
  }
}

module.exports = new SensorsService();
