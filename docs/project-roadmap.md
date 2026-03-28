# ProjectHuman — Project Roadmap & Status

## 📊 Current Status: MVP (Production Ready)

**Version**: 0.1.0
**Launched**: 2026-03
**Teams**: 5–10 active users (internal)
**Status**: Stable, accepting new features

---

## ✅ What's Done (MVP Features)

### Core Dashboard (100%)
- [x] 7+ chart types (Gantt, Pie, Bar, Radar, Heatmap, etc.)
- [x] Real-time data refresh on edit
- [x] Responsive grid layout (mobile-first TailwindCSS)
- [x] Dark/light theme with system preference detection
- [x] KPI header (project count, member count, budget, spent)

### Data Management (100%)
- [x] CRUD members (create, read, update, delete via floating admin panel)
- [x] CRUD projects (with description, dates, status, priority, budget)
- [x] Assign members to projects + set project roles (Lead, PM, Dev, QA, etc.)
- [x] Search/filter members and projects
- [x] Bulk operations (e.g., delete multiple projects)

### Volunteer Lead Workflow (100%)
- [x] Members apply to lead projects with optional notes
- [x] Admin review pending applications (localhost only)
- [x] Approve application → member becomes Lead, competitors auto-rejected
- [x] Reject application → stay pending or marked rejected
- [x] Members can withdraw applications
- [x] Real-time polling (10s refresh)

### Identity/Session System (100%)
- [x] IP→member login/session mapping
- [x] Login modal with member selection or creation
- [x] Persistent session across browser sessions
- [x] Logout capability
- [x] Identity badge in header

### Personnel & Man Month Tracking (100%)
- [x] Dedicated Personnel page with ranked list
- [x] 8 salary tiers: Master (≥40), Senior (25-39), Mid (15-24), Junior+ (10-14), Junior (6-9), Fresher (3-5), Intern (1-2), TBD (0)
- [x] Inline editing of man month values
- [x] Automatic tier classification
- [x] Real-time updates

### Multi-user Sync (100%)
- [x] Real-time edit synchronization across clients
- [x] Optimistic updates (immediate UI feedback)
- [x] Stale-write conflict detection (409 Conflict)
- [x] Automatic conflict resolution with data refresh
- [x] Alert user when their edit is rejected, prompt retry

### Security & Audit (100%)
- [x] IP-based whitelist for write access
- [x] Localhost-only admin endpoints (logs, snapshots, config)
- [x] Full audit trail (event, IP, detail, timestamp)
- [x] Automatic snapshots on every write (last 30 kept)
- [x] Snapshot restore functionality (recover to any point in time)

### Backend API (100%)
- [x] 29 RESTful routes (CRUD + identity + volunteer + admin)
- [x] Write queue (serialization prevents race conditions)
- [x] ACID transactions (all-or-nothing updates)
- [x] Node.js Cluster (8 workers, auto-scaled, auto-restart)
- [x] Connection pooling (5 per worker × 8 = 40 total connections)
- [x] Error handling with user-friendly Vietnamese messages

### Database (100%)
- [x] 7 tables (members, projects, project_members, user_identities, lead_volunteers, meta, write_log)
- [x] Proper audit fields on all tables (created_by_ip, created_at, updated_by_ip, updated_at)
- [x] Indexed queries for performance
- [x] Cascading deletes for referential integrity

### Localization (100%)
- [x] Vietnamese UI messages and error alerts
- [x] Vietnamese date formats (where applicable)
- [x] English technical terms preserved

### Developer Experience (100%)
- [x] TypeScript for type safety
- [x] Hot reload (Vite + Express rewatch)
- [x] ESLint configured
- [x] One-command setup (node server/migrate.js)
- [x] Well-organized code structure

---

## 🔜 Planned Features (Next 2–3 Quarters)

### Q2 2026: Authentication & Permissions (Est. 6 weeks)
**Priority**: P1 | **Effort**: Medium

- [ ] User authentication (email/password or OAuth)
- [ ] Role-based access control (Admin, Lead, Member, Viewer)
- [ ] Replace IP-whitelist with role-based permissions
- [ ] User profile management
- [ ] Session management + logout
- [ ] Password reset flow

**Why**: Current IP-whitelist works for small teams but doesn't scale to 50+ users. Enables proper multi-org support.

### Q2 2026: Notifications (Est. 4 weeks)
**Priority**: P2 | **Effort**: Low–Medium

- [ ] In-app notification system (bell icon)
- [ ] Email notifications on project updates
- [ ] Notification preferences per user
- [ ] Digest emails (daily/weekly summary)
- [ ] Notification history

**Why**: Keep distributed teams informed. Reduce need to manually refresh dashboard.

### Q3 2026: Project Templates (Est. 3 weeks)
**Priority**: P2 | **Effort**: Low

- [ ] Save projects as templates
- [ ] Clone project from template
- [ ] Template library (pre-built: Agile Sprint, Waterfall, etc.)
- [ ] Bulk create projects from template

**Why**: Reduce repeated CRUD for similar projects.

### Q3 2026: Export/Import (Est. 4 weeks)
**Priority**: P3 | **Effort**: Low–Medium

- [ ] Export to CSV (members, projects)
- [ ] Export to Excel with formatted sheets
- [ ] Import from CSV
- [ ] Bulk update members from import
- [ ] Data validation on import

**Why**: Integration with existing tools (Excel, Sheets, BI tools).

### Q4 2026: API Tokens & Webhooks (Est. 8 weeks)
**Priority**: P3 | **Effort**: High

