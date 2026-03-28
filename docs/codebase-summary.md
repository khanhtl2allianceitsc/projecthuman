# ProjectHuman — Codebase Summary

## 📊 Codebase Overview

| Metric | Value |
|--------|-------|
| **Frontend LOC** | ~5,240 (TS + TSX) |
| **Backend LOC** | ~882 (JS) |
| **Tests LOC** | ~1,010 (Playwright E2E) |
| **Total LOC** | ~7,192 |
| **React Components** | 24 (7 charts + 5 core UI + 4 admin + 1 page + 7 utilities) |
| **API Routes** | 29 endpoints (CRUD + identity + volunteer + admin) |
| **Database Tables** | 7 (members, projects, project_members, meta, write_log, user_identities, lead_volunteers) |
| **Build Tool** | Vite 8 |
| **Type Safety** | TypeScript 5.9 |
| **Server** | Node.js Cluster (8 workers, auto-scaled to CPU count) |
| **DB Connections** | 40 total (5 per worker × 8 workers) |

---

## 🗂️ Directory Structure & File Sizes

### Server Layer (`server/`)

```
server/
├── index.js (882 LOC)
│   └── Express application + Node.js Cluster (8 workers)
│       ├── GET /api/data → readData()
│       ├── GET /api/me → client IP + permission
│       ├── POST /api/members → add member
│       ├── PATCH /api/members/:id → update member
│       ├── DELETE /api/members/:id → delete member
│       ├── PATCH /api/members/:id/admin → toggle admin (localhost)
│       ├── POST /api/projects → add project
│       ├── PATCH /api/projects/:id → update project
│       ├── DELETE /api/projects/:id → delete project
│       ├── GET /api/identity → fetch IP→member mapping
│       ├── POST /api/identity → register IP→member (upsert)
│       ├── DELETE /api/identity → unregister (logout)
│       ├── GET /api/volunteers → list applications
│       ├── POST /api/volunteers → submit application
│       ├── DELETE /api/volunteers/:projectId/:memberId → withdraw
│       ├── PATCH /api/volunteers/:id/approve → admin approve
│       ├── PATCH /api/volunteers/:id/reject → admin reject
│       ├── GET /api/logs → audit trail (localhost)
│       ├── GET /api/snapshots → list snapshots (localhost)
│       ├── POST /api/snapshots/:id/restore → restore (localhost)
│       ├── GET /api/config → read whitelist (localhost)
│       ├── PUT /api/config → update whitelist (localhost)
│       ├── GET /api/ping → health check
│       └── Server startup + cluster management
│
├── db.js (16 LOC)
│   └── PostgreSQL pool config (5 connections per worker)
│
├── migrate.js (134 LOC)
│   └── One-time setup script
│       ├── Create tables (schema.sql)
│       ├── Seed sample data
│       └── Initialize meta & write_log
│
├── schema.sql (60 LOC)
│   └── SQL DDL for all 7 tables
│       ├── CREATE TABLE members
│       ├── CREATE TABLE projects
│       ├── CREATE TABLE project_members (join)
│       ├── CREATE TABLE meta (version)
│       ├── CREATE TABLE write_log (audit)
│       ├── CREATE TABLE user_identities (IP→member)
│       ├── CREATE TABLE lead_volunteers (applications)
│       └── CREATE INDEX on write_log.created_at
│
└── config.json (dynamic)
    └── IP whitelist configuration
        └── { "allowedIPs": ["*"] | ["192.168.1.1", ...] }
```

### Frontend Layer (`src/`)

#### App Entry Point
```
src/
├── main.tsx (11 LOC)
│   └── React 19 root + theme provider + data provider
│
├── pages/
│   └── PersonnelPage.tsx (1,120 LOC)
│       └── Man Month salary tier tracking
│           ├── 8 salary tiers (Master, Senior, Mid, Junior+, Junior, Fresher, Intern, TBD)
│           ├── Inline editing of man month values
│           ├── Ranked member list by salary tier
│           └── Real-time updates
│
└── App.tsx (197 LOC)
    └── Main dashboard layout + routing
        ├── Header component (KPIs, audit badge, identity badge)
        ├── Admin panel (floating gear icon)
        ├── Volunteer Lead section
        └── 7 chart components (grid layout)
```

