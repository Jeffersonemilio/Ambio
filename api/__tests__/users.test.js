/**
 * Testes do módulo Users
 */

const {
  app,
  request,
  createTestUser,
  createTestCompany,
  cleanDatabase,
  closeDatabase,
} = require('./helpers/testHelpers');

describe('Users Module', () => {
  let superAdmin;
  let ambioAdmin;
  let company;
  let companyAdmin;
  let companyUser;

  beforeAll(async () => {
    await cleanDatabase();

    // Criar usuário super admin
    superAdmin = await createTestUser({
      email: 'superadmin@users-test.com',
      name: 'Super Admin',
      userType: 'ambio',
      ambioRole: 'super_admin',
    });

    // Criar admin Ambio
    ambioAdmin = await createTestUser({
      email: 'admin@users-test.com',
      name: 'Admin Ambio',
      userType: 'ambio',
      ambioRole: 'admin',
    });

    // Criar empresa
    company = await createTestCompany({ name: 'Users Test Company' });

    // Criar admin de empresa
    companyAdmin = await createTestUser({
      email: 'companyadmin@users-test.com',
      name: 'Company Admin',
      userType: 'company',
      companyRole: 'admin',
      companyId: company.id,
    });

    // Criar usuário de empresa
    companyUser = await createTestUser({
      email: 'companyuser@users-test.com',
      name: 'Company User',
      userType: 'company',
      companyRole: 'user',
      companyId: company.id,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  describe('GET /api/users', () => {
    it('deve listar usuários para super_admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por userType', async () => {
      const res = await request(app)
        .get('/api/users?userType=ambio')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(user => {
        expect(user.user_type).toBe('ambio');
      });
    });

    it('deve filtrar por companyId', async () => {
      const res = await request(app)
        .get(`/api/users?companyId=${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(user => {
        expect(user.company_id).toBe(company.id);
      });
    });

    it('deve filtrar por search', async () => {
      const res = await request(app)
        .get('/api/users?search=companyadmin')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('company admin deve ver apenas usuários da sua empresa', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(user => {
        expect(user.company_id).toBe(company.id);
      });
    });

    it('deve respeitar paginação', async () => {
      const res = await request(app)
        .get('/api/users?limit=2&offset=0')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(0);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('deve retornar usuário específico', async () => {
      const res = await request(app)
        .get(`/api/users/${companyUser.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(companyUser.id);
      expect(res.body.email).toBe(companyUser.email);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });

    it('company admin deve ver apenas usuários da sua empresa', async () => {
      // Deve conseguir ver usuário da mesma empresa
      const res1 = await request(app)
        .get(`/api/users/${companyUser.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res1.status).toBe(200);

      // Não deve ver usuário de outra empresa
      const res2 = await request(app)
        .get(`/api/users/${superAdmin.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res2.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    it('super_admin deve criar usuário Ambio', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: 'newambio@test.com',
          password: 'Test@123456',
          name: 'New Ambio User',
          userType: 'ambio',
          ambioRole: 'analyst',
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('newambio@test.com');
      expect(res.body.user_type).toBe('ambio');
    });

    it('super_admin deve criar usuário de empresa', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: 'newcompanyuser@test.com',
          password: 'Test@123456',
          name: 'New Company User',
          userType: 'company',
          companyRole: 'analyst',
          companyId: company.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.user_type).toBe('company');
      expect(res.body.company_id).toBe(company.id);
    });

    it('company admin deve criar usuário na sua empresa', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${companyAdmin.token}`)
        .send({
          email: 'newuserbycompanyadmin@test.com',
          password: 'Test@123456',
          name: 'Created by Company Admin',
          userType: 'company',
          companyRole: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.company_id).toBe(company.id);
    });

    it('company admin não deve criar usuário Ambio', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${companyAdmin.token}`)
        .send({
          email: 'invalid@test.com',
          password: 'Test@123456',
          name: 'Invalid',
          userType: 'ambio',
          ambioRole: 'analyst',
        });

      expect(res.status).toBe(400);
    });

    it('deve retornar erro para email duplicado', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: superAdmin.email,
          password: 'Test@123456',
          name: 'Duplicate',
          userType: 'ambio',
          ambioRole: 'analyst',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email');
    });

    it('deve retornar erro com senha curta', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: 'shortpass@test.com',
          password: '123',
          name: 'Short Pass',
          userType: 'ambio',
          ambioRole: 'analyst',
        });

      expect(res.status).toBe(400);
    });

    it('deve retornar erro sem campos obrigatórios', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          email: 'incomplete@test.com',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userToUpdate;

    beforeAll(async () => {
      userToUpdate = await createTestUser({
        email: 'toupdate@test.com',
        name: 'To Update',
        userType: 'ambio',
        ambioRole: 'analyst',
      });
    });

    it('deve atualizar nome do usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('deve atualizar email', async () => {
      const res = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ email: 'updated@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('updated@test.com');
    });

    it('deve desativar usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const res = await request(app)
        .put('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deve deletar usuário', async () => {
      const userToDelete = await createTestUser({
        email: 'todelete@test.com',
        name: 'To Delete',
        userType: 'ambio',
        ambioRole: 'analyst',
      });

      const res = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(204);

      // Verificar que foi deletado
      const checkRes = await request(app)
        .get(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(checkRes.status).toBe(404);
    });

    it('não deve permitir deletar a si mesmo', async () => {
      const res = await request(app)
        .delete(`/api/users/${superAdmin.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(400);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const res = await request(app)
        .delete('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('User Permissions', () => {
    let userWithPermissions;

    beforeAll(async () => {
      userWithPermissions = await createTestUser({
        email: 'withpermissions@test.com',
        name: 'With Permissions',
        userType: 'ambio',
        ambioRole: 'analyst',
      });
    });

    it('deve adicionar permissão customizada', async () => {
      const res = await request(app)
        .put(`/api/users/${userWithPermissions.id}/permissions`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          resource: 'sensors.management',
          actions: ['read', 'write'],
        });

      expect(res.status).toBe(200);
      expect(res.body.resource).toBe('sensors.management');
      expect(res.body.actions).toContain('read');
    });

    it('deve listar permissões do usuário', async () => {
      const res = await request(app)
        .get(`/api/users/${userWithPermissions.id}/permissions`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve remover permissão', async () => {
      const res = await request(app)
        .delete(`/api/users/${userWithPermissions.id}/permissions/sensors.management`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(204);
    });
  });
});
