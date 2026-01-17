/**
 * Testes do módulo Sensors
 */

const {
  app,
  request,
  createTestUser,
  createTestCompany,
  createTestSensor,
  createTestSensorGroup,
  cleanDatabase,
  closeDatabase,
} = require('./helpers/testHelpers');

describe('Sensors Module', () => {
  let superAdmin;
  let company;
  let company2;
  let companyAdmin;
  let companyUser;
  let sensor;
  let sensorGroup;

  beforeAll(async () => {
    await cleanDatabase();

    superAdmin = await createTestUser({
      email: 'superadmin@sensors-test.com',
      name: 'Super Admin',
      userType: 'ambio',
      ambioRole: 'super_admin',
    });

    company = await createTestCompany({ name: 'Sensors Test Company' });
    company2 = await createTestCompany({ name: 'Second Company' });

    companyAdmin = await createTestUser({
      email: 'companyadmin@sensors-test.com',
      name: 'Company Admin',
      userType: 'company',
      companyRole: 'admin',
      companyId: company.id,
    });

    companyUser = await createTestUser({
      email: 'companyuser@sensors-test.com',
      name: 'Company User',
      userType: 'company',
      companyRole: 'user',
      companyId: company.id,
    });

    sensorGroup = await createTestSensorGroup({
      companyId: company.id,
      name: 'Área de Produção',
      type: 'area',
    });

    sensor = await createTestSensor({
      serialNumber: 'SENSOR-TEST-MAIN',
      companyId: company.id,
      groupId: sensorGroup.id,
      name: 'Main Test Sensor',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  describe('GET /api/sensors', () => {
    it('deve listar sensores para super_admin', async () => {
      const res = await request(app)
        .get('/api/sensors')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por companyId', async () => {
      const res = await request(app)
        .get(`/api/sensors?companyId=${company.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.company_id).toBe(company.id);
      });
    });

    it('deve filtrar por groupId', async () => {
      const res = await request(app)
        .get(`/api/sensors?groupId=${sensorGroup.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.group_id).toBe(sensorGroup.id);
      });
    });

    it('deve filtrar sensores não atribuídos', async () => {
      await createTestSensor({
        serialNumber: 'SENSOR-UNASSIGNED-TEST',
        name: 'Unassigned Sensor',
      });

      const res = await request(app)
        .get('/api/sensors?unassigned=true')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.company_id).toBeNull();
      });
    });

    it('deve filtrar por search', async () => {
      const res = await request(app)
        .get('/api/sensors?search=Main')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('company admin deve ver apenas sensores da sua empresa', async () => {
      const res = await request(app)
        .get('/api/sensors')
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.company_id).toBe(company.id);
      });
    });

    it('deve retornar 401 sem autenticação', async () => {
      const res = await request(app).get('/api/sensors');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sensors/:id', () => {
    it('deve retornar sensor específico', async () => {
      const res = await request(app)
        .get(`/api/sensors/${sensor.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(sensor.id);
      expect(res.body.serial_number).toBe(sensor.serial_number);
      expect(res.body).toHaveProperty('reading_count');
      expect(res.body).toHaveProperty('last_reading_at');
    });

    it('deve retornar 404 para sensor inexistente', async () => {
      const res = await request(app)
        .get('/api/sensors/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(404);
    });

    it('company admin não deve ver sensor de outra empresa', async () => {
      const otherSensor = await createTestSensor({
        serialNumber: 'SENSOR-OTHER-COMPANY',
        companyId: company2.id,
        name: 'Other Company Sensor',
      });

      const res = await request(app)
        .get(`/api/sensors/${otherSensor.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/sensors', () => {
    it('deve criar sensor com dados válidos', async () => {
      const res = await request(app)
        .post('/api/sensors')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          serialNumber: 'SENSOR-NEW-001',
          name: 'New Sensor',
          description: 'Test sensor',
        });

      expect(res.status).toBe(201);
      expect(res.body.serial_number).toBe('SENSOR-NEW-001');
    });

    it('deve criar sensor já atribuído a empresa', async () => {
      const res = await request(app)
        .post('/api/sensors')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          serialNumber: 'SENSOR-WITH-COMPANY',
          companyId: company.id,
          name: 'Sensor with Company',
        });

      expect(res.status).toBe(201);
      expect(res.body.company_id).toBe(company.id);
    });

    it('deve retornar erro para serial duplicado', async () => {
      const res = await request(app)
        .post('/api/sensors')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          serialNumber: sensor.serial_number,
          name: 'Duplicate',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Serial');
    });

    it('deve retornar erro sem serialNumber', async () => {
      const res = await request(app)
        .post('/api/sensors')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'No Serial',
        });

      expect(res.status).toBe(400);
    });

    it('company admin deve criar sensor na sua empresa', async () => {
      const res = await request(app)
        .post('/api/sensors')
        .set('Authorization', `Bearer ${companyAdmin.token}`)
        .send({
          serialNumber: 'SENSOR-BY-COMPANY-ADMIN',
          name: 'By Company Admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.company_id).toBe(company.id);
    });
  });

  describe('PUT /api/sensors/:id', () => {
    let sensorToUpdate;

    beforeAll(async () => {
      sensorToUpdate = await createTestSensor({
        serialNumber: 'SENSOR-TO-UPDATE',
        companyId: company.id,
        name: 'To Update',
      });
    });

    it('deve atualizar nome e descrição', async () => {
      const res = await request(app)
        .put(`/api/sensors/${sensorToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.description).toBe('Updated description');
    });

    it('deve mover sensor para grupo', async () => {
      const res = await request(app)
        .put(`/api/sensors/${sensorToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ groupId: sensorGroup.id });

      expect(res.status).toBe(200);
      expect(res.body.group_id).toBe(sensorGroup.id);
    });

    it('deve desativar sensor', async () => {
      const res = await request(app)
        .put(`/api/sensors/${sensorToUpdate.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
    });

    it('deve retornar 404 para sensor inexistente', async () => {
      const res = await request(app)
        .put('/api/sensors/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/sensors/:id', () => {
    it('deve deletar sensor (apenas Ambio)', async () => {
      const sensorToDelete = await createTestSensor({
        serialNumber: 'SENSOR-TO-DELETE',
        name: 'To Delete',
      });

      const res = await request(app)
        .delete(`/api/sensors/${sensorToDelete.id}`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(204);
    });

    it('company admin não deve deletar sensores', async () => {
      const sensorNotToDelete = await createTestSensor({
        serialNumber: 'SENSOR-NOT-DELETE',
        companyId: company.id,
        name: 'Not To Delete',
      });

      const res = await request(app)
        .delete(`/api/sensors/${sensorNotToDelete.id}`)
        .set('Authorization', `Bearer ${companyAdmin.token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/sensors/:id/assign', () => {
    let sensorToAssign;

    beforeAll(async () => {
      sensorToAssign = await createTestSensor({
        serialNumber: 'SENSOR-TO-ASSIGN',
        name: 'To Assign',
      });
    });

    it('super_admin deve atribuir sensor a empresa', async () => {
      const res = await request(app)
        .put(`/api/sensors/${sensorToAssign.id}/assign`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({ companyId: company.id });

      expect(res.status).toBe(200);
      expect(res.body.company_id).toBe(company.id);
    });

    it('deve retornar erro sem companyId', async () => {
      const res = await request(app)
        .put(`/api/sensors/${sensorToAssign.id}/assign`)
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('company admin não deve atribuir sensores', async () => {
      const anotherSensor = await createTestSensor({
        serialNumber: 'SENSOR-ASSIGN-DENY',
        name: 'Assign Deny',
      });

      const res = await request(app)
        .put(`/api/sensors/${anotherSensor.id}/assign`)
        .set('Authorization', `Bearer ${companyAdmin.token}`)
        .send({ companyId: company.id });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/sensors/:id/unassign', () => {
    it('super_admin deve desatribuir sensor', async () => {
      const sensorToUnassign = await createTestSensor({
        serialNumber: 'SENSOR-TO-UNASSIGN',
        companyId: company.id,
        name: 'To Unassign',
      });

      const res = await request(app)
        .put(`/api/sensors/${sensorToUnassign.id}/unassign`)
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.company_id).toBeNull();
    });
  });

  describe('Sensor Groups', () => {
    describe('GET /api/companies/:companyId/groups', () => {
      it('deve listar grupos da empresa', async () => {
        const res = await request(app)
          .get(`/api/companies/${company.id}/groups`)
          .set('Authorization', `Bearer ${superAdmin.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('company admin deve ver grupos da sua empresa', async () => {
        const res = await request(app)
          .get(`/api/companies/${company.id}/groups`)
          .set('Authorization', `Bearer ${companyAdmin.token}`);

        expect(res.status).toBe(200);
      });
    });

    describe('POST /api/companies/:companyId/groups', () => {
      it('deve criar grupo', async () => {
        const res = await request(app)
          .post(`/api/companies/${company.id}/groups`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({
            name: 'New Group',
            type: 'equipment',
          });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('New Group');
        expect(res.body.company_id).toBe(company.id);
      });

      it('deve criar subgrupo', async () => {
        const res = await request(app)
          .post(`/api/companies/${company.id}/groups`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({
            name: 'Subgroup',
            parentId: sensorGroup.id,
            type: 'equipment',
          });

        expect(res.status).toBe(201);
        expect(res.body.parent_id).toBe(sensorGroup.id);
      });

      it('deve retornar erro sem nome', async () => {
        const res = await request(app)
          .post(`/api/companies/${company.id}/groups`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({
            type: 'area',
          });

        expect(res.status).toBe(400);
      });
    });

    describe('PUT /api/sensors/groups/:id', () => {
      it('deve atualizar grupo', async () => {
        const res = await request(app)
          .put(`/api/sensors/groups/${sensorGroup.id}`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({
            name: 'Updated Group Name',
            type: 'location',
          });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Group Name');
      });
    });

    describe('PUT /api/sensors/groups/:id/sensors', () => {
      it('deve mover sensores para grupo', async () => {
        const sensor1 = await createTestSensor({
          serialNumber: 'SENSOR-MOVE-1',
          companyId: company.id,
        });
        const sensor2 = await createTestSensor({
          serialNumber: 'SENSOR-MOVE-2',
          companyId: company.id,
        });

        const res = await request(app)
          .put(`/api/sensors/groups/${sensorGroup.id}/sensors`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({
            sensorIds: [sensor1.id, sensor2.id],
          });

        expect(res.status).toBe(200);
        expect(res.body.moved).toBe(2);
      });

      it('deve retornar erro sem sensorIds', async () => {
        const res = await request(app)
          .put(`/api/sensors/groups/${sensorGroup.id}/sensors`)
          .set('Authorization', `Bearer ${superAdmin.token}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe('DELETE /api/sensors/groups/:id', () => {
      it('deve deletar grupo', async () => {
        const groupToDelete = await createTestSensorGroup({
          companyId: company.id,
          name: 'To Delete',
        });

        const res = await request(app)
          .delete(`/api/sensors/groups/${groupToDelete.id}`)
          .set('Authorization', `Bearer ${superAdmin.token}`);

        expect(res.status).toBe(204);
      });
    });
  });
});