#### Components (`src/components/`)

**Chart Components** (visualizations)
```
├── GanttChart.tsx (201 LOC)
│   └── Project timeline with start/end dates + progress bars
│       ├── X-axis: project names
│       ├── Y-axis: timeline (months/weeks)
│       └── Hover: duration, % complete
│
├── LeadStats.tsx (307 LOC)
│   └── Workload breakdown by project lead
│       ├── Bar chart: projects per lead
│       ├── Stacked bar: member count per lead
│       └── Tooltip: lead details
│
├── ProjectStatusPie.tsx (91 LOC)
│   └── Status distribution (active/completed/paused/planning)
│       ├── Pie slices: one per status
│       └── Legend: count + percentage
│
├── ProjectMemberBarChart.tsx (77 LOC)
│   └── Members assigned per project
│       ├── Bar chart: project → member count
│       └── Tooltip: member names
│
├── MemberProjectMatrix.tsx (155 LOC)
│   └── Heatmap: member × project assignment density
│       ├── Rows: members
│       ├── Cols: projects
│       ├── Color intensity: # of projects assigned
│       └── Click: filter view
│
├── MemberWorkloadRadar.tsx (92 LOC)
│   └── Radar chart: member across multiple metrics
│       ├── Axes: projects, budget, priority influence
│       └── Dropdown: select member
│
└── MemberProjectCountChart.tsx (100 LOC)
    └── Bar chart: # of projects per member
        ├── Bar chart: member → project count
        └── Sorted: descending workload
```

**Detail Cards**
```
├── ProjectCards.tsx (268 LOC)
│   └── Grid of project detail cards
│       ├── Card: name, status badge, progress %, dates
│       ├── Team roster: assigned members
│       ├── Volunteer lead section: pending applications + approval UI
│       ├── Budget: $ spent vs. budget
│       └── Tags: custom tags
│
├── ProjectsNeedingLead.tsx (285 LOC)
│   └── Volunteer Lead Workflow display
│       ├── Projects requiring lead
│       ├── Pending applications list
│       ├── Member applications + notes
│       ├── Approve/reject UI (admin only)
│       └── Real-time polling (10s)
│
├── MemberProfiles.tsx (141 LOC)
│   └── Grid of member profile cards
│       ├── Card: avatar, name, role, color
│       ├── Projects assigned: clickable links
│       └── Creation metadata: who created, when
│
├── Header.tsx (224 LOC)
│   └── Top navigation bar
│       ├── Project count KPI
│       ├── Member count KPI
│       ├── Total budget KPI
│       ├── Spent budget KPI
│       ├── Theme toggle (dark/light)
│       ├── Identity badge (current user IP→member)
│       ├── Need-lead alert (projects without leads)
│       └── Audit badge (last write time + IP)
│
├── WhoAreYouModal.tsx (322 LOC)
│   └── Identity/session modal (portal)
│       ├── Select existing member or create
│       ├── Login/logout
│       └── Persistent session tracking
│
└── AuditBadge.tsx (72 LOC)
    └── Compact display of last write
        ├── Timestamp (relative: "2 min ago")
        └── IP of last editor
```

**Admin Controls**
```
admin/
├── AdminPanel.tsx (116 LOC)
│   └── Floating gear icon + modal
│       ├── Toggle visibility
│       ├── Tabs: Members, Projects
│       └── Layout: side-by-side forms + list
│
├── MembersTab.tsx (267 LOC)
│   └── Member CRUD interface
│       ├── Form: name, role, avatar, color, man month
│       ├── Auto-ID generation (nanoid)
│       ├── Create / Update / Delete buttons
│       ├── List: all members
│       └── Optimistic updates
│
├── ProjectsTab.tsx (563 LOC)
│   └── Project CRUD interface
│       ├── Form: name, description, status, priority, dates
│       ├── Budget fields: budget, spent
│       ├── Volunteer lead management: view applications, approve/reject
│       ├── Members multi-select: add/remove team members
│       ├── Set member project roles (Lead, PM, Dev, etc.)
│       ├── Create / Update / Delete buttons
│       ├── List: all projects
│       └── Optimistic updates + stale conflict handling
│
└── FormModal.tsx (55 LOC)
    └── Generic modal wrapper
```