- [ ] API token generation + revocation
- [ ] OAuth2 server (for third-party integrations)
- [ ] Webhook system (on project status change, member added, etc.)
- [ ] Webhook delivery with retry logic
- [ ] Event log for webhook calls

**Why**: Enable external tool integrations (Slack, Teams, Zapier, etc.).

### Q1 2027: Advanced Analytics (Est. 6 weeks)
**Priority**: P3 | **Effort**: Medium

- [ ] Burndown/burnup charts
- [ ] Velocity tracking
- [ ] Resource utilization metrics
- [ ] Budget trend analysis
- [ ] Custom report builder

**Why**: Strategic insights into team productivity and project health.

---

## 🚧 Technical Debt & Improvements

### High Priority (Next 2 weeks)

- [ ] **Add database migrations** — Currently all-or-nothing schema.sql
  - Use a migration tool (e.g., Flyway, Liquibase, custom Node.js runner)
  - Enable schema changes without data loss
  - Track applied migrations in meta table

- [ ] **Improve error handling** — Some errors still logged to console
  - Standardize error response format
  - Add error tracking (Sentry or similar)
  - Better error messages for edge cases

- [ ] **Performance: Paginate /api/data** — Currently returns all records
  - Add offset/limit query params
  - Implement cursor-based pagination
  - Reduce response size for large datasets

### Medium Priority (Next month)

- [ ] **Compression** — Enable gzip on API responses
- [ ] **Caching layer** — Redis for /api/data reads (if stale data acceptable)
- [ ] **Input validation schema** — Add validation library (Zod, Joi)
- [ ] **Rate limiting** — Prevent API abuse
- [ ] **Test suite** — Add unit + integration tests
  - Frontend component tests (Vitest)
  - Backend API tests (Jest)
  - E2E tests (Playwright)

### Low Priority (Backlog)

- [ ] **Internationalization (i18n)** — Support multiple languages (English, Vietnamese, Spanish, Japanese)
- [ ] **Mobile app** — Native iOS/Android apps (currently web-responsive only)
- [ ] **Offline mode** — Service worker + local SQLite for offline editing
- [ ] **Real-time collab** — WebSocket instead of polling for true realtime (current: optimistic + conflicts)
- [ ] **Advanced search** — Full-text search on project descriptions, member notes

---

## 🎯 Success Metrics & Targets

| Metric | Current | Target (6mo) | Target (1yr) |
|--------|---------|--------------|--------------|
| **Active Teams** | 10 | 50 | 500 |
| **Total Users** | 50 | 250 | 2,000 |
| **Avg Projects/Team** | 8 | 15 | 25 |
| **Avg Members/Team** | 5 | 12 | 15 |
| **Write Latency (p99)** | <500ms | <300ms | <200ms |
| **Conflict Rate** | <5% | <3% | <1% |
| **Uptime** | 99% | 99.5% | 99.9% |
| **Data Loss Incidents** | 0 | 0 | 0 |

---

## 🔍 Known Issues & Limitations

### Current Limitations

1. **No User Auth**
   - IP-whitelist only works for co-located teams or VPN
   - Doesn't scale to distributed users easily
   - All IP-whitelisted users can edit everything (no granular permissions)

2. **All Data Loaded at Once**
   - GET /api/data returns entire dataset
   - Slow for 10K+ projects
   - Workaround: implement pagination before scaling

3. **No Real-time Collab**
   - Uses polling + optimistic updates
   - Stale writes detected after the fact
   - Workaround: WebSocket layer planned for Q3

4. **Limited UI Customization**
   - Dashboard layout fixed (can't rearrange charts)
   - No custom fields
   - Can't hide charts user doesn't care about

5. **Single PostgreSQL Instance**
   - No replicas for read scaling
   - Backup via standard PostgreSQL tools
   - Failover requires manual intervention

### Resolved Issues

- [x] ~~Concurrent write conflicts~~ → Fixed with stale detection + write queue
- [x] ~~Lost audit trail~~ → Fixed with write_log table
- [x] ~~Data restoration~~ → Fixed with auto-snapshots
- [x] ~~Unresponsive UI~~ → Fixed with optimistic updates

---

## 📅 Release Timeline

| Version | Date | Features |
|---------|------|----------|
| **0.1.0** | 2026-03 | MVP: dashboard, CRUD, sync, audit |
| **0.2.0** | 2026-05 | Authentication + role-based access |
| **0.3.0** | 2026-08 | Notifications + templates + export |
| **0.4.0** | 2026-11 | API tokens + webhooks |
| **0.5.0** | 2027-02 | Advanced analytics + reports |
| **1.0.0** | 2027-06 | Production hardening + scaling |

---

## 🤝 Contributing & Priorities

### For New Contributors
1. Start with **code-standards.md** for conventions
2. Pick a "Good First Issue" from backlog
3. Read relevant docs (PDR, architecture)
4. Submit PR with tests

### For Maintainers
1. Code review: check standards compliance
2. Test: manual testing on staging
3. Performance: profile critical paths
4. Security: review auth, injection risks

---

## 💬 Feedback & Feature Requests

**How to Request a Feature:**
1. Open an issue with `[FEATURE]` prefix
2. Describe use case and user story
3. Explain why it matters to your team
4. Estimate effort (if possible)

**How to Report a Bug:**
1. Open an issue with `[BUG]` prefix
2. Describe steps to reproduce
3. Include screenshots/logs
4. Note your browser + OS version

---

## 🔗 Related Documents
- See `project-overview-pdr.md` for requirements
- See `deployment-guide.md` for current setup
- See `codebase-summary.md` for code organization
