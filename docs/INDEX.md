# ProjectHuman Documentation Index

**Last Updated**: 2026-03-20

Complete documentation suite for the ProjectHuman team & project management dashboard.

---

## 📚 Documentation Files

### 1. **README.md** (Root Level)
**Lines**: 195+ | **Purpose**: Quick start & overview for new users

**Contents:**
- Project description & key features (including Volunteer Lead, Identity System, Personnel)
- Quick start (prerequisites, setup commands)
- Tech stack summary
- Project structure overview (24 components, 7 tables, 29 endpoints)
- Expanded API reference (all 29 endpoints documented)
- Configuration guide
- Troubleshooting table

**Read this first** if you're new to ProjectHuman.

---

### 2. **docs/project-overview-pdr.md**
**Lines**: 290+ | **Purpose**: Product vision, requirements, user workflows

**Contents:**
- Executive summary & product vision
- Target users & problem statement
- Core features matrix (13 features: dashboard, CRUD, volunteer lead, identity, personnel, sync, audit)
- Feature breakdown (dashboards, admin panel, volunteer workflow, identity system, personnel tracking, sync, audit)
- User workflows (4 scenarios + volunteer lead workflow)
- Data model (Member, Project, ProjectMember, LeadVolunteer entities)
- Security model (IP whitelist, stale detection, audit)
- Non-functional requirements (latency, concurrency, durability)
- Requirements status (✅ completed, 🔜 planned, ❌ out of scope)
- Success metrics

**Read this if** you want to understand what ProjectHuman is and why.

---

### 3. **docs/codebase-summary.md**
**Lines**: 560+ | **Purpose**: Code organization, component catalog, data flow

**Contents:**
- Codebase metrics (5,240 frontend LOC + 882 backend + 1,010 tests, 24 components, 29 routes, 7 tables, 40 DB connections)
- Directory structure with LOC for each file
- Component documentation:
  - Chart components (Gantt, Pie, Radar, Heatmap, LeadStats, etc.)
  - Detail cards (ProjectCards, ProjectsNeedingLead, MemberProfiles)
  - Admin controls (AdminPanel, CRUD interfaces)
  - Pages (PersonnelPage for Man Month tracking)
  - Utilities (AuditBadge, WhoAreYouModal, DateUtils)
- Context API documentation (DataContext, IdentityContext, VolunteerContext, ThemeContext)
- Type definitions (Member, Project, ProjectMember, LeadVolunteer)
- Data flow diagram (read, write, conflict handling)
- Database layer (7 tables: members, projects, project_members, user_identities, lead_volunteers, meta, write_log)
- Component dependency graph (with routing: / + /personnel)
- Dependencies list (frontend, backend, dev)
- Key implementation details (optimistic updates, stale detection, write queue, snapshots, volunteer polling)

**Read this if** you're navigating the codebase or adding new features.

---

### 4. **docs/code-standards.md**
**Lines**: 510+ | **Purpose**: Coding conventions, patterns, best practices

**Contents:**
- TypeScript naming conventions
- Strict type definitions (no `any`)
- File organization & naming
- Man Month salary tier naming convention (8 tiers)
- Component patterns (functional, hooks, context, error handling)
- VolunteerContext polling pattern (10s refresh)
- Dynamic API URL construction (LAN-safe)
- UI/styling patterns (Tailwind, dark mode, responsive)
- API patterns (fetch wrappers, types, headers)
- Database patterns (parameterized queries, transactions, normalization, JSON)
- Testing & validation (input validation, type guards)
- Security best practices (IP validation, stale detection, audit logging)
- Code review checklist

**Read this before** submitting code or doing code reviews.

---

### 5. **docs/system-architecture.md**
**Lines**: 630+ | **Purpose**: System design, API design, security model, deployment

**Contents:**
- System overview diagram (8-worker Node.js Cluster, 40 DB connections)
- Database schema (detailed for 7 tables: members, projects, project_members, user_identities, lead_volunteers, meta, write_log)
- Database design notes (constraints, types, audit fields)
- API layer documentation:
  - Public endpoints (GET /api/data, GET /api/me, GET /api/ping)
  - Identity endpoints (GET/POST/DELETE /api/identity for session)
  - Volunteer Lead endpoints (GET/POST/DELETE/PATCH for applications)
  - Member CRUD endpoints (POST/PATCH/DELETE, admin toggle)
  - Project CRUD endpoints (POST/PATCH/DELETE)
  - Admin endpoints (GET /api/logs, GET /api/snapshots, POST restore, config)
- Security model (IP whitelist, stale-write detection, audit trail)
- Data flow (read flow, write flow with transaction details)
- Performance considerations (Node.js cluster, write queue, indexes, connection pooling)
- Deployment architecture (dev, production, scaling)

**Read this if** you're deploying, scaling, or understanding the architecture.

---

### 6. **docs/project-roadmap.md**
**Lines**: 310+ | **Purpose**: Status, planned features, technical debt, roadmap

**Contents:**
- Current status (MVP, 0.1.0)
- ✅ What's done (dashboard, CRUD, volunteer lead, identity, personnel, sync, security, API, DB, localization, DX)
- 🔜 Planned features by quarter:
  - Q2: Authentication & permissions (6 weeks, P1)
  - Q2: Notifications (4 weeks, P2)
  - Q3: Templates & export (3–4 weeks, P2–P3)
  - Q4: API tokens & webhooks (8 weeks, P3)
  - Q1 2027: Advanced analytics (6 weeks, P3)
