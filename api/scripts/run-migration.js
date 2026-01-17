const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(filename) {
  const migrationPath = path.join(__dirname, '../src/database/migrations', filename);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Running migration: ${filename}`);
  console.log('SQL:', sql.substring(0, 200) + '...');

  try {
    await pool.query(sql);
    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const filename = process.argv[2] || '009_add_user_profile_fields.sql';
runMigration(filename);
