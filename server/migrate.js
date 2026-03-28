/**
 * migrate.js — Tạo schema + import data.json vào PostgreSQL
 * node server/migrate.js
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../src/data/data.json');

const pool = new pg.Pool({
  host: 'localhost', port: 5432,
  user: 'postgres', password: 'postgres',
  database: 'postgres', // connect vào default db trước
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔌 Kết nối PostgreSQL thành công');

    // 1. Tạo database nếu chưa có
    await client.query(`SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity WHERE datname = 'projecthuman' AND pid <> pg_backend_pid()`);
    const dbExists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'projecthuman'`
    );
    if (dbExists.rows.length === 0) {
      await client.query('CREATE DATABASE projecthuman');
      console.log('✅ Tạo database "projecthuman"');
    } else {
      console.log('ℹ️  Database "projecthuman" đã tồn tại');
    }
  } finally {
    client.release();
    await pool.end();
  }

  // 2. Kết nối vào projecthuman
  const ph = new pg.Pool({
    host: 'localhost', port: 5432,
    user: 'postgres', password: 'postgres',
    database: 'projecthuman',
  });

  const c = await ph.connect();
  try {
    // 3. Tạo schema
    const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
    await c.query(schema);
    console.log('✅ Schema tạo xong');

    // 3b. Migrate: thêm columns mới nếu chưa có (idempotent)
    await c.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url   VARCHAR(500) DEFAULT ''`);
    await c.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS portrait_url VARCHAR(500) DEFAULT ''`);
    console.log('✅ Migrate columns avatar_url, portrait_url xong');

    // 4. Load data.json
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📦 Dữ liệu: ${data.members.length} members, ${data.projects.length} projects`);

    await c.query('BEGIN');

    // 5. Xoá data cũ (nếu chạy lại)
    await c.query('DELETE FROM project_members');
    await c.query('DELETE FROM projects');
    await c.query('DELETE FROM members');

    // 6. Insert members
    for (const m of data.members) {
      await c.query(
        `INSERT INTO members (id, name, role, color, avatar)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE
           SET name=$2, role=$3, color=$4, avatar=$5`,
        [m.id, m.name, m.role || '', m.color || '#6366f1', m.avatar || '']
      );
    }
    console.log(`  ✅ Inserted ${data.members.length} members`);

    // 7. Insert projects
    for (const p of data.projects) {
      await c.query(
        `INSERT INTO projects
           (id, name, description, status, priority, color, start_date, end_date, progress, budget, spent, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE
           SET name=$2, description=$3, status=$4, priority=$5, color=$6,
               start_date=$7, end_date=$8, progress=$9, budget=$10, spent=$11, tags=$12`,
        [
          p.id, p.name, p.description || '', p.status, p.priority,
          p.color || '#6366f1',
          p.startDate || null, p.endDate || null,
          p.progress || 0, p.budget || 0, p.spent || 0,
          p.tags || [],
        ]
      );

      // 8. Insert project_members
      for (const pm of (p.members || [])) {
        await c.query(
          `INSERT INTO project_members (project_id, member_id, project_role)
           VALUES ($1,$2,$3)
           ON CONFLICT (project_id, member_id) DO UPDATE SET project_role=$3`,
          [p.id, pm.memberId, pm.projectRole || '']
        );
      }
    }
    console.log(`  ✅ Inserted ${data.projects.length} projects`);

    // 9. Cập nhật meta.updated_at
    await c.query(`UPDATE meta SET value=EXTRACT(EPOCH FROM NOW())::TEXT, updated_at=NOW() WHERE key='updated_at'`);

    await c.query('COMMIT');
    console.log('\n🎉 Migration hoàn tất! Dữ liệu đã vào PostgreSQL.');

    // 10. Verify
    const mCount = await c.query('SELECT COUNT(*) FROM members');
    const pCount = await c.query('SELECT COUNT(*) FROM projects');
    const pmCount = await c.query('SELECT COUNT(*) FROM project_members');
    console.log(`\n📊 Verify:`);
    console.log(`   members:         ${mCount.rows[0].count}`);
    console.log(`   projects:        ${pCount.rows[0].count}`);
    console.log(`   project_members: ${pmCount.rows[0].count}`);

  } catch (e) {
    await c.query('ROLLBACK');
    console.error('❌ Lỗi migration:', e.message);
    process.exit(1);
  } finally {
    c.release();
    await ph.end();
  }
}

run();
