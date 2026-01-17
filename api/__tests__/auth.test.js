/**
 * Testes do módulo Auth
 */

const {
  app,
  request,
  createTestUser,
  cleanDatabase,
  closeDatabase,
  query,
} = require('./helpers/testHelpers');

describe('Auth Module', () => {
  let testUser;

  beforeAll(async () => {
    await cleanDatabase();
    testUser = await createTestUser({
      email: 'auth-test@ambio.com',
      password: 'Test@123456',
      name: 'Auth Test User',
      userType: 'ambio',
      ambioRole: 'super_admin',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.plainPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('expiresIn');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('deve retornar erro com email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@ambio.com',
          password: 'Test@123456',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro com senha inválida', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'SenhaErrada123',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro sem email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test@123456',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro para usuário inativo', async () => {
      const inactiveUser = await createTestUser({
        email: 'inactive@ambio.com',
        password: 'Test@123456',
        name: 'Inactive User',
      });

      await query('UPDATE users SET is_active = false WHERE id = $1', [inactiveUser.id]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveUser.email,
          password: inactiveUser.plainPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('inativo');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.plainPassword,
        });
      refreshToken = loginRes.body.refreshToken;
    });

    it('deve renovar o token com refresh token válido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('expiresIn');
    });

    it('deve retornar erro com refresh token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token-invalido' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro sem refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('deve fazer logout com token válido', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.plainPassword,
        });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('deve retornar erro sem token de autenticação', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('permissions');
    });

    it('deve retornar erro sem token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('deve retornar erro com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('deve aceitar solicitação de reset de senha', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('deve aceitar mesmo com email inexistente (segurança)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'naoexiste@test.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('deve retornar erro sem email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('deve retornar erro com token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'token-invalido',
          newPassword: 'NovaSenha@123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar erro com senha curta', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'qualquer-token',
          newPassword: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 caracteres');
    });

    it('deve retornar erro sem token ou senha', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/impersonate', () => {
    let supportUser;
    let targetUser;

    beforeAll(async () => {
      supportUser = await createTestUser({
        email: 'support-test@ambio.com',
        name: 'Support User',
        userType: 'ambio',
        ambioRole: 'support',
      });

      targetUser = await createTestUser({
        email: 'target@ambio.com',
        name: 'Target User',
        userType: 'ambio',
        ambioRole: 'analyst',
      });
    });

    it('deve permitir super_admin impersonar', async () => {
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(targetUser.id);
    });

    it('deve permitir support impersonar', async () => {
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${supportUser.token}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('deve negar impersonate para analyst', async () => {
      const analystUser = await createTestUser({
        email: 'analyst-imp@ambio.com',
        name: 'Analyst',
        userType: 'ambio',
        ambioRole: 'analyst',
      });

      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${analystUser.token}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(403);
    });

    it('deve retornar erro sem userId', async () => {
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('deve retornar erro para usuário inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/impersonate')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/admin-reset-password', () => {
    let targetUser;

    beforeAll(async () => {
      targetUser = await createTestUser({
        email: 'reset-target@ambio.com',
        name: 'Reset Target',
        userType: 'ambio',
        ambioRole: 'analyst',
      });
    });

    it('deve permitir super_admin resetar senha', async () => {
      const res = await request(app)
        .post('/api/auth/admin-reset-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('deve retornar erro sem userId', async () => {
      const res = await request(app)
        .post('/api/auth/admin-reset-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
