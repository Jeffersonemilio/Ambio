import pg, { QueryResultRow } from 'pg';
import { config } from '../../config/index.js';
import { logger } from '../logger/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle client');
});

pool.on('connect', () => {
  logger.debug('New client connected to database');
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug({ text, duration, rows: result.rowCount }, 'Executed query');
  return result;
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database connection failed');
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
