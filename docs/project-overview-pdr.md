# ProjectHuman — Product Overview & Requirements (PDR)

## 📌 Executive Summary

**ProjectHuman** is a lightweight, real-time team & project management dashboard designed for Vietnamese-speaking teams. It enables distributed teams to view project portfolios, track member workloads, manage project-member assignments, and maintain a complete audit trail of all changes—without requiring user registration or complex permissions.

Key differentiator: **IP-based access control** + **stale-write detection** = simple, scalable multi-user editing with conflict resolution.

---

## 🎯 Product Vision

### Target Users
- **Small to mid-size teams** (10–100 members)
- **Distributed teams** requiring **real-time collaboration**
- **Non-technical stakeholders** who want dashboards without learning project management tools
- **Vietnamese-speaking organizations** (primary UI language)

### Problem Statement
Existing solutions (Asana, Monday, Jira) are:
- Too complex for simple dashboard use cases
- Require user registration & SSO setup
- Don't offer instant multi-user conflict resolution
- Limited audit trails for accountability

ProjectHuman solves this by:
- **Zero registration**: Just IP-whitelist your team
- **Instant edits**: Optimistic updates with automatic conflict handling
- **Full audit trail**: Every change logged with IP, timestamp, snapshot
- **Rich dashboards**: Gantt, heatmaps, workload radar, status breakdown

---

## ✨ Core Features

### Feature Matrix

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| **Dashboard** | ✅ Done | P0 | Gantt, charts, cards, KPIs |
| **CRUD Members** | ✅ Done | P0 | Create, edit, delete team members |
| **CRUD Projects** | ✅ Done | P0 | Create, edit, delete projects + assignments |
| **Real-time Sync** | ✅ Done | P0 | Multi-user edits with stale detection (409) |
| **Audit Trail** | ✅ Done | P0 | Full write log + snapshots |
| **IP Whitelist** | ✅ Done | P0 | Config-based access control |
| **Dark/Light Theme** | ✅ Done | P1 | System preference aware |
| **Vietnamese UI** | ✅ Done | P0 | Error messages, alerts in Vietnamese |
| **Snapshots** | ✅ Done | P2 | Auto-save last 30 states, restorable |
| **Export JSON** | ✅ Done | P3 | Download current data as JSON |
| **Volunteer Lead Workflow** | ✅ Done | P1 | Apply, approve, reject lead assignments |
| **Identity System** | ✅ Done | P0 | IP→member login/logout, session tracking |
| **Personnel & Man Month** | ✅ Done | P2 | Salary tier tracking with 8 tiers |

### Feature Breakdown

#### Dashboard Visualizations
- **Gantt Chart**: Project timelines, completion status
- **Project Status Pie**: Distribution of active/completed/paused projects
- **Member Workload Radar**: Multi-axis performance view per team member
- **Member-Project Matrix**: Heatmap showing assignment density
- **Lead Stats**: Workload breakdown by project lead
- **Project Cards**: Expandable project detail cards with team roster
- **Member Profiles**: Team member cards with role, avatar, assigned projects

#### Admin Panel (Floating Gear Icon)
- **Members Tab**
  - Create new member (auto-generates ID, assigns color/avatar)
  - Edit member name, role, avatar, color, man month value
  - Delete member (cascade to project assignments)
  - Search/filter by name or role

- **Projects Tab**
  - Create new project (set name, description, dates, status, priority, budget)
  - Assign members to project + set project roles (Lead, PM, Dev, etc.)
  - Manage volunteer lead applications (approve/reject)
  - Edit project details (progress, spent vs. budget)
  - Delete project
  - Apply bulk tags

#### Volunteer Lead Workflow
- Members apply to lead projects with optional notes
- Admin reviews pending applications
- Approve application → member becomes Lead, competitors auto-rejected
- Reject application → stays pending or marked rejected
- Members can withdraw applications

#### Identity System
- IP→member session mapping on login (`POST /api/identity`)
- Persistent session across browser sessions
- Login modal (`WhoAreYouModal`) for IP registration
- Logout capability (`DELETE /api/identity`)

#### Personnel & Man Month Tracking
- Dedicated Personnel page with ranked list
- 8 salary tiers: Master (≥40), Senior (25-39), Mid (15-24), Junior+ (10-14), Junior (6-9), Fresher (3-5), Intern (1-2), TBD (0)
- Inline editing of man month values
- Automatic tier classification based on man month

#### Data Synchronization
- **Optimistic Updates**: UI updates immediately on edit
- **Stale Detection**: Client tracks `_updatedAt` version
  - If server has newer version → 409 Conflict
  - Client fetches fresh data + shows alert
  - User can retry edit
- **Write Queue**: All writes serialized (no concurrent writes)
- **Transactions**: All member/project/assignment changes in single DB transaction

#### Audit & Recovery
- **Write Log**: Every change captured with:
  - Event type (READ, WRITE_OK, WRITE_ERROR, STALE_REJECTED, etc.)
  - Source IP
  - Detail string
  - Full JSONB snapshot of data before write
  - Timestamp

- **Auto-Snapshots**: Last 30 write operations kept
  - Restorable from localhost only (admin feature)
  - Useful for accidental deletions or rollback scenarios

---

## 🎮 User Workflows

### Scenario 1: Team Member Views Dashboard
1. Opens dashboard (any IP can view)
2. Sees all projects, team members, workload charts
3. Cannot edit (not in whitelist)
4. Can view audit logs if on localhost

