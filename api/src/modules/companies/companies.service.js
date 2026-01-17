const companiesRepository = require('./companies.repository');
const auditService = require('../audit/audit.service');

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
