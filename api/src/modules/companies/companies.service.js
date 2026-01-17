const companiesRepository = require('./companies.repository');
const usersRepository = require('../users/users.repository');
const auditService = require('../audit/audit.service');
const emailService = require('../email/email.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class CompaniesService {
  async findAll(filters, pagination) {
    return companiesRepository.findAll(filters, pagination);
  }

  async findById(id, requestingUser) {
    const company = await companiesRepository.findById(id);

    if (!company) {
      return null;
    }

    // Usuários de empresa só podem ver sua própria empresa
    if (requestingUser.userType === 'company' && id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return company;
  }

  async create(data, requestingUser, ipAddress) {
    // Verificar se CNPJ já existe
    const existingCompany = await companiesRepository.findByCnpj(data.cnpj);
    if (existingCompany) {
      throw new Error('CNPJ já cadastrado');
    }

    // Validar CNPJ
    if (!this.validateCnpj(data.cnpj)) {
      throw new Error('CNPJ inválido');
    }

    const company = await companiesRepository.create({
      name: data.name,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      settings: data.settings,
    });

    await auditService.log({
      userId: requestingUser.sub,
      action: 'create',
      resourceType: 'company',
      resourceId: company.id,
      details: { name: company.name, cnpj: company.cnpj },
      ipAddress,
    });

    return company;
  }

  async update(id, data, requestingUser, ipAddress) {
    const existingCompany = await companiesRepository.findById(id);

    if (!existingCompany) {
      throw new Error('Empresa não encontrada');
    }

    // Usuários de empresa só podem atualizar sua própria empresa
    if (requestingUser.userType === 'company' && id !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    // CNPJ não pode ser alterado
    if (data.cnpj) {
      delete data.cnpj;
    }

    const updatedCompany = await companiesRepository.update(id, data);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update',
      resourceType: 'company',
      resourceId: id,
      details: { changes: data },
      ipAddress,
    });

    return updatedCompany;
  }

  async delete(id, requestingUser, ipAddress) {
    const existingCompany = await companiesRepository.findById(id);

    if (!existingCompany) {
      throw new Error('Empresa não encontrada');
    }

    // Usuários de empresa não podem deletar empresas
    if (requestingUser.userType === 'company') {
      throw new Error('Acesso negado');
    }

    await companiesRepository.delete(id);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'delete',
      resourceType: 'company',
      resourceId: id,
      details: { name: existingCompany.name, cnpj: existingCompany.cnpj },
      ipAddress,
    });

    return true;
  }

  async getCompanyUsers(companyId, pagination, requestingUser) {
    // Usuários de empresa só podem ver usuários da sua empresa
    if (requestingUser.userType === 'company' && companyId !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return companiesRepository.getCompanyUsers(companyId, pagination);
  }

  async getCompanySensors(companyId, pagination, requestingUser) {
    // Usuários de empresa só podem ver sensores da sua empresa
    if (requestingUser.userType === 'company' && companyId !== requestingUser.companyId) {
      throw new Error('Acesso negado');
    }

    return companiesRepository.getCompanySensors(companyId, pagination);
  }

  // =====================
  // MY COMPANY - Endpoints de auto-serviço
  // =====================

  async getMyCompany(requestingUser) {
    if (requestingUser.userType !== 'company') {
      throw new Error('Apenas usuários de empresa podem acessar este recurso');
    }

    if (!requestingUser.companyId) {
      throw new Error('Usuário não está vinculado a uma empresa');
    }

    const company = await companiesRepository.findById(requestingUser.companyId);

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    return company;
  }

  async updateMyCompany(data, requestingUser, ipAddress) {
    if (requestingUser.userType !== 'company') {
      throw new Error('Apenas usuários de empresa podem acessar este recurso');
    }

    if (requestingUser.role !== 'admin') {
      throw new Error('Apenas administradores podem editar dados da empresa');
    }

    if (!requestingUser.companyId) {
      throw new Error('Usuário não está vinculado a uma empresa');
    }

    // Campos permitidos para atualização
    const allowedFields = ['name', 'email', 'phone'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    const updatedCompany = await companiesRepository.update(
      requestingUser.companyId,
      updateData
    );

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update_own_company',
      resourceType: 'company',
      resourceId: requestingUser.companyId,
      details: { changes: updateData },
      ipAddress,
    });

    return updatedCompany;
  }

  async getMyCompanyUsers(pagination, requestingUser) {
    if (requestingUser.userType !== 'company') {
      throw new Error('Apenas usuários de empresa podem acessar este recurso');
    }

    // Apenas admin e analyst podem ver lista de usuários
    if (!['admin', 'analyst'].includes(requestingUser.role)) {
      throw new Error('Sem permissão para ver lista de usuários');
    }

    if (!requestingUser.companyId) {
      throw new Error('Usuário não está vinculado a uma empresa');
    }

    return companiesRepository.getCompanyUsers(requestingUser.companyId, pagination);
  }

  async createMyCompanyUser(data, requestingUser, ipAddress) {
    if (requestingUser.userType !== 'company') {
      throw new Error('Apenas usuários de empresa podem acessar este recurso');
    }

    if (requestingUser.role !== 'admin') {
      throw new Error('Apenas administradores podem criar usuários');
    }

    if (!requestingUser.companyId) {
      throw new Error('Usuário não está vinculado a uma empresa');
    }

    // Validações
    if (!data.email || !data.name) {
      throw new Error('Nome e email são obrigatórios');
    }

    if (!data.role || !['admin', 'analyst', 'user'].includes(data.role)) {
      throw new Error('Role inválido. Use: admin, analyst ou user');
    }

    // Verificar se email já existe
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Gerar senha temporária
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Criar usuário
    const newUser = await usersRepository.create({
      email: data.email,
      name: data.name,
      passwordHash,
      userType: 'company',
      companyId: requestingUser.companyId,
      companyRole: data.role,
    });

    await auditService.log({
      userId: requestingUser.sub,
      action: 'create_company_user',
      resourceType: 'user',
      resourceId: newUser.id,
      details: { email: data.email, role: data.role },
      ipAddress,
    });

    // Enviar email com senha temporária
    await emailService.sendTempPassword({ email: data.email, name: data.name }, tempPassword);

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.company_role,
      isActive: newUser.is_active,
      createdAt: newUser.created_at,
    };
  }

  async updateMyCompanyUser(userId, data, requestingUser, ipAddress) {
    if (requestingUser.userType !== 'company') {
      throw new Error('Apenas usuários de empresa podem acessar este recurso');
    }

    if (requestingUser.role !== 'admin') {
      throw new Error('Apenas administradores podem editar usuários');
    }

    // Buscar usuário
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se usuário pertence à mesma empresa
    if (user.company_id !== requestingUser.companyId) {
      throw new Error('Usuário não pertence à sua empresa');
    }

    // Não pode editar a si mesmo para evitar perder acesso
    if (userId === requestingUser.sub && data.role && data.role !== 'admin') {
      throw new Error('Você não pode remover seu próprio acesso de administrador');
    }

    // Campos permitidos
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.role !== undefined) {
      if (!['admin', 'analyst', 'user'].includes(data.role)) {
        throw new Error('Role inválido. Use: admin, analyst ou user');
      }
      updateData.companyRole = data.role;
    }

    if (data.isActive !== undefined) {
      // Não pode desativar a si mesmo
      if (userId === requestingUser.sub && !data.isActive) {
        throw new Error('Você não pode desativar sua própria conta');
      }
      updateData.isActive = data.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    const updatedUser = await usersRepository.update(userId, updateData);

    await auditService.log({
      userId: requestingUser.sub,
      action: 'update_company_user',
      resourceType: 'user',
      resourceId: userId,
      details: { changes: updateData },
      ipAddress,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.company_role,
      isActive: updatedUser.is_active,
      createdAt: updatedUser.created_at,
    };
  }

  // Validação de CNPJ
  validateCnpj(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;

    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

    return true;
  }
}

module.exports = new CompaniesService();
