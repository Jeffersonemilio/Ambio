require('dotenv').config();

const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ambio',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  port: parseInt(process.env.PORT || '3000', 10),
};

module.exports = config;
