/**
 * Helpers para testes - funções utilitárias
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { query, pool } = require('../../src/database');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

/**
 * Gera um token JWT para testes
 */
function generateTestToken(userData) {
  const payload = {
    sub: userData.id,
    email: userData.email,
    userType: userData.userType || 'ambio',
    role: userData.role || 'super_admin',
    companyId: userData.companyId || null,
  };

  if (userData.impersonatedBy) {
    payload.impersonatedBy = userData.impersonatedBy;
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Cria um usuário de teste no banco
 */
async function createTestUser(data = {}) {
  const email = data.email || `test-${Date.now()}@ambio.com`;
  const password = data.password || 'Test@123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (email, password_hash, name, user_type, ambio_role, company_id, company_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      email,
      passwordHash,
      data.name || 'Test User',
      data.userType || 'ambio',
      data.ambioRole || (data.userType === 'ambio' || !data.userType ? 'super_admin' : null),
      data.companyId || null,
      data.companyRole || null,
    ]
  );

  const user = result.rows[0];
  user.plainPassword = password;
  user.token = generateTestToken({
    id: user.id,
    email: user.email,
    userType: user.user_type,
    role: user.user_type === 'ambio' ? user.ambio_role : user.company_role,
    companyId: user.company_id,
  });

  return user;
}

/**
 * Cria uma empresa de teste no banco
 */
async function createTestCompany(data = {}) {
  const cnpj = data.cnpj || generateCnpj();

  const result = await query(
    `INSERT INTO companies (name, cnpj, email, phone, settings)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.name || `Test Company ${Date.now()}`,
      cnpj,
      data.email || `company-${Date.now()}@test.com`,
      data.phone || '11999999999',
      JSON.stringify(data.settings || {}),
    ]
  );

  return result.rows[0];
}

/**
 * Cria um sensor de teste no banco
 */
async function createTestSensor(data = {}) {
  const serialNumber = data.serialNumber || `SENSOR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const result = await query(
    `INSERT INTO sensors (serial_number, company_id, group_id, name, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      serialNumber,
      data.companyId || null,
      data.groupId || null,
      data.name || `Test Sensor`,
      data.description || null,
      data.isActive !== undefined ? data.isActive : true,
    ]
  );

  return result.rows[0];
}

/**
 * Cria um grupo de sensores de teste
 */
async function createTestSensorGroup(data = {}) {
  const result = await query(
    `INSERT INTO sensor_groups (company_id, parent_id, name, type, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.companyId,
      data.parentId || null,
      data.name || `Test Group ${Date.now()}`,
      data.type || 'area',
      JSON.stringify(data.metadata || {}),
    ]
  );

  return result.rows[0];
}

/**
 * Gera um CNPJ válido para testes
 */
function generateCnpj() {
  const n = () => Math.floor(Math.random() * 9);
  const base = [n(), n(), n(), n(), n(), n(), n(), n(), 0, 0, 0, 1];

  // Calcula primeiro dígito
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += base[i] * weight[i];
  }
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  base.push(d1);

  // Calcula segundo dígito
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += base[i] * weight[i];
  }
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  base.push(d2);

  return base.join('');
}

/**
 * Limpa todas as tabelas de teste
 */
async function cleanDatabase() {
  await query('DELETE FROM audit_logs');
  await query('DELETE FROM user_permissions');
  await query('DELETE FROM ambio_admin_modules');
  await query('DELETE FROM password_resets');
  await query('DELETE FROM refresh_tokens');
  await query('DELETE FROM temp_hum_readings');
  await query('DELETE FROM sensors');
  await query('DELETE FROM sensor_groups');
  await query('DELETE FROM users');
  await query('DELETE FROM companies');
}

/**
 * Cria um conjunto completo de dados de teste
 */
async function createTestData() {
  // Criar empresa
  const company = await createTestCompany({ name: 'Empresa Teste' });

  // Criar super admin Ambio
  const superAdmin = await createTestUser({
    email: 'superadmin@ambio.com',
    name: 'Super Admin',
    userType: 'ambio',
    ambioRole: 'super_admin',
  });

  // Criar admin Ambio
  const ambioAdmin = await createTestUser({
    email: 'admin@ambio.com',
    name: 'Admin Ambio',
    userType: 'ambio',
    ambioRole: 'admin',
  });

  // Criar analista Ambio
  const ambioAnalyst = await createTestUser({
    email: 'analyst@ambio.com',
    name: 'Analyst Ambio',
    userType: 'ambio',
    ambioRole: 'analyst',
  });

  // Criar suporte Ambio
  const ambioSupport = await createTestUser({
    email: 'support@ambio.com',
    name: 'Support Ambio',
    userType: 'ambio',
    ambioRole: 'support',
  });

  // Criar admin de empresa
  const companyAdmin = await createTestUser({
    email: 'admin@company.com',
    name: 'Admin Company',
    userType: 'company',
    companyRole: 'admin',
    companyId: company.id,
  });

  // Criar analista de empresa
  const companyAnalyst = await createTestUser({
    email: 'analyst@company.com',
    name: 'Analyst Company',
    userType: 'company',
    companyRole: 'analyst',
    companyId: company.id,
  });

  // Criar usuário de empresa
  const companyUser = await createTestUser({
    email: 'user@company.com',
    name: 'User Company',
    userType: 'company',
    companyRole: 'user',
    companyId: company.id,
  });

  // Criar grupo de sensores
  const sensorGroup = await createTestSensorGroup({
    companyId: company.id,
    name: 'Área de Produção',
    type: 'area',
  });

  // Criar sensores
  const sensor1 = await createTestSensor({
    serialNumber: 'SENSOR-TEST-001',
    companyId: company.id,
    groupId: sensorGroup.id,
    name: 'Sensor 1',
  });

  const sensor2 = await createTestSensor({
    serialNumber: 'SENSOR-TEST-002',
    companyId: company.id,
    name: 'Sensor 2',
  });

  const sensorUnassigned = await createTestSensor({
    serialNumber: 'SENSOR-UNASSIGNED',
    name: 'Sensor Não Atribuído',
  });

  const sensorInactive = await createTestSensor({
    serialNumber: 'SENSOR-INACTIVE',
    companyId: company.id,
    name: 'Sensor Inativo',
    isActive: false,
  });

  return {
    company,
    superAdmin,
    ambioAdmin,
    ambioAnalyst,
    ambioSupport,
    companyAdmin,
    companyAnalyst,
    companyUser,
    sensorGroup,
    sensor1,
    sensor2,
    sensorUnassigned,
    sensorInactive,
  };
}

/**
 * Fecha a conexão com o banco
 */
async function closeDatabase() {
  await pool.end();
}

/**
 * Helper para fazer requisições autenticadas
 */
function authRequest(method, url, token) {
  return request(app)[method](url).set('Authorization', `Bearer ${token}`);
}

module.exports = {
  app,
  request,
  generateTestToken,
  createTestUser,
  createTestCompany,
  createTestSensor,
  createTestSensorGroup,
  generateCnpj,
  cleanDatabase,
  createTestData,
  closeDatabase,
  authRequest,
  query,
};
