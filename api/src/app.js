const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const helloRoutes = require('./routes/hello');
const ingestRoutes = require('./routes/ingest');
const readingsRoutes = require('./routes/readings');
const sensorsRoutes = require('./routes/sensors');

const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', helloRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/', ingestRoutes);

module.exports = app;
