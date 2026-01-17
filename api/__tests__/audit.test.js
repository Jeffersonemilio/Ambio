/**
 * Testes do módulo Audit
 */

const {
  app,
  request,
  createTestUser,
  createTestCompany,
  cleanDatabase,
  closeDatabase,
  query,
} = require('./helpers/testHelpers');

describe('Audit Module', () => {
  let superAdmin;
  let ambioAnalyst;

  beforeAll(async () => {
    await cleanDatabase();

    superAdmin = await createTestUser({
      email: 'superadmin@audit-test.com',
      name: 'Super Admin',
      userType: 'ambio',
      ambioRole: 'super_admin',
    });

    ambioAnalyst = await createTestUser({
      email: 'analyst@audit-test.com',
      name: 'Analyst',
      userType: 'ambio',
      ambioRole: 'analyst',
    });

    // Criar alguns logs de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [superAdmin.id, 'create', 'user', superAdmin.id, '{"test": true}', '127.0.0.1']
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [superAdmin.id, 'login', 'auth', superAdmin.id, '{}']
    );

    await query(
      `INSERT INTO audit_logs (user_id, impersonated_by, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ambioAnalyst.id, superAdmin.id, 'impersonate_start', 'auth', ambioAnalyst.id, '{}']
    );
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  describe('GET /api/audit', () => {
    it('deve listar logs de auditoria para super_admin', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('deve filtrar por userId', async () => {
      const res = await request(app)
        .get(`/api/audit?userId=${superAdmin.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(log => {
        expect(log.user_id).toBe(superAdmin.id);
      });
    });

    it('deve filtrar por action', async () => {
      const res = await request(app)
        .get('/api/audit?action=login')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(log => {
        expect(log.action).toBe('login');
      });
    });

    it('deve filtrar por resourceType', async () => {
      const res = await request(app)
        .get('/api/audit?resourceType=auth')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(log => {
        expect(log.resource_type).toBe('auth');
      });
    });

    it('deve filtrar por impersonatedOnly', async () => {
      const res = await request(app)
        .get('/api/audit?impersonatedOnly=true')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(log => {
        expect(log.impersonated_by).not.toBeNull();
      });
    });

    it('deve filtrar por data', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString(); // 1 dia atrás
      const endDate = new Date(Date.now() + 86400000).toISOString(); // 1 dia à frente

      const res = await request(app)
        .get(`/api/audit?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('deve respeitar paginação', async () => {
      const res = await request(app)
        .get('/api/audit?limit=2&offset=0')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(0);
    });

    it('analyst não deve ter acesso aos logs de audit', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${ambioAnalyst.token}`);

      expect(res.status).toBe(403);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const res = await request(app).get('/api/audit');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/audit/:id', () => {
    let auditLogId;

    beforeAll(async () => {
      const result = await query('SELECT id FROM audit_logs LIMIT 1');
      auditLogId = result.rows[0].id;
    });

    it('deve retornar log específico', async () => {
      const res = await request(app)
        .get(`/api/audit/${auditLogId}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(auditLogId);
      expect(res.body).toHaveProperty('action');
      expect(res.body).toHaveProperty('resource_type');
    });

    it('deve retornar 404 para log inexistente', async () => {
      const res = await request(app)
        .get('/api/audit/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Audit Log Integration', () => {
    it('deve criar log ao fazer login', async () => {
      const initialCount = await query('SELECT COUNT(*) FROM audit_logs WHERE action = $1', ['login']);

      // Fazer login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: superAdmin.email,
          password: superAdmin.plainPassword,
        });

      const finalCount = await query('SELECT COUNT(*) FROM audit_logs WHERE action = $1', ['login']);

      expect(parseInt(finalCount.rows[0].count)).toBeGreaterThan(parseInt(initialCount.rows[0].count));
    });

    it('deve criar log ao criar empresa', async () => {
      const initialCount = await query(
        "SELECT COUNT(*) FROM audit_logs WHERE action = $1 AND resource_type = $2",
        ['create', 'company']
      );

      // Criar empresa
      const { generateCnpj } = require('./helpers/testHelpers');
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Audit Test Company',
          cnpj: generateCnpj(),
          email: 'audit@company.com',
        });

      const finalCount = await query(
        "SELECT COUNT(*) FROM audit_logs WHERE action = $1 AND resource_type = $2",
        ['create', 'company']
      );

      expect(parseInt(finalCount.rows[0].count)).toBeGreaterThan(parseInt(initialCount.rows[0].count));
    });

    it('deve registrar impersonation no audit log', async () => {
      const targetUser = await createTestUser({
        email: 'impersonate-target@audit.com',
        name: 'Target',
        userType: 'ambio',
        ambioRole: 'analyst',
      });

      // Fazer impersonate
      await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ userId: targetUser.id });

      // Verificar log
      const logs = await query(
        "SELECT * FROM audit_logs WHERE action = $1 AND resource_id = $2",
        ['impersonate_start', targetUser.id]
      );

      expect(logs.rows.length).toBeGreaterThanOrEqual(1);
      expect(logs.rows[0].impersonated_by).toBe(superAdmin.id);
    });
  });
});
