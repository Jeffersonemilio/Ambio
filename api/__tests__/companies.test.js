/**
 * Testes do módulo Companies
 */

const {
  app,
  request,
  createTestUser,
  createTestCompany,
  createTestSensor,
  generateCnpj,
  cleanDatabase,
  closeDatabase,
} = require('./helpers/testHelpers');

describe('Companies Module', () => {
  let superAdmin;
  let ambioAnalyst;
  let company;
  let companyAdmin;

  beforeAll(async () => {
    await cleanDatabase();

    superAdmin = await createTestUser({
      email: 'superadmin@companies-test.com',
      name: 'Super Admin',
      userType: 'ambio',
      ambioRole: 'super_admin',
    });

    ambioAnalyst = await createTestUser({
      email: 'analyst@companies-test.com',
      name: 'Analyst',
      userType: 'ambio',
      ambioRole: 'analyst',
    });

    company = await createTestCompany({
      name: 'Test Company',
      email: 'company@test.com',
    });

    companyAdmin = await createTestUser({
      email: 'companyadmin@companies-test.com',
      name: 'Company Admin',
      userType: 'company',
      companyRole: 'admin',
      companyId: company.id,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  describe('GET /api/companies', () => {
    it('deve listar empresas para super_admin', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por isActive', async () => {
      const res = await request(app)
        .get('/api/companies?isActive=true')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(c => {
        expect(c.is_active).toBe(true);
      });
    });

    it('deve filtrar por search', async () => {
      const res = await request(app)
        .get('/api/companies?search=Test')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('deve respeitar paginação', async () => {
      const res = await request(app)
        .get('/api/companies?limit=1&offset=0')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });

    it('analyst deve conseguir listar empresas', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${ambioAnalyst.token}`);

      expect(res.status).toBe(200);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const res = await request(app).get('/api/companies');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('deve retornar empresa específica', async () => {
      const res = await request(app)
        .get(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(company.id);
      expect(res.body.name).toBe(company.name);
      expect(res.body).toHaveProperty('user_count');
      expect(res.body).toHaveProperty('sensor_count');
    });

    it('deve retornar 404 para empresa inexistente', async () => {
      const res = await request(app)
        .get('/api/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });

    it('company admin deve ver apenas sua empresa', async () => {
      // Deve conseguir ver sua empresa
      const res1 = await request(app)
        .get(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res1.status).toBe(200);

      // Criar outra empresa
      const otherCompany = await createTestCompany({ name: 'Other Company' });

      // Não deve ver outra empresa
      const res2 = await request(app)
        .get(`/api/companies/${otherCompany.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res2.status).toBe(403);
    });
  });

  describe('POST /api/companies', () => {
    it('deve criar empresa com dados válidos', async () => {
      const cnpj = generateCnpj();
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Nova Empresa',
          cnpj,
          email: 'nova@empresa.com',
          phone: '11999999999',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Nova Empresa');
      expect(res.body.cnpj).toBe(cnpj);
    });

    it('deve retornar erro para CNPJ duplicado', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Duplicate CNPJ',
          cnpj: company.cnpj,
          email: 'duplicate@empresa.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('CNPJ');
    });

    it('deve retornar erro para CNPJ inválido', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Invalid CNPJ',
          cnpj: '12345678901234',
          email: 'invalid@empresa.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('CNPJ');
    });

    it('deve retornar erro sem campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Incomplete',
        });

      expect(res.status).toBe(400);
    });

    it('company admin não deve criar empresas', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${companyAdmin.token}`)
        .send({
          name: 'By Company Admin',
          cnpj: generateCnpj(),
          email: 'byadmin@empresa.com',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('deve atualizar nome da empresa', async () => {
      const res = await request(app)
        .put(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ name: 'Updated Company Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Company Name');
    });

    it('deve atualizar email e telefone', async () => {
      const res = await request(app)
        .put(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: 'updated@empresa.com',
          phone: '11888888888',
        });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('updated@empresa.com');
      expect(res.body.phone).toBe('11888888888');
    });

    it('deve desativar empresa', async () => {
      const companyToDeactivate = await createTestCompany({ name: 'To Deactivate' });

      const res = await request(app)
        .put(`/api/companies/${companyToDeactivate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
    });

    it('não deve permitir alterar CNPJ', async () => {
      const res = await request(app)
        .put(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ cnpj: '11111111111111' });

      expect(res.status).toBe(200);
      expect(res.body.cnpj).not.toBe('11111111111111');
    });

    it('deve retornar 404 para empresa inexistente', async () => {
      const res = await request(app)
        .put('/api/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('deve deletar empresa', async () => {
      const companyToDelete = await createTestCompany({ name: 'To Delete' });

      const res = await request(app)
        .delete(`/api/companies/${companyToDelete.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(204);

      // Verificar que foi deletada
      const checkRes = await request(app)
        .get(`/api/companies/${companyToDelete.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(checkRes.status).toBe(404);
    });

    it('deve retornar 404 para empresa inexistente', async () => {
      const res = await request(app)
        .delete('/api/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });

    it('company admin não deve deletar empresas', async () => {
      const res = await request(app)
        .delete(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/companies/:id/users', () => {
    it('deve listar usuários da empresa', async () => {
      const res = await request(app)
        .get(`/api/companies/${company.id}/users`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('company admin deve ver usuários da sua empresa', async () => {
      const res = await request(app)
        .get(`/api/companies/${company.id}/users`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/companies/:id/sensors', () => {
    beforeAll(async () => {
      await createTestSensor({
        serialNumber: 'SENSOR-COMPANY-001',
        companyId: company.id,
        name: 'Company Sensor',
      });
    });

    it('deve listar sensores da empresa', async () => {
      const res = await request(app)
        .get(`/api/companies/${company.id}/sensors`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('company admin deve ver sensores da sua empresa', async () => {
      const res = await request(app)
        .get(`/api/companies/${company.id}/sensors`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(200);
    });
  });
});
