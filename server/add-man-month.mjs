// One-time migration: add man_month column to members table
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'postgres',
  database: 'projecthuman',
});

try {
  await pool.query('ALTER TABLE members ADD COLUMN IF NOT EXISTS man_month BIGINT DEFAULT 0');
  console.log('✅ Column man_month added (or already existed)');
} catch (e) {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