**Utilities**
```
├── AuditBadge.tsx (72 LOC)
│   └── Compact display of last write
│       ├── Timestamp (relative: "2 min ago")
│       └── IP of last editor
```

#### Context API (`src/context/`)

```
├── DataContext.tsx (172 LOC)
│   └── Global state management + API interface
│       ├── State: data (members + projects), loading, canEdit, myIP
│       ├── Refs: dataRef (current state), updatedAtRef (version)
│       ├── useEffect: initial fetch (parallel)
│       ├── persist() callback: optimistic update → POST
│       ├── Conflict handling: 409 → fetch fresh data → alert user
│       ├── Actions:
│       │   ├── addMember / updateMember / deleteMember
│       │   ├── addProject / updateProject / deleteProject
│       │   └── exportJSON (download data.json)
│       └── Parallelization: fetch + fetchMe in Promise.all
│
├── IdentityContext.tsx (~100 LOC)
│   └── Session management + IP→member mapping
│       ├── State: currentUser, identityLoading
│       ├── Actions: setIdentity, clearIdentity
│       └── Polls GET /api/identity on mount
│
├── VolunteerContext.tsx (~120 LOC)
│   └── Volunteer Lead Workflow state
│       ├── State: volunteers[], loading
│       ├── Actions: refresh, apply, cancel, approve, reject, getMyVolunteer
│       ├── getPendingCount()
│       └── Polls every 10s
│
└── ThemeContext.tsx (~40 LOC)
    └── Light/dark theme state
        ├── usesSystemPreference (prefers-color-scheme)
        └── Persists to localStorage
```

#### Types (`src/types/`)

```
index.ts (85 LOC)
├── ProjectRoleType union
│   └── 'Lead' | 'PM' | 'Frontend Dev' | 'Backend Dev' | 'Designer' | 'QA' | 'DevOps' | 'Analyst' | 'Full Stack' | 'AI Developer'
│
├── Member interface
│   ├── id, name, role, color, avatar
│   ├── manMonth? (optional, salary tier tracking)
│   ├── isAdmin? (optional, admin flag)
│   └── Audit: createdByIp, createdAt, updatedByIp, updatedAt
│
├── Project interface
│   ├── id, name, description, status, priority, color
│   ├── Dates: startDate, endDate
│   ├── Financials: budget, spent, progress
│   ├── Team: members array (ProjectMember objects)
│   ├── Lead: needLead?, volunteerDeadline?
│   ├── tags[]
│   └── Audit: createdByIp, createdAt, updatedByIp, updatedAt
│
├── ProjectMember interface
│   ├── memberId: string (FK)
│   └── projectRole: ProjectRoleType
│
├── LeadVolunteer interface
│   ├── id, projectId, memberId
│   ├── status: 'pending' | 'approved' | 'rejected'
│   ├── note?: string
│   └── Created/updated timestamps
│
├── DashboardData interface
│   ├── members: Member[]
│   ├── projects: Project[]
│   └── _updatedAt?: number
│
└── Helper functions
    ├── getProjectLead(project) → ProjectMember | undefined
    └── getMemberIds(project) → string[]
```

#### Utils (`src/utils/`)

