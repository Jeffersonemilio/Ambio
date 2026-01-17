const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ambio API',
      version: '1.0.0',
      description: 'API Ambio documentada com Swagger',
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
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
