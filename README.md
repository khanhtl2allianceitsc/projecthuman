# ProjectHuman — Team & Project Management Dashboard

A real-time multi-user collaboration dashboard for Vietnamese-speaking teams. Built with React 19, Node.js/Express, and PostgreSQL. Perfect for managing team members, projects, and workload assignments with live audit trails.

## 🎯 Features

- **Real-time Collaboration**: Multi-user editing with optimistic updates and stale-write detection
- **Rich Visualizations**: Gantt charts, workload radar, member heatmaps, project status dashboards
- **Volunteer Lead Workflow**: Apply to lead projects, admin approval system with competitive management
- **Identity System**: IP→member session mapping with login/logout support
- **Personnel & Man Month**: Salary tier tracking (Master/Senior/Mid/Junior+/Junior/Fresher/Intern/TBD)
- **IP-based Permissions**: Whitelist-based access control + audit logging of every change
- **Full Audit Trail**: Every write logged with IP, timestamp, and JSONB snapshot
- **Auto-Snapshots**: Last 30 database snapshots accessible for recovery
- **CRUD Admin Panel**: Floating admin interface for member & project management
- **Dark/Light Theme**: Built-in theme switcher
- **Vietnamese UI**: User messages in Vietnamese, technical terms in English

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### First-time Setup

```bash
# Install dependencies
npm install

# Initialize database (creates schema + seeds sample data)
node server/migrate.js

# Start dev server (runs API on :4000 + Vite on :5173)
npm run dev
```

Then open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build        # Compile TS + create dist/
npm run server       # Run API server only
```

## 📊 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | 19 + 5.9 + 8 |
| **Styling** | TailwindCSS + Lucide icons | 3.4 + 0.577 |
| **Charts** | Recharts | 3.8 |
| **State** | React Context API | - |
| **Backend** | Express.js | 5.2 |
| **Database** | PostgreSQL (raw pg queries) | 12+ |
| **Dev Runner** | concurrently | 9.2 |

## 📁 Project Structure

```
ProjectHuman/
├── server/
│   ├── index.js (882 LOC)      → Express API, 29 endpoints, Node.js Cluster (8 workers)
│   ├── db.js (16 LOC)          → PostgreSQL pool config (5 per worker × 8 = 40 total)
│   ├── migrate.js (134 LOC)    → DB schema + seeding
│   ├── schema.sql (60 LOC)     → SQL DDL
│   └── config.json             → IP whitelist
├── src/
│   ├── App.tsx                 → Main dashboard layout
│   ├── pages/
│   │   └── PersonnelPage.tsx   → Man Month salary tier tracking
│   ├── components/
│   │   ├── GanttChart.tsx      → Project timeline
│   │   ├── LeadStats.tsx       → Lead workload metrics
│   │   ├── ProjectCards.tsx    → Project detail cards + volunteer UI
│   │   ├── MemberProfiles.tsx  → Team member cards
│   │   ├── MemberProjectMatrix.tsx → Heatmap
│   │   ├── ProjectStatusPie.tsx → Status breakdown
│   │   ├── ProjectsNeedingLead.tsx → Volunteer Lead Workflow
│   │   ├── WhoAreYouModal.tsx  → Identity system
│   │   └── admin/
│   │       ├── AdminPanel.tsx  → Floating gear button
│   │       ├── MembersTab.tsx  → CRUD members
│   │       └── ProjectsTab.tsx → CRUD projects
│   ├── context/
│   │   ├── DataContext.tsx     → Global state + API calls
│   │   ├── IdentityContext.tsx → Session management
│   │   ├── VolunteerContext.tsx → Lead volunteer workflow
│   │   └── ThemeContext.tsx    → Dark/light theme
│   ├── types/index.ts          → TypeScript interfaces
│   └── utils/dateUtils.ts      → Date formatting
├── docs/                       → Documentation (this folder)
└── public/                     → Static assets
```

## 🔌 API Reference

### Public Endpoints
- `GET /api/data` → Read all members & projects + `_updatedAt` version
- `GET /api/me` → Client's IP + edit permission status
- `GET /api/ping` → Health check

### Identity System
- `GET /api/identity` → Fetch IP→member mapping
- `POST /api/identity` → Register IP→member (upsert, login)
- `DELETE /api/identity` → Unregister (logout)

### Member CRUD (IP-whitelisted)
- `POST /api/members` → Add member
- `PATCH /api/members/:id` → Update member
- `DELETE /api/members/:id` → Delete member + cascade
- `PATCH /api/members/:id/admin` → Toggle isAdmin (localhost only)

### Project CRUD (IP-whitelisted)
- `POST /api/projects` → Add project + members
- `PATCH /api/projects/:id` → Update + replace members
- `DELETE /api/projects/:id` → Delete + cascade

### Volunteer Lead Workflow
- `GET /api/volunteers` → List lead applications
- `POST /api/volunteers` → Submit/update application
- `DELETE /api/volunteers/:projectId/:memberId` → Withdraw
- `PATCH /api/volunteers/:id/approve` → Admin approve (rejects competitors)
- `PATCH /api/volunteers/:id/reject` → Admin reject

### Admin (Localhost only)
- `GET /api/logs` → Last 200 audit entries
- `GET /api/snapshots` → Last 30 snapshots
- `POST /api/snapshots/:id/restore` → Restore from snapshot
- `GET/PUT /api/config` → IP whitelist management

## 🔐 Security

- **IP Whitelist**: Configure allowed IPs in `server/config.json`
- **Stale Detection**: Client sends `_updatedAt` timestamp; server rejects if outdated (409)
- **Audit Trail**: Every write logged with IP, timestamp, and full data snapshot
- **No ORM**: Raw parameterized SQL queries to PostgreSQL

## 📋 Configuration

### `server/config.json`

```json
{
  "allowedIPs": ["*"]
}
```

Set to `["192.168.1.100", "10.0.0.5"]` to restrict write access. Use `["*"]` for open access (dev only).

### Database Connection

Edit `server/index.js` (lines 12-19):
```js
const pool = new pg.Pool({
  host: 'localhost',        // PostgreSQL host
  port: 5432,
  user: 'postgres',         // DB user
  password: 'postgres',     // DB password
  database: 'projecthuman', // DB name
  max: 5,                   // Per-worker pool size (8 workers × 5 = 40 total connections)
});
```

## 📚 Documentation

See `docs/` folder for:
- **project-overview-pdr.md** — Product vision & requirements
- **codebase-summary.md** — Component catalog & data flow
- **code-standards.md** — Conventions & patterns
- **system-architecture.md** — Database schema, security model
- **deployment-guide.md** — Setup & production deployment
- **project-roadmap.md** — Status, priorities, technical debt

## 🛠️ Development

### Available Scripts

```bash
npm run dev                # Start API (:4000) + Vite (:5173)
npm run server             # Start API only
npm run build              # TypeScript check + Vite build
npm run lint               # Run ESLint
npm run preview            # Preview production build
```

### Hot Reload

Both the API server and Vite dev server support hot reload. Changes to `src/**` are reflected instantly in the browser.

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED :4000` | API not running. Check `npm run dev` |
| `PostgreSQL connection error` | Verify `server/index.js` config matches your DB |
| `409 Conflict on edit` | Data was modified by another user. Refresh & retry |
| `IP not in whitelist` | Add your IP to `server/config.json` |

## 📝 License

Proprietary — ProjectHuman © 2026
