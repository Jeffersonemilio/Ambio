import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './index.js';
import { logger } from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<{ name: string }>('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row) => row.name);
}

async function runMigration(filename: string): Promise<void> {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    logger.info({ migration: filename }, 'Migration executed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, migration: filename }, 'Migration failed');
    throw err;
  } finally {
    client.release();
  }
}

export async function migrate(): Promise<void> {
  logger.info('Starting migrations...');

  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    logger.info('Created migrations directory');
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return;
  }

  for (const file of pending) {
    await runMigration(file);
  }

  logger.info({ count: pending.length }, 'All migrations completed');
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Migration failed');
      process.exit(1);
    });
}
