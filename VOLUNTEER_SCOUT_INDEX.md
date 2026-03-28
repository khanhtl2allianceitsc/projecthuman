# ProjectHuman Volunteer System - Scout Report Index

**Date:** 2026-03-28  
**Status:** ✓ COMPLETE  
**Scout Scope:** Server routes, frontend context, database schema, volunteer storage, random/pick logic

---

## 📋 Generated Reports

| File | Size | Purpose |
|------|------|---------|
| **SCOUT_REPORT_VOLUNTEER.md** | 7.7K | Complete documentation with all details |
| **QUICK_REFERENCE_VOLUNTEER.txt** | 6.8K | Quick lookup reference card |
| **CODE_LOCATIONS_VOLUNTEER.txt** | 5.4K | Exact line numbers and code locations |
| **VOLUNTEER_SCOUT_INDEX.md** | This file | Navigation guide |

---

## 🎯 Key Findings at a Glance

### Server-Side Routes
- **Location:** `/d/Clients/ProjectHuman/server/index.js` (lines 598-730)
- **Endpoints:** 5 REST endpoints (GET, POST, DELETE, PATCH x2)
- **Auth:** IP-based identity lookup + `is_admin` flag

### Frontend Context
- **Location:** `/d/Clients/ProjectHuman/src/context/VolunteerContext.tsx`
- **Methods:** 7 methods (apply, cancel, approve, reject, getMyVolunteer, getPendingCount, refresh)
- **Auto-polling:** Every 10 seconds

### Database
- **Table:** `lead_volunteers` (created in server/index.js lines 819-829)
- **Columns:** 8 (id, project_id, member_id, status, note, created_at, updated_at, +UNIQUE)
- **Status:** pending | approved | rejected

### Random Logic
- **Result:** ✓ **NONE FOUND**
- **System Type:** 100% explicit approval-based, no randomization

---

## 📁 File Locations Quick Reference

**Backend:**
- Server: `/d/Clients/ProjectHuman/server/index.js`
- Schema: `/d/Clients/ProjectHuman/server/schema.sql`

**Frontend:**
- Context: `/d/Clients/ProjectHuman/src/context/VolunteerContext.tsx`
- Types: `/d/Clients/ProjectHuman/src/types/index.ts` (lines 65-78)
- UI: `/d/Clients/ProjectHuman/src/components/ProjectsNeedingLead.tsx`
- Stats: `/d/Clients/ProjectHuman/src/components/LeadStats.tsx`

---

## 🔗 API Endpoints Summary

| Method | Path | Line | Purpose |
|--------|------|------|---------|
| GET | `/api/volunteers` | 598 | List all applications |
| POST | `/api/volunteers` | 618 | Apply to be Lead |
| DELETE | `/api/volunteers/:projectId/:memberId` | 643 | Withdraw |
| PATCH | `/api/volunteers/:id/approve` | 659 | Approve [ATOMIC] |
| PATCH | `/api/volunteers/:id/reject` | 713 | Reject |

---

## 💾 Database Schema

**Table:** `lead_volunteers`

```
id         | SERIAL PRIMARY KEY
project_id | VARCHAR(50) FK to projects (CASCADE)
member_id  | VARCHAR(50) FK to members (CASCADE)
status     | VARCHAR(20) DEFAULT 'pending'
note       | TEXT
created_at | TIMESTAMPTZ DEFAULT NOW()
updated_at | TIMESTAMPTZ DEFAULT NOW()
UNIQUE(project_id, member_id)
```

---

## 🎨 Frontend Context Methods

```typescript
apply(projectId, memberId, note?)     // POST /api/volunteers
cancel(projectId, memberId)           // DELETE /api/volunteers/{...}
approve(id)                           // PATCH /api/volunteers/{id}/approve
reject(id)                            // PATCH /api/volunteers/{id}/reject
getMyVolunteer(projectId, memberId)   // LeadVolunteer | undefined
getPendingCount()                     // number
refresh()                             // GET /api/volunteers (10s auto-poll)
```

---

