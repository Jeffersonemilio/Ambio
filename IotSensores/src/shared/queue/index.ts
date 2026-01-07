import amqp from 'amqplib';
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { config } from '../../config/index.js';
import { logger } from '../logger/index.js';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const QUEUES = {
  READINGS_PROCESS: 'readings.process',
  NOTIFICATIONS_SEND: 'notifications.send',
  ALERTS_CREATED: 'alerts.created',
} as const;

export const EXCHANGES = {
  READINGS: 'readings',
  ALERTS: 'alerts',
  NOTIFICATIONS: 'notifications',
} as const;

export async function connectQueue(): Promise<Channel> {
  if (channel) return channel;

  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    // Setup exchanges
    await channel.assertExchange(EXCHANGES.READINGS, 'direct', { durable: true });
    await channel.assertExchange(EXCHANGES.ALERTS, 'direct', { durable: true });
    await channel.assertExchange(EXCHANGES.NOTIFICATIONS, 'direct', { durable: true });

    // Setup queues
    await channel.assertQueue(QUEUES.READINGS_PROCESS, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'readings.dlx',
      },
    });

    await channel.assertQueue(QUEUES.NOTIFICATIONS_SEND, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'notifications.dlx',
      },
    });

    await channel.assertQueue(QUEUES.ALERTS_CREATED, {
      durable: true,
    });

    // Bind queues to exchanges
    await channel.bindQueue(QUEUES.READINGS_PROCESS, EXCHANGES.READINGS, 'process');
    await channel.bindQueue(QUEUES.NOTIFICATIONS_SEND, EXCHANGES.NOTIFICATIONS, 'send');
    await channel.bindQueue(QUEUES.ALERTS_CREATED, EXCHANGES.ALERTS, 'created');

    // Setup DLX (Dead Letter Exchange)
    await channel.assertExchange('readings.dlx', 'direct', { durable: true });
    await channel.assertQueue('readings.dlq', { durable: true });
    await channel.bindQueue('readings.dlq', 'readings.dlx', 'process');

    await channel.assertExchange('notifications.dlx', 'direct', { durable: true });
    await channel.assertQueue('notifications.dlq', { durable: true });
    await channel.bindQueue('notifications.dlq', 'notifications.dlx', 'send');

    connection.on('error', (err) => {
      logger.error({ err }, 'RabbitMQ connection error');
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      channel = null;
      connection = null;
    });

    logger.info('RabbitMQ connection established');
    return channel;
  } catch (err) {
    logger.error({ err }, 'Failed to connect to RabbitMQ');
    throw err;
  }
}

export async function publishToQueue(queue: string, message: object): Promise<boolean> {
  const ch = await connectQueue();
  const content = Buffer.from(JSON.stringify(message));

  return ch.sendToQueue(queue, content, {
    persistent: true,
    contentType: 'application/json',
  });
}

export async function publishToExchange(
  exchange: string,
  routingKey: string,
  message: object
): Promise<boolean> {
  const ch = await connectQueue();
  const content = Buffer.from(JSON.stringify(message));

  return ch.publish(exchange, routingKey, content, {
    persistent: true,
    contentType: 'application/json',
  });
}

export async function consumeQueue(
  queue: string,
  handler: (msg: ConsumeMessage) => Promise<void>,
  options: { prefetch?: number } = {}
): Promise<void> {
  const ch = await connectQueue();

  if (options.prefetch) {
    await ch.prefetch(options.prefetch);
  }

  await ch.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      await handler(msg);
      ch.ack(msg);
    } catch (err) {
      logger.error({ err, queue }, 'Error processing message');
      ch.nack(msg, false, false); // Send to DLQ
    }
  });

  logger.info({ queue }, 'Started consuming queue');
}

export async function testQueueConnection(): Promise<boolean> {
  try {
    await connectQueue();
    logger.info('RabbitMQ connection successful');
    return true;
  } catch (err) {
    logger.error({ err }, 'RabbitMQ connection failed');
    return false;
  }
}

export async function closeQueue(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  logger.info('RabbitMQ connection closed');
}

export type { ConsumeMessage };
