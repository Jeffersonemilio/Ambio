/**
 * Testes da Ingestão de Dados
 */

const {
  app,
  request,
  createTestUser,
  createTestCompany,
  createTestSensor,
  cleanDatabase,
  closeDatabase,
  query,
} = require('./helpers/testHelpers');

// Mock do RabbitMQ para evitar dependência externa
jest.mock('../src/queue', () => ({
  publishToQueue: jest.fn().mockResolvedValue(true),
  QUEUES: {
    READINGS_PROCESS: 'readings.process',
  },
}));

describe('Ingest Module', () => {
  let company;
  let activeSensor;
  let inactiveSensor;
  let unassignedSensor;

  beforeAll(async () => {
    await cleanDatabase();

    company = await createTestCompany({ name: 'Ingest Test Company' });

    activeSensor = await createTestSensor({
      serialNumber: 'SENSOR-ACTIVE-001',
      companyId: company.id,
      name: 'Active Sensor',
      isActive: true,
    });

    inactiveSensor = await createTestSensor({
      serialNumber: 'SENSOR-INACTIVE-001',
      companyId: company.id,
      name: 'Inactive Sensor',
      isActive: false,
    });

    unassignedSensor = await createTestSensor({
      serialNumber: 'SENSOR-UNASSIGNED-001',
      name: 'Unassigned Sensor',
      isActive: true,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ingest-temp-hum', () => {
    it('deve aceitar leitura de sensor ativo e atribuído', async () => {
      const res = await request(app)
        .post('/ingest-temp-hum')
        .send({
          serial_number: activeSensor.serial_number,
          temperature: 25.5,
          humidity: 60.0,
          'battery level': 'HIGH',
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('received_at');
      expect(res.body.message).toContain('enfileirada');
    });

    it('deve rejeitar leitura de sensor não cadastrado', async () => {
      const res = await request(app)
        .post('/ingest-temp-hum')
        .send({
          serial_number: 'SENSOR-NAO-EXISTE',
          temperature: 25.5,
          humidity: 60.0,
          'battery level': 'HIGH',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('não cadastrado');
    });

    it('deve rejeitar leitura de sensor não atribuído', async () => {
      const res = await request(app)
        .post('/ingest-temp-hum')
        .send({
          serial_number: unassignedSensor.serial_number,
          temperature: 25.5,
          humidity: 60.0,
          'battery level': 'HIGH',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('não está atribuído');
    });

    it('deve rejeitar leitura de sensor inativo', async () => {
      const res = await request(app)
        .post('/ingest-temp-hum')
        .send({
          serial_number: inactiveSensor.serial_number,
          temperature: 25.5,
          humidity: 60.0,
          'battery level': 'HIGH',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('desativado');
    });

    describe('Validação de Payload', () => {
      it('deve rejeitar sem serial_number', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            temperature: 25.5,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toContain('serial_number é obrigatório e deve ser uma string');
      });

      it('deve rejeitar serial_number muito longo', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: 'A'.repeat(51),
            temperature: 25.5,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('serial_number deve ter no máximo 50 caracteres');
      });

      it('deve rejeitar sem temperature', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('temperature é obrigatório e deve ser um número');
      });

      it('deve rejeitar temperature fora do range', async () => {
        const res1 = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: -60,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res1.status).toBe(400);
        expect(res1.body.errors).toContain('temperature deve estar entre -50 e 100');

        const res2 = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 110,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res2.status).toBe(400);
        expect(res2.body.errors).toContain('temperature deve estar entre -50 e 100');
      });

      it('deve rejeitar sem humidity', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('humidity é obrigatório e deve ser um número');
      });

      it('deve rejeitar humidity fora do range', async () => {
        const res1 = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: -10,
            'battery level': 'HIGH',
          });

        expect(res1.status).toBe(400);
        expect(res1.body.errors).toContain('humidity deve estar entre 0 e 100');

        const res2 = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 110,
            'battery level': 'HIGH',
          });

        expect(res2.status).toBe(400);
        expect(res2.body.errors).toContain('humidity deve estar entre 0 e 100');
      });

      it('deve rejeitar sem battery level', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 60.0,
          });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('battery level é obrigatório e deve ser uma string');
      });

      it('deve rejeitar battery level inválido', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 60.0,
            'battery level': 'INVALID',
          });

        expect(res.status).toBe(400);
        expect(res.body.errors[0]).toContain('battery level deve ser um dos valores');
      });

      it('deve aceitar battery level em lowercase', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 60.0,
            'battery level': 'low',
          });

        expect(res.status).toBe(202);
      });

      it('deve aceitar todos os níveis de bateria válidos', async () => {
        const levels = ['LOW', 'MEDIUM', 'HIGH'];

        for (const level of levels) {
          const res = await request(app)
            .post('/ingest-temp-hum')
            .send({
              serial_number: activeSensor.serial_number,
              temperature: 25.5,
              humidity: 60.0,
              'battery level': level,
            });

          expect(res.status).toBe(202);
        }
      });
    });

    describe('Casos de Borda', () => {
      it('deve aceitar temperatura mínima', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: -50,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(202);
      });

      it('deve aceitar temperatura máxima', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 100,
            humidity: 60.0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(202);
      });

      it('deve aceitar humidity mínima', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 0,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(202);
      });

      it('deve aceitar humidity máxima', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.5,
            humidity: 100,
            'battery level': 'HIGH',
          });

        expect(res.status).toBe(202);
      });

      it('deve aceitar valores decimais', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            serial_number: activeSensor.serial_number,
            temperature: 25.123456,
            humidity: 60.987654,
            'battery level': 'MEDIUM',
          });

        expect(res.status).toBe(202);
      });

      it('deve retornar múltiplos erros de validação', async () => {
        const res = await request(app)
          .post('/ingest-temp-hum')
          .send({
            temperature: 'invalid',
            humidity: 'invalid',
          });

        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBeGreaterThan(1);
      });
    });
  });
});
