# ProjectHuman Volunteer System Scout Report
**Date:** 2026-03-28  
**Scope:** Server-side routes, frontend context, database schema, and volunteer logic

---

## File Locations

### Backend Files
- Server Main: `/d/Clients/ProjectHuman/server/index.js`
- Database Schema: `/d/Clients/ProjectHuman/server/schema.sql`
- Database Config: `/d/Clients/ProjectHuman/server/db.js`
- Database Migration: `/d/Clients/ProjectHuman/server/migrate.js`

### Frontend Files
- Volunteer Context: `/d/Clients/ProjectHuman/src/context/VolunteerContext.tsx`
- Type Definitions: `/d/Clients/ProjectHuman/src/types/index.ts`
- UI Components:
  - `/d/Clients/ProjectHuman/src/components/ProjectsNeedingLead.tsx` (main volunteer UI)
  - `/d/Clients/ProjectHuman/src/components/LeadStats.tsx` (lead statistics)

---

## API ENDPOINTS (SERVER-SIDE)

All endpoints in `/d/Clients/ProjectHuman/server/index.js`

### 1. GET /api/volunteers (Line 598)
**Purpose:** Fetch all volunteer applications with member & project info

Response includes:
- id (lead_volunteers.id)
- projectId, memberId
- status: pending | approved | rejected
- note, createdAt
- memberName, memberAvatar, memberColor, memberRole
- projectName, projectColor

### 2. POST /api/volunteers (Line 618)
**Purpose:** Apply to be Lead for a project
**Request:** { projectId, memberId, note (optional) }

Validations:
- Checks if project already has a Lead (403 error if yes)
- Uses ON CONFLICT upsert for duplicate prevention
- Sets status to 'pending'

Audit Logged: VOLUNTEER_APPLY

### 3. DELETE /api/volunteers/:projectId/:memberId (Line 643)
**Purpose:** Withdraw volunteer application
Audit Logged: VOLUNTEER_CANCEL

### 4. PATCH /api/volunteers/:id/approve (Line 659)
**Purpose:** Approve a volunteer application (Admin only, IP-based auth)

Transaction Actions:
1. Update lead_volunteers.status = 'approved' (must be pending)
2. Demote current Lead in project_members to Member
3. Insert/upsert new Lead in project_members with project_role=Lead
4. Auto-reject other pending applications for same project
5. Bump version timestamp

Audit Logged: VOLUNTEER_APPROVE with volunteer, project, member IDs

### 5. PATCH /api/volunteers/:id/reject (Line 713)
**Purpose:** Reject a volunteer application (Admin only, IP-based auth)
**Action:** Sets status=rejected for given volunteer ID

Audit Logged: VOLUNTEER_REJECT

---

## DATABASE SCHEMA

### Table: lead_volunteers (Line 819 in server/index.js)