```
dateUtils.ts (~50 LOC)
├── formatDate(date, format) → string
├── formatRelativeTime(date) → "2 days ago"
├── getDateRange(start, end) → days between
├── getCurrentDate() → YYYY-MM-DD
└── validateDateRange(start, end) → boolean
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (React)                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [DataContext: data, canEdit, myIP]                            │
│         ↑               ↑                                       │
│         │ on mount      │ on user action                       │
│         │               ↓                                       │
│    fetchData()    persist(newData)                             │
│    fetchMe()      ↓                                             │
│         │         setData() [OPTIMISTIC]                       │
│         │         ↓                                             │
│         │     pushData(data, _updatedAt)                       │
│         │         ↓                                             │
│         └─────────┬──────────────────────────────────────────┐ │
│                   │ HTTP                                    │ │
└───────────────────┼────────────────────────────────────────┼─┘
                    │                                        │
┌───────────────────┼────────────────────────────────────────┼─┐
│ SERVER (Express)  │                                        │ │
├───────────────────┼────────────────────────────────────────┼─┤
│                   ↓                                        │ │
│   GET /api/data                                           │ │
│   GET /api/me                                             │ │
│         │                                                  │ │
│         ↓                                                  │ │
│   readData(pool) ──→ [Query members, projects, ...]      │ │
│         │                                                  │ │
│         └──────────────────────────────────────────┐      │ │
│                                                    │      │ │
│                           POST /api/data ←─────────┘      │ │
│                           (with _updatedAt)              │ │
│                                  ↓                        │ │
│                           Stale check:                    │ │
│                           clientTs vs. serverTs           │ │
│                                  ↓                        │ │
│                           ┌──────────────┐                │ │
│                           │ Stale?       │                │ │
│                           ├──────┬───────┤                │ │
│                           │ YES  │ NO    │                │ │
│                           ↓      ↓       │                │ │
│                    409 ←─┘      │       │                │ │
│                    (send       │       │                │ │
│                     current)   ↓       │                │ │
│                                │      ↓                │ │
│                         enqueue(writeData)            │ │
│                                │      ↓                │ │
│                                │   BEGIN txn          │ │
│                                │   ├─ upsert members  │ │
│                                │   ├─ upsert projects │ │
│                                │   ├─ replace proj_m  │ │
│                                │   ├─ UPDATE meta     │ │
│                                │   └─ COMMIT          │ │
│                                │      ↓               │ │
│                                │   appendLog()        │ │
│                                │      ↓               │ │
│                                └──────┘→ 200 OK ─┘    │
│                                      (_updatedAt)     │
│                                                    │   │
└────────────────────────────────────────────────────┼───┘
                                                     │
                        Browser receives response ───┘
                                ↓
                        if 409: setData(current) + alert
                        if 200: updatedAtRef = new ts
```

---

## 🗄️ Database Layer

### Schema Overview

```sql
members (
  id VARCHAR(50) PK,
  name VARCHAR(255),
  role VARCHAR(100),
  color VARCHAR(20),    -- hex color for avatar
  avatar VARCHAR(20),   -- emoji
  man_month INT,        -- man month value (salary tier)
  is_admin BOOLEAN,     -- admin flag
  created_by_ip VARCHAR(60),
  created_at TIMESTAMPTZ,
  updated_by_ip VARCHAR(60),
  updated_at TIMESTAMPTZ
)

projects (
  id VARCHAR(50) PK,
  name VARCHAR(255),
  description TEXT,
  status VARCHAR(50),       -- 'active', 'completed', 'paused', 'planning'
  priority VARCHAR(50),     -- 'low', 'medium', 'high', 'critical'
  color VARCHAR(20),        -- hex
  start_date DATE,
  end_date DATE,
  progress INT,             -- 0–100
  budget BIGINT,            -- currency in cents
  spent BIGINT,
  tags TEXT[],              -- PostgreSQL array type
  need_lead BOOLEAN,        -- requires lead assignment
  volunteer_deadline DATE,  -- deadline for lead applications
  created_by_ip VARCHAR(60),
  created_at TIMESTAMPTZ,
  updated_by_ip VARCHAR(60),
  updated_at TIMESTAMPTZ
)

project_members (
  project_id VARCHAR(50) FK → projects,
  member_id VARCHAR(50) FK → members,
  project_role VARCHAR(100),  -- 'Lead', 'PM', 'Dev', etc.
  PRIMARY KEY (project_id, member_id)
  FK with CASCADE DELETE
)

user_identities (
  ip VARCHAR(60) PK,        -- IP address (session key)
  member_id VARCHAR(50) FK,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

lead_volunteers (
  id UUID PK,
  project_id VARCHAR(50) FK,
  member_id VARCHAR(50) FK,
  status VARCHAR(50),       -- 'pending', 'approved', 'rejected'
  note TEXT,                -- application note
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(project_id, member_id)
)

meta (
  key VARCHAR(50) PK,
  value TEXT,               -- stores _updatedAt as epoch seconds
  updated_at TIMESTAMPTZ
)

write_log (
  id SERIAL PK,
  event VARCHAR(50),        -- 'READ', 'WRITE_OK', 'STALE_REJECTED', etc.
  ip VARCHAR(60),           -- source IP
  detail TEXT,              -- human-readable description
  snapshot JSONB,           -- full data before write
  created_at TIMESTAMPTZ,
  INDEX on created_at DESC
)
```

