const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ambio API',
      version: '1.0.0',
      description: 'API Ambio - Plataforma de monitoramento de sensores ambientais',
    },
    servers: [
      {
        url: 'https://ambio-production.up.railway.app',
        description: 'Servidor de produção (Railway)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Mensagem de erro' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            userType: { type: 'string', enum: ['ambio', 'company'] },
            role: { type: 'string' },
            companyId: { type: 'string', format: 'uuid', nullable: true },
            companyName: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            cnpj: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Sensor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            serialNumber: { type: 'string' },
            model: { type: 'string' },
            companyId: { type: 'string', format: 'uuid', nullable: true },
            groupId: { type: 'string', format: 'uuid', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            resourceType: { type: 'string' },
            resourceId: { type: 'string' },
            details: { type: 'object' },
            ipAddress: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticação e autorização' },
      { name: 'Users', description: 'Gerenciamento de usuários' },
      { name: 'Companies', description: 'Gerenciamento de empresas' },
      { name: 'Sensors', description: 'Gerenciamento de sensores' },
      { name: 'Sensor Groups', description: 'Grupos de sensores' },
      { name: 'Audit', description: 'Logs de auditoria' },
      { name: 'Ingest', description: 'Ingestão de dados de sensores' },
    ],
  },
  apis: ['./src/routes/*.js', './src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