CREATE TABLE IF NOT EXISTS lead_volunteers (
  id         SERIAL       PRIMARY KEY,
  project_id VARCHAR(50)  NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id  VARCHAR(50)  NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  status     VARCHAR(20)  DEFAULT pending,
  note       TEXT         DEFAULT ,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

Columns:
- id: Primary key for approve/reject endpoints
- project_id: FK to projects, cascading delete
- member_id: FK to members, cascading delete
- status: pending (default), approved, rejected
- note: Volunteer application message/reason
- created_at, updated_at: Timestamps
- UNIQUE constraint: One app per member per project

### Related Tables Updated by Approve
- projects: need_lead (BOOLEAN), volunteer_deadline (TIMESTAMPTZ)
- project_members: project_role updated to Lead
- members: is_admin check for auth
- write_log: Audit trail

---

## FRONTEND CONTEXT: VolunteerContext.tsx

Location: `/d/Clients/ProjectHuman/src/context/VolunteerContext.tsx`

Context Value Methods:
1. refresh() - GET /api/volunteers, auto-polls every 10 seconds
2. apply(projectId, memberId, note?) - POST /api/volunteers, auto-refreshes on success
3. cancel(projectId, memberId) - DELETE /api/volunteers/{projectId}/{memberId}
4. approve(id) - PATCH /api/volunteers/{id}/approve (admin)
5. reject(id) - PATCH /api/volunteers/{id}/reject (admin)
6. getMyVolunteer(projectId, memberId) - finds volunteer record for user
7. getPendingCount() - counts volunteers with status=pending

Helper Methods:
- getMyVolunteer: Check if user already applied
- getPendingCount: Total pending apps across projects

---

## VOLUNTEER TYPE DEFINITION

Location: `/d/Clients/ProjectHuman/src/types/index.ts` Lines 65-78

export interface LeadVolunteer {
  id: number;
  projectId: string;
  memberId: string;
  status: pending | approved | rejected;
  note: string;
  createdAt: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
  memberRole: string;
  projectName: string;
  projectColor: string;
}

---

## VOLUNTEER WORKFLOW

User Flow:
1. View project with needLead=true and deadline not passed
2. Click "Tôi muốn làm Lead" button
3. Call apply(projectId, memberId, optionalNote)
4. Status becomes pending
5. Can cancel or wait for admin approval

Admin Flow:
1. View projects with pending applications
2. See expand/collapse button for pending volunteers
3. For each volunteer: approve (checkmark) or reject (X button)
4. Approval auto-rejects other pending volunteers for same project

---

## RANDOM/PICK LOGIC

Search Result: NO random or pick logic found

System is entirely explicit approval-based:
- No auto-selection
- No randomization
- No automatic Lead assignment
- Admin must manually approve one volunteer per project
- Only one volunteer can be approved per project (others auto-rejected)

---

## AUTHORIZATION

Approve/Reject Auth: IP-based identity lookup
- Checks user_identities table for IP
- Joins to members table to check is_admin flag
- Returns 403 if not admin

Auto Admin Set: On startup, sets is_admin=TRUE for "Trương Lê Khánh" (line 832)

---

## AUDIT LOGGING

All volunteer actions logged to write_log table:
- VOLUNTEER_APPLY: User applies (projectId, memberId)
- VOLUNTEER_CANCEL: User withdraws (projectId, memberId)
- VOLUNTEER_APPROVE: Admin approves (volunteerId, projectId, memberId)
- VOLUNTEER_REJECT: Admin rejects (volunteerId)

---

## FRONTEND COMPONENTS

ProjectsNeedingLead.tsx (Lines 90-309)
- Main volunteer UI component
- Shows projects without Lead
- Display deadline & registration status
- "Tôi muốn làm Lead" CTA button
- Admin panel: toggles pending volunteer list
- Uses: apply(), cancel(), approve(), reject(), getMyVolunteer()

LeadStats.tsx (Lines 1-316)
- Lead statistics dashboard
- Shows lead distribution
- No approve/reject UI (info only)
- Displays projects without Lead

---

## KEY OBSERVATIONS

1. Single Lead Per Project: Only one member can be Lead; approving auto-demotes previous Lead
2. Pending Auto-Reject: When one approved, all others for same project auto-rejected
3. No Random Selection: Explicit admin approval required
4. Soft Deadline: Optional volunteerDeadline; after deadline, Apply button disabled
5. IP-Based Auth: Admin check uses IP identity, not session tokens
6. Atomic Transactions: Approve uses BEGIN/COMMIT/ROLLBACK
7. Auto-Poll Frontend: Context refreshes every 10 seconds
8. Vietnamese i18n: All messages in Vietnamese

---

## SUMMARY TABLE

Component                     | Location                              | Purpose
------------------------------|---------------------------------------|------------------------------------------
Volunteer Context             | src/context/VolunteerContext.tsx      | State + API methods
Volunteer Type                | src/types/index.ts                    | TypeScript interface
UI Component                  | src/components/ProjectsNeedingLead.tsx| Member apply, admin review UI
Stats Dashboard               | src/components/LeadStats.tsx          | Lead analytics
API Endpoints                 | server/index.js:598-730               | RESTful volunteer APIs
DB Schema                     | server/index.js:819+                  | lead_volunteers table
Audit Logging                 | server/index.js:appendLog()           | Write log entries

