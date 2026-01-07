import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || 'postgresql://iot:iot123@localhost:5432/iot_sensores',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://iot:iot123@localhost:5672',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@iotsensores.com',
  },

  alerts: {
    cooldownDefault: parseInt(process.env.ALERT_COOLDOWN_DEFAULT || '30', 10),
    sensorOfflineThreshold: parseInt(process.env.SENSOR_OFFLINE_THRESHOLD || '30', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export type Config = typeof config;