## 📖 How to Use These Reports

### For Complete Understanding
→ Read **SCOUT_REPORT_VOLUNTEER.md**
- Full documentation with all sections
- Best for onboarding or team documentation
- Suitable for wiki/knowledge base

### For Quick Lookups
→ Use **QUICK_REFERENCE_VOLUNTEER.txt**
- Quick facts and endpoint table
- Best for desk reference
- Print-friendly format

### For Code Navigation
→ Consult **CODE_LOCATIONS_VOLUNTEER.txt**
- Exact line numbers for every function
- Maps code sections to source files
- Great for debugging or code review

### For This Summary
→ This file serves as index/navigation guide

---

## 🔍 Key Characteristics

✓ **No Random Selection** - Explicit admin approval required  
✓ **One Lead Per Project** - Approving auto-demotes previous lead  
✓ **Auto-Reject Pending** - When one approved, others auto-rejected  
✓ **Atomic Transactions** - Approve uses BEGIN/COMMIT/ROLLBACK  
✓ **IP-Based Auth** - User identity from IP lookup  
✓ **Auto-Polling** - Frontend refreshes every 10 seconds  
✓ **Audit Logging** - All actions logged to write_log table  
✓ **Vietnamese i18n** - All UI messages in Vietnamese  

---

## 🚀 Workflow Overview

**User Applies:**
1. Views project with `needLead=true`
2. Clicks "Tôi muốn làm Lead" button
3. Status becomes `pending`
4. Waits for admin approval

**Admin Approves:**
1. Views pending applications in ProjectsNeedingLead
2. Clicks checkmark button
3. Actions: status→approved, member→Lead, old Lead→Member, others→rejected
4. All within atomic transaction

**Admin Rejects:**
1. Clicks X button
2. Status→rejected

**User Withdraws:**
1. Sees "Rút đơn" link
2. Clicks to cancel application

---

## 📊 Authorization Model

**Mechanism:** IP-based identity lookup

```sql
SELECT m.is_admin FROM user_identities ui 
  JOIN members m ON m.id=ui.member_id 
  WHERE ui.ip=$1
```

**Auto-Admin:** Set on startup for "Trương Lê Khánh" (line 832)

**Approval Actions:** Only `is_admin=true` users can approve/reject

---

## 🛠️ Component Dependencies

```
ProjectsNeedingLead.tsx
  └── useVolunteer() [from VolunteerContext]
        ├── apply()
        ├── cancel()
        ├── approve()
        ├── reject()
        ├── getMyVolunteer()
        └── volunteers state

LeadStats.tsx
  └── Uses volunteer data for display (read-only)
```

---

## ❓ Questions Resolved

✓ Server-side routes - **FOUND** (5 endpoints in server/index.js:598-730)  
✓ Frontend context - **FOUND** (VolunteerContext.tsx with 7 methods)  
✓ Database schema - **FOUND** (lead_volunteers table in server/index.js:819-829)  
✓ Volunteer storage - **FOUND** (id, project_id, member_id, status, note)  
✓ Random/pick logic - **NOT FOUND** (system is explicit approval-based)  

---

## 📝 Notes

- All reports are in `/d/Clients/ProjectHuman/`
- Total documentation: ~579 lines across 3 files
- All file paths are absolute and verified
- Line numbers reference `server/index.js` unless otherwise noted
- Status values are lowercase: `pending`, `approved`, `rejected`
- Volunteers are approved by `id`, withdrawn by `(projectId, memberId)` pair

---

## 🎓 Related Concepts

- **Lead** - Project leader role (set in project_members.project_role)
- **Volunteer Deadline** - Optional deadline for applications (projects.volunteer_deadline)
- **Pending Auto-Reject** - When one volunteer approved, others for same project auto-rejected
- **Atomic Approval** - Uses database transactions to ensure consistency
- **IP Identity** - Users identified by their IP address (user_identities table)

---

**Generated:** 2026-03-28  
**Status:** ✓ COMPLETE AND VERIFIED  
**Ready for:** Team documentation, code review, implementation