### Scenario 2: Team Lead Edits Project Status
1. Edits project progress slider
2. UI updates instantly (optimistic)
3. POST sent to `/api/data` with current `_updatedAt` version
4. Server checks: is client version stale?
   - ✅ If current → writes to DB, returns new `_updatedAt`
   - ❌ If stale → returns 409 + fresh data, UI rolls back & shows alert
5. User can retry edit with fresh data

### Scenario 3: Assign Member to Project
1. Open Projects tab in admin panel
2. Click "Add Member" on a project
3. Select member + set project role (e.g., "Backend Dev")
4. Click Save
5. Optimistic update shows member immediately
6. POST to server; on 409 conflict, user retried with fresh member list

### Scenario 4: Recover from Accidental Delete
1. Admin logs in from localhost
2. Opens `/api/snapshots` (REST call or built-in UI)
3. Selects snapshot from 1 hour ago
4. Clicks "Restore"
5. Database rolls back to that state
6. Audit log shows "MANUAL_RESTORE" event

---

## 📊 Data Model

### Core Entities

#### Member
```ts
{
  id: string (uuid or custom)
  name: string
  role: string (e.g., "Lead", "Frontend Dev")
  color: string (hex color for avatar background)
  avatar: string (emoji or initials)
  manMonth?: number (optional, for salary tracking)
  isAdmin?: boolean (optional, admin flag)
  createdAt: ISO 8601
  createdByIp: string
  updatedAt: ISO 8601
  updatedByIp: string
}
```

#### Project
```ts
{
  id: string (uuid)
  name: string
  description: string
  status: 'active' | 'completed' | 'planning' | 'paused'
  priority: 'low' | 'medium' | 'high' | 'critical'
  color: string (hex)
  startDate: YYYY-MM-DD
  endDate: YYYY-MM-DD
  progress: 0–100 (%)
  budget: number (currency amount)
  spent: number (currency amount)
  tags: string[]
  members: [{memberId, projectRole}]
  createdAt: ISO 8601
  createdByIp: string
  updatedAt: ISO 8601
  updatedByIp: string
}
```

#### ProjectMember (Join)
```ts
{
  projectId: string (FK)
  memberId: string (FK)
  projectRole: 'Lead' | 'PM' | 'Frontend Dev' | 'Backend Dev' | 'Designer' | 'QA' | 'DevOps' | 'Analyst' | 'Full Stack' | 'AI Developer'
}
```

#### LeadVolunteer (Volunteer Applications)
```ts
{
  id: string (uuid)
  projectId: string (FK)
  memberId: string (FK)
  status: 'pending' | 'approved' | 'rejected'
  note?: string (optional application note)
  createdAt: ISO 8601
  updatedAt: ISO 8601
}
```

---

## 🔐 Security Model

### Access Control
- **Public Read**: Anyone can view dashboard + fetch data
- **Restricted Write**: Only IPs in `config.json` can POST changes
  - If IP not whitelisted → 403 Forbidden
  - Logged as "BLOCKED" event
- **Admin Endpoints**: Localhost only (127.0.0.1 or ::1)
  - Logs, snapshots, config management
  - Assumes admin runs on-premise or VPN

### Stale-Write Detection
- Client maintains `_updatedAt` (millisecond timestamp)
- On save, sends current version + full data payload
- Server compares: if `_updatedAt < serverTs - 1000ms` → reject
- Response: 409 Conflict with current data
- Client UI rolls back + alerts user to retry

### Audit Trail
- Every write operation logged to `write_log` table
- Includes: event type, IP, detail, full JSONB snapshot, timestamp
- 200 most recent logs retrievable via `/api/logs`
- Useful for compliance, debugging, change tracking

---

## 🚀 Non-functional Requirements

| NFR | Target | Implementation |
|-----|--------|-----------------|
| **Latency** | <500ms writes | Write queue + DB transactions |
| **Concurrency** | 10 simultaneous edits | Serialized writes, stale detection |
| **Data Durability** | PostgreSQL ACID | Transactions, indexed audit log |
| **Availability** | 99.5% (production) | Single-server, health check endpoint |
| **Scalability** | 1000+ projects, 100+ members | Optimized queries, connection pooling |
| **UI Responsiveness** | <100ms optimistic update | React Context, immediate state change |
| **Audit Retention** | 30 snapshots, 200 log entries | Auto-cleanup of old entries |

---

## 📋 Requirements Status

### ✅ Completed (MVP)
- [x] Real-time dashboard with 7+ chart types
- [x] Member & project CRUD
- [x] IP-based permissions
- [x] Stale-write conflict resolution
- [x] Full audit trail with snapshots
- [x] Vietnamese UI messages
- [x] Dark/light theme
- [x] Responsive design

### 🔜 Planned (Future)
- [ ] User authentication (vs. IP-only)
- [ ] Role-based permissions (vs. all-or-nothing)
- [ ] Project templates
- [ ] Email notifications on updates
- [ ] Bulk import/export (CSV)
- [ ] API token support
- [ ] Webhook integrations

### ❌ Out of Scope (Current)
- Time tracking / timesheets
- Chat / messaging
- Advanced forecasting
- Machine learning recommendations
- Mobile native apps (responsive web only)

---

## 📈 Success Metrics

- **Adoption**: 50+ teams using within 6 months
- **Edit Latency**: <200ms perceived, <500ms actual
- **Conflict Rate**: <5% of writes trigger 409
- **Data Loss**: 0 incidents
- **Audit Completeness**: 100% of writes logged

---

## 🔗 Related Documents

- See `codebase-summary.md` for component architecture
- See `system-architecture.md` for database schema & API design
- See `deployment-guide.md` for setup instructions
