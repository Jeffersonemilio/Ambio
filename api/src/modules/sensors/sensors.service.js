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
}

module.exports = new SensorsService();
