import cluster from 'cluster';
import os from 'os';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import multer from 'multer';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.resolve(__dirname, './config.json');

// ── Upload directories ────────────────────────────────────────────────────
const UPLOADS_DIR   = path.resolve(__dirname, './uploads');
const AVATARS_DIR   = path.resolve(UPLOADS_DIR, 'avatars');
const PORTRAITS_DIR = path.resolve(UPLOADS_DIR, 'portraits');
fs.mkdirSync(AVATARS_DIR,   { recursive: true });
fs.mkdirSync(PORTRAITS_DIR, { recursive: true });

// Slugify tên thành filename-safe (bỏ dấu tiếng Việt)
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Chỉ cho phép image files
function imageFilter(req, file, cb) {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), false);
  }
}

// Multer dùng memoryStorage để lấy tên member từ DB trước khi lưu
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: imageFilter,
});

// ── Cluster: 8 workers cho i9-14900K (32 CPUs) ───────────────────────────
const WORKERS = Math.min(os.cpus().length, 8);

if (cluster.isPrimary) {
  console.log(`\n🚀  Master ${process.pid} — spawning ${WORKERS} workers`);
  for (let i = 0; i < WORKERS; i++) cluster.fork();

  cluster.on('exit', (worker, code) => {
    console.log(`⚠️  Worker ${worker.process.pid} exited (code ${code}) — restarting...`);
    cluster.fork();
  });

} else {
  // ══════════════════════════════════════════════════════════════════════
  // WORKER PROCESS
  // ══════════════════════════════════════════════════════════════════════

  // Pool per-worker: 5 connections × 8 workers = 40 total DB connections
  const pool = new pg.Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 }
      : { connectionString: 'postgresql://ph_app:Ph@pp2026!xK9mRq@42.119.236.229:5432/projecthuman', max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 }
  );
  pool.on('error', e => console.error(`[W${process.pid}] DB pool error:`, e.message));

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '2mb' }));
  // Serve uploaded images: GET /uploads/avatars/xxx.jpg
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Serve React build (production)
  const DIST_DIR = path.resolve(__dirname, '../dist');
  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); }
    catch { return { allowedIPs: ['*'] }; }
  }

  function getClientIP(req) {
    const raw = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
      || req.socket.remoteAddress || '';
    return raw.replace(/^::ffff:/, '');
  }

  function canEdit(ip) {
    const { allowedIPs } = loadConfig();
    if (!Array.isArray(allowedIPs)) return false;
    return allowedIPs.includes('*') || allowedIPs.includes(ip);
  }

  function requirePermission(req, res, next) {
    const ip = getClientIP(req);
    if (!canEdit(ip)) {
      appendLog('BLOCKED', ip, 'IP not in whitelist');
      return res.status(403).json({ error: `IP ${ip} không có quyền chỉnh sửa.` });
    }
    next();
  }

  async function appendLog(event, ip, detail = '', snapshot = null) {
    try {
      await pool.query(
        `INSERT INTO write_log (event, ip, detail, snapshot) VALUES ($1,$2,$3,$4)`,
        [event, ip, detail, snapshot ? JSON.stringify(snapshot) : null]
      );
      console.log(`[W${process.pid}][${new Date().toISOString()}] ${event} | ${ip} | ${detail}`);
    } catch (e) {
      console.error(`[W${process.pid}][LOG] failed:`, e.message);
    }
  }

  // ── Read ─────────────────────────────────────────────────────────────────
  async function readData(client) {
    const c = client || pool;
    const [mRows, pRows, pmRows, meta] = await Promise.all([
      c.query(`SELECT id, name, role, color, avatar, is_admin AS "isAdmin",
                      man_month AS "manMonth",
                      avatar_url   AS "avatarUrl",
                      portrait_url AS "portraitUrl",
                      created_by_ip AS "createdByIp",
                      TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
                      updated_by_ip AS "updatedByIp",
                      TO_CHAR(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
               FROM members ORDER BY created_at`),
      c.query(`SELECT id, name, description, status, priority, color,
                      TO_CHAR(start_date,'YYYY-MM-DD') AS "startDate",
                      TO_CHAR(end_date,'YYYY-MM-DD')   AS "endDate",
                      progress, budget, spent, tags,
                      need_lead AS "needLead",
                      TO_CHAR(volunteer_deadline,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "volunteerDeadline",
                      created_by_ip AS "createdByIp",
                      TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
                      updated_by_ip AS "updatedByIp",
                      TO_CHAR(updated_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
               FROM projects ORDER BY created_at`),
      c.query(`SELECT project_id AS "projectId", member_id AS "memberId", project_role AS "projectRole"
               FROM project_members`),
      c.query(`SELECT value FROM meta WHERE key='updated_at'`),
    ]);

    const pmByProject = {};
    for (const pm of pmRows.rows) {
      if (!pmByProject[pm.projectId]) pmByProject[pm.projectId] = [];
      pmByProject[pm.projectId].push({ memberId: pm.memberId, projectRole: pm.projectRole });
    }

    return {
      members: mRows.rows.map(m => ({ ...m, manMonth: Number(m.manMonth) })),
      projects: pRows.rows.map(p => ({
        ...p,
        budget: Number(p.budget),
        spent:  Number(p.spent),
        members: pmByProject[p.id] || [],
      })),
      _updatedAt: parseFloat(meta.rows[0]?.value || '0') * 1000,
    };
  }

  // ── Write — pg advisory lock thay cho in-memory queue ───────────────────
  //
  // Stale check per-record thay vì global:
  //   • Edit/delete: chỉ áp dụng lên records đã tồn tại khi client load
  //   • Records được tạo SAU khi client load → giữ nguyên, không xóa
  //   • Cùng record bị sửa đồng thời → last-write-wins (chấp nhận được)
  //
  async function writeData(data, ip, clientLoadedAt) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Không dùng global advisory lock — để PostgreSQL row-level locking tự xử lý.
      // Các write lên record khác nhau chạy song song hoàn toàn.
      // Cùng record: last-write-wins (MVCC, không deadlock).

      const before = await readData(client);
      await appendLog('WRITE_START', ip,
        `members:${data.members?.length} projects:${data.projects?.length}`,
        before
      );

      const now = new Date();
      // clientLoadedAt: thời điểm client load data lần cuối (ms epoch)
      // Dùng để phân biệt "client biết record này" vs "record mới tạo sau khi client load"
      const loadedAt = clientLoadedAt ? new Date(clientLoadedAt) : new Date(0);

      // ── MEMBERS ──────────────────────────────────────────────────────────
      const existingMembersRows = await client.query(
        'SELECT id, created_at FROM members'
      );
      const existingMembers = new Map(existingMembersRows.rows.map(r => [r.id, r.created_at]));
      const incomingMemberIds = new Set((data.members || []).map(m => m.id));

      for (const m of (data.members || [])) {
        if (!existingMembers.has(m.id)) {
          await client.query(
            `INSERT INTO members (id, name, role, color, avatar, man_month, created_by_ip, updated_by_ip, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$8)`,
            [m.id, m.name, m.role || '', m.color || '#6366f1', m.avatar || '', m.manMonth || 0, ip, now]
          );
        } else {
          await client.query(
            `UPDATE members SET name=$2, role=$3, color=$4, avatar=$5,
                                man_month=$6, updated_by_ip=$7, updated_at=$8
             WHERE id=$1`,
            [m.id, m.name, m.role || '', m.color || '#6366f1', m.avatar || '', m.manMonth || 0, ip, now]
          );
        }
      }

      // Chỉ xóa members mà client đã biết (created_at <= loadedAt)
      // Records tạo sau khi client load → giữ nguyên
      for (const [id, createdAt] of existingMembers) {
        if (!incomingMemberIds.has(id) && new Date(createdAt) <= loadedAt) {
          await client.query('DELETE FROM project_members WHERE member_id=$1', [id]);
          await client.query('DELETE FROM members WHERE id=$1', [id]);
        }
      }

      // ── PROJECTS ─────────────────────────────────────────────────────────
      const existingProjectsRows = await client.query(
        'SELECT id, created_at FROM projects'
      );
      const existingProjects = new Map(existingProjectsRows.rows.map(r => [r.id, r.created_at]));
      const incomingProjectIds = new Set((data.projects || []).map(p => p.id));

      for (const p of (data.projects || [])) {
        if (!existingProjects.has(p.id)) {
          await client.query(
            `INSERT INTO projects
               (id, name, description, status, priority, color, start_date, end_date,
                progress, budget, spent, tags, created_by_ip, updated_by_ip, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$14,$14)`,
            [p.id, p.name, p.description || '', p.status, p.priority,
             p.color || '#6366f1', p.startDate || null, p.endDate || null,
             p.progress || 0, p.budget || 0, p.spent || 0, p.tags || [], ip, now]
          );
        } else {
          await client.query(
            `UPDATE projects SET name=$2, description=$3, status=$4, priority=$5,
                                 color=$6, start_date=$7, end_date=$8, progress=$9,
                                 budget=$10, spent=$11, tags=$12,
                                 updated_by_ip=$13, updated_at=$14
             WHERE id=$1`,
            [p.id, p.name, p.description || '', p.status, p.priority,
             p.color || '#6366f1', p.startDate || null, p.endDate || null,
             p.progress || 0, p.budget || 0, p.spent || 0, p.tags || [], ip, now]
          );
        }

        await client.query('DELETE FROM project_members WHERE project_id=$1', [p.id]);
        for (const pm of (p.members || [])) {
          await client.query(
            `INSERT INTO project_members (project_id, member_id, project_role) VALUES ($1,$2,$3)`,
            [p.id, pm.memberId, pm.projectRole || '']
          );
        }
      }

      // Chỉ xóa projects mà client đã biết
      for (const [id, createdAt] of existingProjects) {
        if (!incomingProjectIds.has(id) && new Date(createdAt) <= loadedAt) {
          await client.query('DELETE FROM project_members WHERE project_id=$1', [id]);
          await client.query('DELETE FROM projects WHERE id=$1', [id]);
        }
      }

      const newTs = Date.now();
      await client.query(
        `UPDATE meta SET value=$1, updated_at=NOW() WHERE key='updated_at'`,
        [(newTs / 1000).toString()]
      );

      await client.query('COMMIT');
      await appendLog('WRITE_OK', ip,
        `members:${data.members?.length} projects:${data.projects?.length}`
      );
      return newTs;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ── bumpTimestamp — cập nhật global version sau mỗi write ──────────────
  async function bumpTimestamp(client) {
    const newTs = Date.now();
    await client.query(
      `UPDATE meta SET value=$1, updated_at=NOW() WHERE key='updated_at'`,
      [(newTs / 1000).toString()]
    );
    return newTs;
  }

  // ── Helper: run fn trong transaction, trả về { ok, _updatedAt } ─────────
  async function withTx(res, fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const newTs = await fn(client);
      await client.query('COMMIT');
      res.json({ ok: true, _updatedAt: newTs });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e.message);
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // GET /api/data — read-only
  app.get('/api/data', async (req, res) => {
    const ip = getClientIP(req);
    try {
      const data = await readData();
      await appendLog('READ', ip);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Không thể đọc dữ liệu: ' + e.message });
    }
  });

  // ── MEMBERS ──────────────────────────────────────────────────────────────

  // POST /api/members — thêm member mới (chỉ ghi 1 row)
  app.post('/api/members', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const m = req.body;
    if (!m.id || !m.name) return res.status(400).json({ error: 'Missing id or name' });
    await withTx(res, async (c) => {
      await c.query(
        `INSERT INTO members (id, name, role, color, avatar, man_month, created_by_ip, updated_by_ip, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7,NOW(),NOW())`,
        [m.id, m.name, m.role || '', m.color || '#6366f1', m.avatar || '', m.manMonth || 0, ip]
      );
      await appendLog('ADD_MEMBER', ip, `id:${m.id} name:${m.name}`);
      return bumpTimestamp(c);
    });
  });

  // PATCH /api/members/:id — cập nhật member (chỉ ghi 1 row)
  app.patch('/api/members/:id', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const { id } = req.params;
    const m = req.body;
    await withTx(res, async (c) => {
      const r = await c.query(
        `UPDATE members SET name=$2, role=$3, color=$4, avatar=$5, man_month=$6, updated_by_ip=$7, updated_at=NOW()
         WHERE id=$1 RETURNING id`,
        [id, m.name, m.role || '', m.color || '#6366f1', m.avatar || '', m.manMonth || 0, ip]
      );
      if (!r.rowCount) throw new Error(`Member ${id} không tồn tại`);
      await appendLog('UPDATE_MEMBER', ip, `id:${id}`);
      return bumpTimestamp(c);
    });
  });

  // DELETE /api/members/:id — xóa member (cascade project_members)
  app.delete('/api/members/:id', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const { id } = req.params;
    await withTx(res, async (c) => {
      await c.query('DELETE FROM project_members WHERE member_id=$1', [id]);
      await c.query('DELETE FROM members WHERE id=$1', [id]);
      await appendLog('DELETE_MEMBER', ip, `id:${id}`);
      return bumpTimestamp(c);
    });
  });

  // POST /api/members/:id/avatar — upload ảnh avatar
  app.post('/api/members/:id/avatar', requirePermission, upload.single('avatar'), async (req, res) => {
    const ip  = getClientIP(req);
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Không có file ảnh' });
    try {
      // Lấy tên member để đặt tên file
      const row = await pool.query('SELECT name, avatar_url FROM members WHERE id=$1', [id]);
      if (!row.rowCount) return res.status(404).json({ error: 'Member không tồn tại' });
      const memberName = row.rows[0].name;
      const oldUrl     = row.rows[0].avatar_url;

      // Xóa file cũ nếu có
      if (oldUrl) {
        const oldPath = path.join(UPLOADS_DIR, oldUrl.replace('/uploads/', ''));
        fs.rm(oldPath, () => {});
      }

      const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename = `${slugify(memberName)}_${id}_avatar${ext}`;
      const filePath = path.join(AVATARS_DIR, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const avatarUrl = `/uploads/avatars/${filename}`;
      await pool.query(
        `UPDATE members SET avatar_url=$1, updated_by_ip=$2, updated_at=NOW() WHERE id=$3`,
        [avatarUrl, ip, id]
      );
      await appendLog('UPLOAD_AVATAR', ip, `id:${id} file:${filename}`);
      res.json({ ok: true, avatarUrl });
    } catch (e) {
      console.error('UPLOAD_AVATAR error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/members/:id/portrait — upload ảnh chân dung
  app.post('/api/members/:id/portrait', requirePermission, upload.single('portrait'), async (req, res) => {
    const ip  = getClientIP(req);
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Không có file ảnh' });
    try {
      const row = await pool.query('SELECT name, portrait_url FROM members WHERE id=$1', [id]);
      if (!row.rowCount) return res.status(404).json({ error: 'Member không tồn tại' });
      const memberName = row.rows[0].name;
      const oldUrl     = row.rows[0].portrait_url;

      if (oldUrl) {
        const oldPath = path.join(UPLOADS_DIR, oldUrl.replace('/uploads/', ''));
        fs.rm(oldPath, () => {});
      }

      const ext      = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename = `${slugify(memberName)}_${id}_portrait${ext}`;
      const filePath = path.join(PORTRAITS_DIR, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const portraitUrl = `/uploads/portraits/${filename}`;
      await pool.query(
        `UPDATE members SET portrait_url=$1, updated_by_ip=$2, updated_at=NOW() WHERE id=$3`,
        [portraitUrl, ip, id]
      );
      await appendLog('UPLOAD_PORTRAIT', ip, `id:${id} file:${filename}`);
      res.json({ ok: true, portraitUrl });
    } catch (e) {
      console.error('UPLOAD_PORTRAIT error:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── PROJECTS ─────────────────────────────────────────────────────────────

  // POST /api/projects — thêm project mới
  app.post('/api/projects', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const p = req.body;
    if (!p.id || !p.name) return res.status(400).json({ error: 'Missing id or name' });
    await withTx(res, async (c) => {
      await c.query(
        `INSERT INTO projects (id, name, description, status, priority, color,
           start_date, end_date, progress, budget, spent, tags,
           need_lead, volunteer_deadline,
           created_by_ip, updated_by_ip, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15,NOW(),NOW())`,
        [p.id, p.name, p.description || '', p.status, p.priority, p.color || '#6366f1',
         p.startDate || null, p.endDate || null,
         p.progress || 0, p.budget || 0, p.spent || 0, p.tags || [],
         p.needLead ?? false, p.volunteerDeadline || null, ip]
      );
      for (const pm of (p.members || [])) {
        await c.query(
          `INSERT INTO project_members (project_id, member_id, project_role) VALUES ($1,$2,$3)`,
          [p.id, pm.memberId, pm.projectRole || '']
        );
      }
      await appendLog('ADD_PROJECT', ip, `id:${p.id} name:${p.name}`);
      return bumpTimestamp(c);
    });
  });

  // PATCH /api/projects/:id — cập nhật project (chỉ ghi 1 row + project_members của nó)
  app.patch('/api/projects/:id', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const { id } = req.params;
    const p = req.body;
    await withTx(res, async (c) => {
      const r = await c.query(
        `UPDATE projects SET name=$2, description=$3, status=$4, priority=$5, color=$6,
           start_date=$7, end_date=$8, progress=$9, budget=$10, spent=$11, tags=$12,
           need_lead=$13, volunteer_deadline=$14,
           updated_by_ip=$15, updated_at=NOW()
         WHERE id=$1 RETURNING id`,
        [id, p.name, p.description || '', p.status, p.priority, p.color || '#6366f1',
         p.startDate || null, p.endDate || null,
         p.progress || 0, p.budget || 0, p.spent || 0, p.tags || [],
         p.needLead ?? false, p.volunteerDeadline || null, ip]
      );
      if (!r.rowCount) throw new Error(`Project ${id} không tồn tại`);
      // Chỉ replace project_members của project này
      await c.query('DELETE FROM project_members WHERE project_id=$1', [id]);
      for (const pm of (p.members || [])) {
        await c.query(
          `INSERT INTO project_members (project_id, member_id, project_role) VALUES ($1,$2,$3)`,
          [id, pm.memberId, pm.projectRole || '']
        );
      }
      await appendLog('UPDATE_PROJECT', ip, `id:${id}`);
      return bumpTimestamp(c);
    });
  });

  // DELETE /api/projects/:id — xóa project
  app.delete('/api/projects/:id', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    const { id } = req.params;
    await withTx(res, async (c) => {
      await c.query('DELETE FROM project_members WHERE project_id=$1', [id]);
      await c.query('DELETE FROM projects WHERE id=$1', [id]);
      await appendLog('DELETE_PROJECT', ip, `id:${id}`);
      return bumpTimestamp(c);
    });
  });

  // ── LEGACY bulk write — giữ lại cho snapshot restore (localhost only) ────
  app.post('/api/data', requirePermission, async (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    const { _updatedAt, ...dataToSave } = req.body;
    try {
      const newTs = await writeData(dataToSave, ip, _updatedAt ?? 0);
      res.json({ ok: true, _updatedAt: newTs });
    } catch (e) {
      await appendLog('WRITE_ERROR', ip, e.message);
      res.status(500).json({ error: 'Không thể lưu: ' + e.message });
    }
  });

  app.get('/api/me', (req, res) => {
    const ip = getClientIP(req);
    res.json({ ip, canEdit: canEdit(ip) });
  });

  app.get('/api/logs', async (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    const r = await pool.query(
      `SELECT id, event, ip, detail, created_at FROM write_log ORDER BY created_at DESC LIMIT 200`
    );
    res.json(r.rows);
  });

  app.get('/api/snapshots', async (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    const r = await pool.query(
      `SELECT id, event, ip, detail, created_at
       FROM write_log WHERE snapshot IS NOT NULL
       ORDER BY created_at DESC LIMIT 30`
    );
    res.json(r.rows);
  });

  app.post('/api/snapshots/:id/restore', async (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    const r = await pool.query(
      `SELECT snapshot FROM write_log WHERE id=$1 AND snapshot IS NOT NULL`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Snapshot không tồn tại' });
    try {
      const newTs = await writeData(r.rows[0].snapshot, ip, 0);
      await appendLog('MANUAL_RESTORE', ip, `from snapshot id:${req.params.id}`);
      res.json({ ok: true, _updatedAt: newTs });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/config', (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    res.json(loadConfig());
  });
  app.put('/api/config', (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  });

  // ── LEAD VOLUNTEERS ──────────────────────────────────────────────────────

  // GET /api/volunteers — danh sách tất cả đơn (kèm info member + project)
  app.get('/api/volunteers', async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT lv.id, lv.project_id AS "projectId", lv.member_id AS "memberId",
               lv.status, lv.note,
               TO_CHAR(lv.created_at,'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
               m.name AS "memberName", m.avatar AS "memberAvatar", m.color AS "memberColor", m.role AS "memberRole",
               p.name AS "projectName", p.color AS "projectColor"
        FROM lead_volunteers lv
        JOIN members m ON m.id = lv.member_id
        JOIN projects p ON p.id = lv.project_id
        ORDER BY lv.created_at DESC
      `);
      res.json(r.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/volunteers — xung phong làm Lead
  app.post('/api/volunteers', async (req, res) => {
    const ip = getClientIP(req);
    const { projectId, memberId, note = '' } = req.body;
    if (!projectId || !memberId) return res.status(400).json({ error: 'Missing projectId or memberId' });
    try {
      // Kiểm tra project đã có Lead chưa
      const lead = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id=$1 AND project_role='Lead' LIMIT 1`,
        [projectId]
      );
      if (lead.rowCount) return res.status(409).json({ error: 'Dự án này đã có Lead rồi' });
      await pool.query(
        `INSERT INTO lead_volunteers (project_id, member_id, note, status, created_at, updated_at)
         VALUES ($1,$2,$3,'pending',NOW(),NOW())
         ON CONFLICT (project_id, member_id) DO UPDATE SET note=$3, status='pending', updated_at=NOW()`,
        [projectId, memberId, note]
      );
      await appendLog('VOLUNTEER_APPLY', ip, `project:${projectId} member:${memberId}`);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/volunteers/:projectId/:memberId — rút đơn
  app.delete('/api/volunteers/:projectId/:memberId', async (req, res) => {
    const ip = getClientIP(req);
    const { projectId, memberId } = req.params;
    try {
      await pool.query(
        `DELETE FROM lead_volunteers WHERE project_id=$1 AND member_id=$2`,
        [projectId, memberId]
      );
      await appendLog('VOLUNTEER_CANCEL', ip, `project:${projectId} member:${memberId}`);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH /api/volunteers/:id/approve — duyệt (admin only) → set Lead trong project_members
  app.patch('/api/volunteers/:id/approve', async (req, res) => {
    const ip = getClientIP(req);
    // Kiểm tra caller có isAdmin không (via identity → member)
    const identRow = await pool.query(
      `SELECT m.is_admin FROM user_identities ui JOIN members m ON m.id=ui.member_id WHERE ui.ip=$1`,
      [ip]
    );
    if (!identRow.rows[0]?.is_admin) return res.status(403).json({ error: 'Chỉ Admin mới được duyệt' });

    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const vRow = await client.query(
        `UPDATE lead_volunteers SET status='approved', updated_at=NOW()
         WHERE id=$1 AND status='pending' RETURNING project_id, member_id`,
        [id]
      );
      if (!vRow.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Không tìm thấy đơn' }); }
      const { project_id, member_id } = vRow.rows[0];

      // Xóa Lead cũ (nếu có) rồi upsert Lead mới
      await client.query(
        `UPDATE project_members SET project_role='Member'
         WHERE project_id=$1 AND project_role='Lead'`,
        [project_id]
      );
      await client.query(
        `INSERT INTO project_members (project_id, member_id, project_role)
         VALUES ($1,$2,'Lead')
         ON CONFLICT (project_id, member_id) DO UPDATE SET project_role='Lead'`,
        [project_id, member_id]
      );

      // Từ chối các đơn pending khác của cùng project
      await client.query(
        `UPDATE lead_volunteers SET status='rejected', updated_at=NOW()
         WHERE project_id=$1 AND status='pending' AND id<>$2`,
        [project_id, id]
      );

      await bumpTimestamp(client);
      await client.query('COMMIT');
      await appendLog('VOLUNTEER_APPROVE', ip, `volunteer:${id} project:${project_id} member:${member_id}`);
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  // PATCH /api/volunteers/:id/reject — từ chối (admin only)
  app.patch('/api/volunteers/:id/reject', async (req, res) => {
    const ip = getClientIP(req);
    const identRow = await pool.query(
      `SELECT m.is_admin FROM user_identities ui JOIN members m ON m.id=ui.member_id WHERE ui.ip=$1`,
      [ip]
    );
    if (!identRow.rows[0]?.is_admin) return res.status(403).json({ error: 'Chỉ Admin mới được từ chối' });
    try {
      await pool.query(
        `UPDATE lead_volunteers SET status='rejected', updated_at=NOW() WHERE id=$1`,
        [req.params.id]
      );
      await appendLog('VOLUNTEER_REJECT', ip, `volunteer:${req.params.id}`);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/volunteers/:projectId/random-pick — quay số chọn Lead ngẫu nhiên (admin only)
  app.post('/api/volunteers/:projectId/random-pick', async (req, res) => {
    const ip = getClientIP(req);
    const identRow = await pool.query(
      `SELECT m.is_admin FROM user_identities ui JOIN members m ON m.id=ui.member_id WHERE ui.ip=$1`,
      [ip]
    );
    if (!identRow.rows[0]?.is_admin) return res.status(403).json({ error: 'Chỉ Admin mới được dùng tính năng này' });

    const { projectId } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Kiểm tra đã có Lead chưa
      const leadCheck = await client.query(
        `SELECT 1 FROM project_members WHERE project_id=$1 AND project_role='Lead' LIMIT 1`,
        [projectId]
      );
      if (leadCheck.rowCount) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Dự án này đã có Lead rồi' });
      }

      // Chọn ngẫu nhiên 1 đơn pending (server-side — kết quả nhất quán cho mọi người)
      const picked = await client.query(
        `SELECT lv.id, lv.member_id AS "memberId",
                m.name AS "memberName", m.avatar AS "memberAvatar", m.color AS "memberColor"
         FROM lead_volunteers lv
         JOIN members m ON m.id = lv.member_id
         WHERE lv.project_id=$1 AND lv.status='pending'
         ORDER BY RANDOM() LIMIT 1`,
        [projectId]
      );
      if (!picked.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Không có đơn xung phong nào' });
      }

      const { id, memberId, memberName, memberAvatar, memberColor } = picked.rows[0];

      // Approve người được chọn
      await client.query(
        `UPDATE lead_volunteers SET status='approved', updated_at=NOW() WHERE id=$1`,
        [id]
      );
      // Hạ Lead cũ (nếu có)
      await client.query(
        `UPDATE project_members SET project_role='Member' WHERE project_id=$1 AND project_role='Lead'`,
        [projectId]
      );
      // Thăng Lead mới
      await client.query(
        `INSERT INTO project_members (project_id, member_id, project_role)
         VALUES ($1,$2,'Lead')
         ON CONFLICT (project_id, member_id) DO UPDATE SET project_role='Lead'`,
        [projectId, memberId]
      );
      // Từ chối các đơn pending còn lại
      await client.query(
        `UPDATE lead_volunteers SET status='rejected', updated_at=NOW()
         WHERE project_id=$1 AND status='pending' AND id<>$2`,
        [projectId, id]
      );

      await bumpTimestamp(client);
      await client.query('COMMIT');
      await appendLog('VOLUNTEER_RANDOM_PICK', ip, `project:${projectId} winner:${memberId} (${memberName})`);
      res.json({ ok: true, winnerId: memberId, winnerName: memberName, winnerAvatar: memberAvatar, winnerColor: memberColor });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  // ── RAFFLE SESSIONS (dùng PostgreSQL để share state qua cluster workers) ──

  // GET /api/raffle/:projectId — lấy state hiện tại (public, poll 500ms)
  app.get('/api/raffle/:projectId', async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT state, title, candidates, spin_started_at AS "spinStartedAt",
                spin_duration_ms AS "spinDurationMs",
                winner_id AS "winnerId", winner_name AS "winnerName",
                winner_avatar AS "winnerAvatar", winner_color AS "winnerColor"
         FROM raffle_sessions WHERE project_id=$1`,
        [req.params.projectId]
      );
      if (!r.rowCount) return res.json({ state: 'none' });
      const s = r.rows[0];
      // Auto-transition spinning → done dựa trên elapsed time
      if (s.state === 'spinning' && s.spinStartedAt) {
        const elapsed = Date.now() - Number(s.spinStartedAt);
        if (elapsed >= (s.spinDurationMs ?? 5000)) {
          await pool.query(
            `UPDATE raffle_sessions SET state='done', updated_at=NOW() WHERE project_id=$1`,
            [req.params.projectId]
          );
          s.state = 'done';
        }
      }
      res.json(s);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/raffle/room/create — tạo phòng quay số custom (không cần admin)
  app.post('/api/raffle/room/create', async (req, res) => {
    const ip = getClientIP(req);
    const { title = 'Quay số', items = [] } = req.body;
    if (!Array.isArray(items) || items.length < 2) {
      return res.status(400).json({ error: 'Cần ít nhất 2 mục để quay số' });
    }
    const COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#f97316','#6366f1','#14b8a6','#3b82f6','#84cc16','#e879f9'];
    const candidates = items.map((name, i) => ({
      memberId: `item_${i}`,
      memberName: String(name).trim(),
      memberAvatar: String(name).trim().slice(0, 2),
      memberColor: COLORS[i % COLORS.length],
    }));
    const roomId = `room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await pool.query(
        `INSERT INTO raffle_sessions (project_id, state, title, candidates, created_at, updated_at)
         VALUES ($1,'waiting',$2,$3,NOW(),NOW())`,
        [roomId, title.slice(0, 200), JSON.stringify(candidates)]
      );
      await appendLog('RAFFLE_ROOM_CREATE', ip, `room:${roomId} title:${title} items:${items.length}`);
      res.json({ ok: true, roomId });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/raffle/:projectId/create — admin tạo/reset phòng quay số
  app.post('/api/raffle/:projectId/create', async (req, res) => {
    const ip = getClientIP(req);
    const identRow = await pool.query(
      `SELECT m.is_admin FROM user_identities ui JOIN members m ON m.id=ui.member_id WHERE ui.ip=$1`,
      [ip]
    );
    if (!identRow.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin only' });
    const { projectId } = req.params;
    try {
      const vols = await pool.query(
        `SELECT lv.member_id AS "memberId", m.name AS "memberName",
                m.avatar AS "memberAvatar", m.color AS "memberColor"
         FROM lead_volunteers lv JOIN members m ON m.id=lv.member_id
         WHERE lv.project_id=$1 AND lv.status='pending' ORDER BY lv.created_at ASC`,
        [projectId]
      );
      if (!vols.rowCount) return res.status(404).json({ error: 'Không có ứng viên nào' });
      await pool.query(
        `INSERT INTO raffle_sessions (project_id, state, candidates, spin_started_at, winner_id, winner_name, winner_avatar, winner_color, created_at, updated_at)
         VALUES ($1,'waiting',$2,NULL,NULL,NULL,NULL,NULL,NOW(),NOW())
         ON CONFLICT (project_id) DO UPDATE
           SET state='waiting', candidates=$2, spin_started_at=NULL,
               winner_id=NULL, winner_name=NULL, winner_avatar=NULL, winner_color=NULL, updated_at=NOW()`,
        [projectId, JSON.stringify(vols.rows)]
      );
      await appendLog('RAFFLE_CREATE', ip, `project:${projectId} candidates:${vols.rowCount}`);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/raffle/:projectId/spin — admin bắt đầu quay (pick winner, lưu DB)
  app.post('/api/raffle/:projectId/spin', async (req, res) => {
    const ip = getClientIP(req);
    const { projectId } = req.params;
    const isCustomRoom = projectId.startsWith('room_');

    // Custom room: không cần admin, không cần sửa DB dự án
    if (isCustomRoom) {
      const sessionRow = await pool.query(
        `SELECT state, candidates FROM raffle_sessions WHERE project_id=$1`, [projectId]
      );
      if (!sessionRow.rowCount) return res.status(404).json({ error: 'Phòng không tồn tại' });
      if (sessionRow.rows[0].state !== 'waiting') return res.status(409).json({ error: 'Đã quay rồi' });
      const candidates = sessionRow.rows[0].candidates;
      if (!candidates.length) return res.status(404).json({ error: 'Không có mục nào' });
      const w = candidates[Math.floor(Math.random() * candidates.length)];
      try {
        await pool.query(
          `UPDATE raffle_sessions SET state='spinning', spin_started_at=$2,
           winner_id=$3, winner_name=$4, winner_avatar=$5, winner_color=$6, updated_at=NOW()
           WHERE project_id=$1`,
          [projectId, Date.now(), w.memberId, w.memberName, w.memberAvatar, w.memberColor]
        );
        await appendLog('RAFFLE_CUSTOM_SPIN', ip, `room:${projectId} winner:${w.memberName}`);
        return res.json({ ok: true });
      } catch (e) { return res.status(500).json({ error: e.message }); }
    }

    // Project room: yêu cầu admin
    const identRow = await pool.query(
      `SELECT m.is_admin FROM user_identities ui JOIN members m ON m.id=ui.member_id WHERE ui.ip=$1`,
      [ip]
    );
    if (!identRow.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin only' });

    const sessionRow = await pool.query(
      `SELECT state FROM raffle_sessions WHERE project_id=$1`, [projectId]
    );
    if (!sessionRow.rowCount) return res.status(404).json({ error: 'Chưa tạo phòng quay số' });
    if (sessionRow.rows[0].state !== 'waiting') return res.status(409).json({ error: 'Đã quay hoặc đang quay rồi' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const leadCheck = await client.query(
        `SELECT 1 FROM project_members WHERE project_id=$1 AND project_role='Lead' LIMIT 1`,
        [projectId]
      );
      if (leadCheck.rowCount) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Dự án đã có Lead' }); }

      const picked = await client.query(
        `SELECT lv.id, lv.member_id AS "memberId",
                m.name AS "memberName", m.avatar AS "memberAvatar", m.color AS "memberColor"
         FROM lead_volunteers lv JOIN members m ON m.id=lv.member_id
         WHERE lv.project_id=$1 AND lv.status='pending' ORDER BY RANDOM() LIMIT 1`,
        [projectId]
      );
      if (!picked.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Không có ứng viên' }); }

      const { id, memberId, memberName, memberAvatar, memberColor } = picked.rows[0];
      await client.query(`UPDATE lead_volunteers SET status='approved', updated_at=NOW() WHERE id=$1`, [id]);
      await client.query(`UPDATE project_members SET project_role='Member' WHERE project_id=$1 AND project_role='Lead'`, [projectId]);
      await client.query(
        `INSERT INTO project_members (project_id, member_id, project_role) VALUES ($1,$2,'Lead')
         ON CONFLICT (project_id, member_id) DO UPDATE SET project_role='Lead'`,
        [projectId, memberId]
      );
      await client.query(
        `UPDATE lead_volunteers SET status='rejected', updated_at=NOW()
         WHERE project_id=$1 AND status='pending' AND id<>$2`,
        [projectId, id]
      );
      // Lưu trạng thái spinning vào DB (spinStartedAt = now, winner đã xác định)
      await client.query(
        `UPDATE raffle_sessions SET state='spinning', spin_started_at=$2,
                winner_id=$3, winner_name=$4, winner_avatar=$5, winner_color=$6, updated_at=NOW()
         WHERE project_id=$1`,
        [projectId, Date.now(), memberId, memberName, memberAvatar, memberColor]
      );
      await bumpTimestamp(client);
      await client.query('COMMIT');
      await appendLog('RAFFLE_SPIN', ip, `project:${projectId} winner:${memberId} (${memberName})`);
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // PATCH /api/members/:id/admin — toggle isAdmin (localhost only)
  app.patch('/api/members/:id/admin', async (req, res) => {
    const ip = getClientIP(req);
    if (ip !== '127.0.0.1' && ip !== '::1') return res.status(403).json({ error: 'Localhost only' });
    const { isAdmin } = req.body;
    await pool.query(`UPDATE members SET is_admin=$2 WHERE id=$1`, [req.params.id, !!isAdmin]);
    res.json({ ok: true });
  });

  app.get('/api/ping', (_req, res) => res.json({ ok: true, worker: process.pid }));

  // ── IDENTITY — ai đang dùng máy này (theo IP) ────────────────────────────

  // GET /api/identity — trả về member info nếu IP đã đăng ký
  app.get('/api/identity', async (req, res) => {
    const ip = getClientIP(req);
    try {
      const r = await pool.query(
        `SELECT ui.member_id, m.name, m.avatar, m.role, m.color, m.is_admin AS "isAdmin"
         FROM user_identities ui
         JOIN members m ON m.id = ui.member_id
         WHERE ui.ip = $1`,
        [ip]
      );
      if (!r.rows.length) return res.json({ identity: null });
      const row = r.rows[0];
      res.json({
        identity: {
          memberId: row.member_id,
          name: row.name,
          avatar: row.avatar,
          role: row.role,
          color: row.color,
          isAdmin: row.isAdmin,
        },
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/identity { memberId } — đăng ký IP → member
  app.post('/api/identity', async (req, res) => {
    const ip = getClientIP(req);
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'Missing memberId' });
    try {
      await pool.query(
        `INSERT INTO user_identities (ip, member_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (ip) DO UPDATE SET member_id=$2, updated_at=NOW()`,
        [ip, memberId]
      );
      await appendLog('IDENTITY_SET', ip, `memberId:${memberId}`);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/identity — xóa identity (đổi người dùng)
  app.delete('/api/identity', async (req, res) => {
    const ip = getClientIP(req);
    try {
      await pool.query('DELETE FROM user_identities WHERE ip=$1', [ip]);
      await appendLog('IDENTITY_CLEAR', ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Start worker ──────────────────────────────────────────────────────────
  const PORT = process.env.PORT || 4000;
  // SPA fallback — phải đặt SAU tất cả /api routes
  if (fs.existsSync(path.resolve(__dirname, '../dist'))) {
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.resolve(__dirname, '../dist/index.html'));
    });
  }
  app.listen(PORT, '0.0.0.0', async () => {
    try {
      // Auto-create tables nếu chưa có
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_identities (
          ip         VARCHAR(45) PRIMARY KEY,
          member_id  VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_volunteers (
          id         SERIAL       PRIMARY KEY,
          project_id VARCHAR(50)  NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          member_id  VARCHAR(50)  NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
          status     VARCHAR(20)  DEFAULT 'pending',
          note       TEXT         DEFAULT '',
          created_at TIMESTAMPTZ  DEFAULT NOW(),
          updated_at TIMESTAMPTZ  DEFAULT NOW(),
          UNIQUE(project_id, member_id)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS raffle_sessions (
          project_id       VARCHAR(50) PRIMARY KEY,
          state            VARCHAR(20) DEFAULT 'waiting',
          candidates       JSONB       NOT NULL DEFAULT '[]',
          spin_started_at  BIGINT,
          spin_duration_ms INTEGER     DEFAULT 5000,
          winner_id        VARCHAR(50),
          winner_name      TEXT,
          winner_avatar    TEXT,
          winner_color     TEXT,
          created_at       TIMESTAMPTZ DEFAULT NOW(),
          updated_at       TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE raffle_sessions ADD COLUMN IF NOT EXISTS title VARCHAR(200)`);
      // Tự động set isAdmin cho "Trương Lê Khánh"
      await pool.query(
        `UPDATE members SET is_admin=TRUE WHERE name ILIKE '%Trương Lê Khánh%' OR name ILIKE '%Truong Le Khanh%'`
      );
      const r = await pool.query('SELECT COUNT(*) FROM members');
      console.log(`✅  Worker ${process.pid} listening :${PORT} — ${r.rows[0].count} members`);
      await appendLog('WORKER_START', 'system', `pid:${process.pid}`);
    } catch (e) {
      console.error(`❌  Worker ${process.pid} DB error:`, e.message);
      process.exit(1);
    }
  });
}
