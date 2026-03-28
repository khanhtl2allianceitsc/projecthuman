# ProjectHuman — Deployment & Setup Guide

## 🚀 Quick Start (Development)

### Prerequisites
- **Node.js** 18+ (check: `node --version`)
- **npm** 9+ (check: `npm --version`)
- **PostgreSQL** 12+ (check: `psql --version`)

### First-time Setup (5 minutes)

```bash
# 1. Navigate to project directory
cd D:\Clients\ProjectHuman  # or your clone location

# 2. Install dependencies
npm install

# 3. Initialize database (creates schema + seeds sample data)
node server/migrate.js

# 4. Start development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

You should see:
- Dashboard with sample projects & members
- Gantt chart, workload charts, etc.
- Floating admin gear icon (bottom right)
- Identity badge showing your IP→member mapping

---

## 🗄️ PostgreSQL Setup

### Local Installation

#### Windows
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Verify:
psql --version
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database

```bash
# Connect to PostgreSQL (default)
psql -U postgres

# In psql:
CREATE DATABASE projecthuman;
\q
```

### Verify Connection

```bash
psql -U postgres -d projecthuman -c "SELECT 1"
```

Expected: output `1` (success)

### Customize Connection

Edit `server/index.js` lines 12–19:

```js
const pool = new pg.Pool({
  host: 'localhost',        // Change if PostgreSQL on different host
  port: 5432,               // Default port
  user: 'postgres',         // Default user
  password: 'postgres',     // Change to your password
  database: 'projecthuman',
  max: 5,                   // Per-worker pool size (8 workers × 5 = 40 total connections)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

---

## 🛠️ Environment Configuration

### config.json (IP Whitelist)

Located at `server/config.json`:

```json
{
  "allowedIPs": ["*"]
}
```

**Options:**

1. **Allow all IPs** (development):
   ```json
   { "allowedIPs": ["*"] }
   ```

2. **Restrict to specific IPs** (production):
   ```json
   {
     "allowedIPs": [
       "192.168.1.100",
       "203.0.113.45",
       "10.0.0.0/8"
     ]
   }
   ```
   Note: CIDR ranges not supported; use exact IPs

3. **Enable/disable dynamically**:
   ```bash
   # View current config:
   curl http://localhost:4000/api/config

   # Update config (localhost only):
   curl -X PUT http://localhost:4000/api/config \
     -H "Content-Type: application/json" \
     -d '{"allowedIPs": ["192.168.1.100"]}'
   ```

---

## 📦 Production Build

### Build for Deployment

```bash
# Compile TypeScript + bundle with Vite
npm run build

# Output: dist/ folder (optimized static files)
```

### Start Production Server

```bash
# Run API server only (no Vite dev server)
npm run server

# Or with environment variables:
NODE_ENV=production npm run server
```

**API runs on**: http://localhost:4000

**Serve static files from**: `dist/` folder (requires separate web server, see below)

---

## 🌐 Web Server Configuration (Production)

### Option A: Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/projecthuman

upstream projecthuman_api {
  server 127.0.0.1:4000;
}

server {
  listen 80;
  server_name projecthuman.example.com;

  # Serve static files from dist/
  location / {
    alias /home/user/ProjectHuman/dist/;
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests to Express server
  location /api/ {
    proxy_pass http://projecthuman_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # SSL (recommended)
  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/projecthuman.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/projecthuman.example.com/privkey.pem;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/projecthuman /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option B: Apache with mod_proxy

```apache
# /etc/apache2/sites-available/projecthuman.conf

<VirtualHost *:80>
  ServerName projecthuman.example.com

  # Serve static files
  DocumentRoot /home/user/ProjectHuman/dist

  # Proxy API to Express
  ProxyPass /api/ http://127.0.0.1:4000/api/
  ProxyPassReverse /api/ http://127.0.0.1:4000/api/

  # SPA routing: all requests → index.html
  <Directory /home/user/ProjectHuman/dist>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
  </Directory>
</VirtualHost>
```

Enable:
```bash
sudo a2enmod proxy proxy_http rewrite
sudo a2ensite projecthuman
sudo apache2ctl configtest
sudo systemctl restart apache2
```

### Option C: Node.js Server (serve-static)

For smaller deployments, serve everything from Node:

```bash
npm install serve-static cors
```

Then in `server/index.js` add (after other routes):

```js
import serveStatic from 'serve-static';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));

// SPA fallback: all unmatched routes → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
```

---

## 🗄️ Database Initialization

### One-time Setup

```bash
node server/migrate.js
```

This runs `server/schema.sql` and seeds sample data:
- **5 sample members** (John, Alice, Bob, etc.)
- **3 sample projects** (Backend API, Frontend, Infra)
- **Assignments** between members and projects

### Manual Schema Reset (Destructive!)

```bash
# Connect to database
psql -U postgres -d projecthuman

# Drop all tables
DROP TABLE IF EXISTS write_log;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS meta;

# Exit
\q

# Re-run migration
node server/migrate.js
```

---

## 📊 Database Backups & Recovery

### Backup via pg_dump

```bash
# Full database backup
pg_dump -U postgres -d projecthuman > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (smaller file)
pg_dump -U postgres -d projecthuman | gzip > backup.sql.gz

# Backup to cloud
pg_dump -U postgres -d projecthuman | aws s3 cp - s3://my-bucket/backup.sql
```

### Restore from Backup

```bash
# Restore from SQL file
psql -U postgres -d projecthuman < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -U postgres -d projecthuman
```

### Automated Daily Backups (Cron)

```bash
# Add to crontab (runs daily at 2 AM):
crontab -e

# Add line:
0 2 * * * pg_dump -U postgres -d projecthuman | gzip > /backups/projecthuman_$(date +\%Y\%m\%d).sql.gz

# Save and exit (Ctrl+X → Y → Enter)
```

---

## 🔍 Snapshot Recovery

### View Available Snapshots

```bash
# From localhost:
curl http://localhost:4000/api/snapshots

# Returns: last 30 snapshots with timestamps
```

### Restore from Snapshot

```bash
# Restore snapshot ID 42 (localhost only):
curl -X POST http://localhost:4000/api/snapshots/42/restore

# Result: database returns to state before that write
```

---

## 🚦 Health Check & Monitoring

### Health Endpoint

```bash
curl http://localhost:4000/api/ping
# Output: { "ok": true }
```

### View Audit Logs

```bash
# Last 200 log entries (localhost only):
curl http://localhost:4000/api/logs

# Output: array of events with IP, timestamp, event type
```

### Database Connection Status

```bash
# Check if database is accessible:
psql -U postgres -d projecthuman -c "SELECT COUNT(*) FROM members"

# Expected: single number (member count)
```

### Server Startup Logs

```bash
# When running: npm run dev or npm run server

# Look for:
✅  API server: http://0.0.0.0:4000 (Node.js Cluster, 8 workers)
🐘  PostgreSQL: projecthuman — 5 members, 3 projects
🔑  Whitelist: ["*"]
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running. `sudo systemctl start postgresql` |
| `Error: database "projecthuman" does not exist` | Run `node server/migrate.js` to create DB |
| `Error: role "postgres" does not exist` | Check PostgreSQL user, adjust in `server/index.js` |
| `CORS errors in browser console` | CORS enabled on line 23 of `server/index.js` (edit if needed) |
| `GET /api/data returns 200 but no data` | Check database connection, run migration |
| `POST /api/data returns 403 "IP not in whitelist"` | Add your IP to `server/config.json` or set to `["*"]` |
| `409 Conflict on edit` | Another user edited; refresh & retry. This is expected behavior. |
| `Vite dev server not starting` | Check if port 5173 is in use: `lsof -i :5173` (macOS/Linux) |
| `API server not starting` | Check if port 4000 is in use: `lsof -i :4000` (macOS/Linux) |

---

## 📈 Scaling for Production

### Single-Server Deployment
- Current setup suitable for <1000 users
- Node.js Cluster: 8 workers (auto-scaled to CPU count), auto-restart on crash
- Per-worker pool: 5 DB connections (40 total connections)
- Estimated capacity: 500–1000 concurrent edits/minute

### Multi-server Deployment
1. **Load balance API servers** (Nginx, HAProxy)
   ```
   Client → Load Balancer → [API1, API2, API3] → Shared PostgreSQL
   ```

2. **Use PostgreSQL replicas** for read scaling
   - Master for writes (POST /api/data)
   - Replicas for reads (GET /api/data)

3. **Add caching layer** (Redis)
   - Cache GET /api/data (1–5 min TTL)
   - Invalidate on POST /api/data

4. **CDN for static files**
   - Serve dist/ from CloudFront, Cloudflare, etc.
   - Reduces load on API server

### High Availability
```
PostgreSQL Primary ←→ PostgreSQL Standby (streaming replication)
        ↑
    API Servers (load balanced)
        ↑
    Nginx/HAProxy
        ↑
    Client Browsers
```

---

## 🔐 Production Security Checklist

- [ ] PostgreSQL: Change default password (`postgres`)
- [ ] API: Set `config.json` whitelist to specific IPs (not `["*"]`)
- [ ] API: Run behind reverse proxy (Nginx/Apache) with SSL/TLS
- [ ] API: Enable CORS only for trusted origins (edit line 23 of `server/index.js`)
- [ ] Backups: Automated daily backups to encrypted storage
- [ ] Monitoring: Set up alerts for errors, slow queries, downtime
- [ ] Logging: Ship logs to centralized service (ELK, Datadog, etc.)
- [ ] Updates: Keep Node.js, npm packages, PostgreSQL patched

---

## 📝 Example: AWS EC2 Deployment

```bash
# 1. Create EC2 instance (Ubuntu 22.04, t3.small)
# 2. SSH in:
ssh -i key.pem ubuntu@instance.ip

# 3. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx

# 4. Clone repo
git clone https://github.com/yourorg/ProjectHuman.git
cd ProjectHuman

# 5. Install npm packages
npm ci

# 6. Setup database
sudo systemctl start postgresql
sudo -u postgres createdb projecthuman
node server/migrate.js

# 7. Build for production
npm run build

# 8. Start API server (with PM2 for process management)
npm install -g pm2
pm2 start npm --name "projecthuman" -- run server
pm2 save
pm2 startup

# 9. Configure Nginx (use config above)
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/projecthuman
sudo systemctl reload nginx

# 10. Enable SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d projecthuman.example.com
```

---

## 🔗 Related Documents
- See `system-architecture.md` for API/DB design
- See `project-roadmap.md` for future deployment needs