### Query Patterns

**Read all data** (GET /api/data):
```sql
SELECT ... FROM members ORDER BY created_at;
SELECT ... FROM projects ORDER BY created_at;
SELECT ... FROM project_members;
SELECT value FROM meta WHERE key = 'updated_at';
```

**Write cycle** (POST /api/data):
```sql
BEGIN;
  UPSERT members (insert if new, update if exists)
  UPSERT projects (insert if new, update if exists)
  DELETE FROM project_members WHERE project_id = $1
  INSERT INTO project_members (rows)
  UPDATE meta SET value = $1 WHERE key = 'updated_at'
COMMIT;
```

---

## 🔧 Component Dependencies

```
App
├── Header (displays KPIs, audit badge, identity badge, need-lead alert)
├── AdminPanel (floating gear)
│   ├── MembersTab (CRUD members + man month)
│   └── ProjectsTab (CRUD projects + volunteer management)
├── ProjectsNeedingLead (volunteer workflow display)
├── GanttChart (uses recharts)
├── LeadStats (uses recharts)
├── ProjectStatusPie (uses recharts)
├── ProjectMemberBarChart (uses recharts)
├── MemberProjectMatrix (custom grid + recharts)
├── MemberWorkloadRadar (uses recharts)
├── MemberProjectCountChart (uses recharts)
├── ProjectCards (display + admin control)
└── MemberProfiles (display + admin control)

Routing:
├── / → Dashboard (all charts)
└── /personnel → Personnel Page (Man Month tracking)

All connected via:
├── DataContext.useData() → (data, canEdit, addMember, etc.)
├── IdentityContext.useIdentity() → (currentUser, setIdentity)
├── VolunteerContext.useVolunteer() → (volunteers, refresh, apply, approve)
├── ThemeContext.useTheme() → (isDark, toggle)
└── Date utilities (formatDate, formatRelativeTime)
```

---

## 📦 Dependencies

### Frontend
```json
react@19.2.4              // UI framework
react-dom@19.2.4         // React rendering
typescript@5.9           // Type safety
@vitejs/plugin-react@6   // Vite React plugin
recharts@3.8             // Chart library
lucide-react@0.577       // Icon library
date-fns@4.1             // Date utilities
tailwindcss@3.4          // CSS framework
```

### Backend
```json
express@5.2              // Web framework
pg@8.20                  // PostgreSQL driver
cors@2.8.6               // CORS middleware
```

### Dev
```json
vite@8                   // Build tool
concurrently@9.2         // Run multiple processes
eslint@9.39              // Linting
postcss@8.5              // CSS processing
```

---

## 🎯 Key Implementation Details

### Optimistic Updates
1. User clicks save
2. UI immediately calls `setData(newData)` → visual feedback
3. Meanwhile, `persist()` sends POST request
4. On 409 conflict:
   - Roll back state: `setData(serverData)`
   - Show alert: "Data updated by another user"
   - User can retry

### Stale Detection
- Client stores `_updatedAt` (epoch milliseconds)
- On every write, sends current `_updatedAt` value
- Server checks: `if (clientTs < serverTs - 1000ms) → reject`
- 1000ms threshold accounts for clock skew + concurrent edits

### Write Queue
- All POST requests enqueued via `enqueue()` callback
- Ensures writes execute sequentially (no conflicts on SQL level)
- Returns promise that resolves when write completes

### Snapshot Storage
- Every WRITE_START event stores full data as JSONB
- Last 30 snapshots kept (older ones auto-deleted in schema)
- Restorable via POST /api/snapshots/:id/restore
- Includes "MANUAL_RESTORE" audit log entry

---

## 🚀 Build & Runtime

### Development
```bash
npm run dev  # concurrently runs:
             # - node server/index.js (API :4000, Node.js Cluster 8 workers)
             # - vite --host (WEB :5173)
```

### Production
```bash
npm run build  # tsc -b && vite build
               # → dist/ folder (static)
               # → server runs separately
```

---

## Related Documentation
- See `code-standards.md` for patterns & conventions
- See `system-architecture.md` for security & deployment
