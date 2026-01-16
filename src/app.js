const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const helloRoutes = require('./routes/hello');
const ingestRoutes = require('./routes/ingest');
const readingsRoutes = require('./routes/readings');
const sensorsRoutes = require('./routes/sensors');

const app = express();

app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', helloRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/', ingestRoutes);

module.exports = app;
