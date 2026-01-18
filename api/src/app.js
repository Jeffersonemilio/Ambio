const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// Routes existentes
const helloRoutes = require('./routes/hello');
const ingestRoutes = require('./routes/ingest');
const readingsRoutes = require('./routes/readings');
const sensorsRoutes = require('./routes/sensors');

// Novos módulos
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const companiesRoutes = require('./modules/companies/companies.routes');
const sensorsModuleRoutes = require('./modules/sensors/sensors.routes');
const { groupsRouter } = require('./modules/sensors/sensors.routes');
const auditRoutes = require('./modules/audit/audit.routes');

// Módulos de notificacoes
const { alertsRoutes } = require('./modules/alerts');
const { systemSettingsRoutes } = require('./modules/system-settings');

const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos estáticos de uploads (avatares, etc)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes existentes
app.use('/api', helloRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/sensors-legacy', sensorsRoutes); // Renomeado para evitar conflito
app.use('/', ingestRoutes);

// Novos módulos de autenticação e autorização
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/companies/:companyId/groups', groupsRouter);
app.use('/api/sensors', sensorsModuleRoutes);
app.use('/api/audit', auditRoutes);

// Módulos de notificacoes e alertas
app.use('/api/alerts', alertsRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

module.exports = app;