- 🚧 Technical debt & improvements:
  - High: Migrations, error handling, pagination
  - Medium: Compression, caching, validation, rate limiting, tests
  - Low: i18n, mobile, offline, WebSocket, full-text search
- Success metrics (teams, users, latency, conflicts, uptime)
- Known issues & limitations
- Release timeline (versions, dates)
- Contributing guidelines

**Read this to** understand project priorities and what's coming next.

---

### 7. **docs/deployment-guide.md**
**Lines**: 560+ | **Purpose**: Setup, configuration, operations, deployment

**Contents:**
- Quick start (prerequisites, first-time setup, port :4000)
- PostgreSQL setup (Windows, macOS, Linux, connection config)
- Environment configuration (IP whitelist, dynamic config)
- Production build (build command, start production server on :4000)
- Web server config (Nginx, Apache, Node.js options)
- Database initialization (one-time setup, manual reset)
- Backups & recovery (pg_dump, restore, automated backups)
- Snapshot recovery (view, restore procedures)
- Health checks & monitoring (endpoints, logs, connection status)
- Troubleshooting table (10+ issues with :4000 port references)
- Scaling for production (single-server with 8 workers + 40 connections, multi-server, HA setup)
- Production security checklist
- Example AWS EC2 deployment (step-by-step)

**Read this when** setting up, deploying, or operating ProjectHuman.

---

## 🎯 Quick Navigation by Role

### 👤 Product Manager / Stakeholder
1. Start with **README.md** (overview)
2. Read **project-overview-pdr.md** (vision & requirements)
3. Check **project-roadmap.md** (status & priorities)

### 👨‍💻 Frontend Developer
1. **README.md** → Quick start
2. **codebase-summary.md** → Component catalog
3. **code-standards.md** → Conventions
4. **system-architecture.md** → Data flow & API

### 🔧 Backend Developer
1. **README.md** → Quick start
2. **system-architecture.md** → API design & DB schema
3. **code-standards.md** → Patterns & security
4. **deployment-guide.md** → Database setup

### 🚀 DevOps / Deployment Engineer
1. **deployment-guide.md** (primary guide)
2. **system-architecture.md** (infrastructure, scaling)
3. **project-roadmap.md** (upcoming features to plan for)

### 🆕 New Team Member (General)
1. **README.md** (start here)
2. **project-overview-pdr.md** (understand the product)
3. **codebase-summary.md** (navigate the code)
4. **code-standards.md** (write code correctly)

---

## 📊 Documentation Statistics

| File | Lines | Purpose |
|------|-------|---------|
| README.md | 195+ | Quick start & overview |
| project-overview-pdr.md | 290+ | Product vision & requirements |
| codebase-summary.md | 560+ | Code organization & catalog |
| code-standards.md | 510+ | Conventions & patterns |
| system-architecture.md | 630+ | System design & API |
| project-roadmap.md | 310+ | Status & roadmap |
| deployment-guide.md | 560+ | Setup & operations |
| **TOTAL** | **3,055+** | **Comprehensive documentation** |

**Average file size**: ~437 lines (all under 800 LOC limit)

---

## 🔗 Cross-References

**From README.md** → Links to all docs/
**From project-overview-pdr.md** → Refers to codebase-summary, system-architecture, deployment-guide
**From codebase-summary.md** → Links to code-standards, system-architecture
**From code-standards.md** → Links to codebase-summary, system-architecture
**From system-architecture.md** → Links to deployment-guide, codebase-summary, project-overview-pdr
**From project-roadmap.md** → Links to project-overview-pdr, deployment-guide, codebase-summary
**From deployment-guide.md** → Links to system-architecture, project-roadmap

---

## 📝 Writing Style & Format

All documentation follows these principles:

- **Concise**: ~400 lines per file, structured sections
- **Practical**: Includes examples, code snippets, commands
- **Technical**: Preserves English terms, Vietnamese for user-facing messages
- **Organized**: Markdown with TOC, clear headings, tables
- **Cross-linked**: References between docs for navigation

---

## 🔄 Maintenance & Updates

**Last Updated**: 2026-03-25

Docs should be updated when:
- [ ] Major features added (update roadmap, features list)
- [ ] API endpoints change (update system-architecture)
- [ ] Code patterns established (update code-standards)
- [ ] New files/components added (update codebase-summary)
- [ ] Setup steps change (update deployment-guide)
- [ ] Dependencies upgraded (update README tech stack)
- [ ] Database schema changes (update system-architecture)
- [ ] Port or connection pool configuration changes (update all)

**Deprecation Policy**: Mark outdated sections with ⚠️ and provide updated reference.

---

## 📞 Questions or Feedback?

- For product questions → See project-overview-pdr.md
- For code questions → See codebase-summary.md + code-standards.md
- For deployment help → See deployment-guide.md
- For roadmap questions → See project-roadmap.md
- For architecture → See system-architecture.md

---

**Documentation Version**: 2.0
**ProjectHuman Version**: 0.1.0
**Generated**: 2026-03-25
