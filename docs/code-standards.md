# ProjectHuman — Code Standards & Conventions

## 📝 TypeScript Conventions

### Naming
```ts
// ✅ DO:
interface Member { ... }              // PascalCase for types
type ProjectStatus = 'active' | ...   // PascalCase for types
const fetchData = async () => { ... } // camelCase for functions
const maxRetries = 3;                 // camelCase for constants

// ❌ DON'T:
interface member { ... }              // lowercase
type project_status = ...             // snake_case
const FetchData = ...                 // PascalCase for functions
```

### Strict Type Definitions
```ts
// ✅ DO:
interface DataContextValue {
  data: DashboardData;
  loading: boolean;
  canEdit: boolean;
  addMember: (m: Omit<Member, 'id'>) => Promise<void>;
}

// ❌ DON'T:
interface DataContextValue {
  data: any;        // Avoid any
  loading: boolean;
  addMember: (m: any) => Promise<void>;
}
```

### No Implicit Any
```ts
// ✅ DO:
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
const items: string[] = [];
const config: Record<string, unknown> = {};

// ❌ DON'T:
const handleClick = (e) => { ... }    // Implicit any
const items = [];                      // Inferred as any[]
```

---

## 📂 File Organization

### Component Files
```
src/components/
├── [ComponentName].tsx
│   └── Single responsibility:
│       - Import types at top
│       - Define types (if component-specific)
│       - Define component function
│       - Export as default
│
├── subfeature/
│   ├── SubfeatureA.tsx
│   └── SubfeatureB.tsx
│
└── admin/
    ├── AdminPanel.tsx
    ├── MembersTab.tsx
    └── ProjectsTab.tsx
```

### File Naming
```
// ✅ DO:
ProjectCards.tsx          // PascalCase for React components
dateUtils.ts              // camelCase for utilities
types/index.ts            // index.ts for exported interfaces
context/DataContext.tsx   // PascalCase for Context
config.json               // lowercase for config files

// ❌ DON'T:
project-cards.tsx         // kebab-case
DateUtils.ts              // PascalCase for utilities
types.ts                  // vague name
```

### Module Organization
```ts
// Component structure:
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import type { Project, Member } from '../types';
import { formatDate } from '../utils/dateUtils';
import './ComponentName.css'; // or Tailwind classes

// Type definitions
interface ComponentProps {
  title: string;
  onSave: () => Promise<void>;
}

// Component function
export default function ComponentName(props: ComponentProps) {
  // ... JSX
}
```

### Man Month Salary Tier Naming
```ts
// Man Month salary tier classification (used in PersonnelPage)
type SalaryTier = 'Master' | 'Senior' | 'Mid' | 'Junior+' | 'Junior' | 'Fresher' | 'Intern' | 'TBD';

function getMemberTier(manMonth?: number): SalaryTier {
  if (!manMonth || manMonth === 0) return 'TBD';
  if (manMonth >= 40) return 'Master';
  if (manMonth >= 25) return 'Senior';
  if (manMonth >= 15) return 'Mid';
  if (manMonth >= 10) return 'Junior+';
  if (manMonth >= 6) return 'Junior';
  if (manMonth >= 3) return 'Fresher';
  if (manMonth >= 1) return 'Intern';
  return 'TBD';
}
```

---

## 🔌 Context Patterns (Established Conventions)

### Functional Components with Hooks
```ts
// ✅ DO: Modern React patterns
export default function MyComponent() {
  const { data, loading, updateProject } = useData();
  const { currentUser } = useIdentity();
  const { volunteers, approve } = useVolunteer();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Effect logic
  }, [data, currentUser]);

  const handleSave = useCallback(async () => {
    await updateProject(newData);
  }, []);

  return <div>{/* JSX */}</div>;
}

// ❌ DON'T: Legacy class components
class MyComponent extends React.Component { ... }
```

### VolunteerContext Polling Pattern (10s Refresh)
```ts
// ✅ DO: Use VolunteerContext for lead applications
function ProjectsNeedingLeadComponent() {
  const { volunteers, loading, approve, reject } = useVolunteer();

  // Automatically polls every 10s, no manual setup needed
  return (
    <div>
      {volunteers.map(v => (
        <div key={v.id}>
          {v.memberName} applied for {v.projectName}
          <button onClick={() => approve(v.id)}>Approve</button>
          <button onClick={() => reject(v.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

### Dynamic API URL Construction
```ts
// ✅ DO: Build API URL dynamically for LAN access
const API_URL = `http://${window.location.hostname}:4000`;

async function fetchData() {
  const res = await fetch(`${API_URL}/api/data`);
  return res.json();
}

// ❌ DON'T: Hardcode localhost (breaks on LAN)
const API_URL = 'http://localhost:3001';
```

### Custom Hooks
```ts
// ✅ DO: Extract reusable logic
function useProjectFilter() {
  const [filter, setFilter] = useState('');
  const { data } = useData();

  const filtered = useMemo(
    () => data.projects.filter(p => p.name.includes(filter)),
    [data, filter]
  );

  return { filter, setFilter, filtered };
}

// Usage:
const { filter, setFilter, filtered } = useProjectFilter();
```

### Context Consumption
```ts
// ✅ DO: Use context hook
function SomeComponent() {
  const { data, canEdit, updateMember } = useData();
  // ...
}

// ❌ DON'T: Avoid Consumer pattern
<DataContext.Consumer>
  {(value) => /* ... */}
</DataContext.Consumer>
```

### Error Handling
```ts
// ✅ DO: Handle async errors
const handleSave = async () => {
  try {
    await updateProject(newData);
    // Show success message
  } catch (error) {
    console.error('Failed to save:', error);
    alert('Lỗi: ' + (error instanceof Error ? error.message : 'Unknown'));
  }
};

// ❌ DON'T: Ignore errors
const handleSave = async () => {
  await updateProject(newData);
};
```

---

## 🎨 UI/Styling Patterns

### TailwindCSS Usage
```tsx
// ✅ DO: Use classNames for readability
<div className="flex flex-col gap-4 p-6 rounded-lg bg-white dark:bg-slate-800">
  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>

// ❌ DON'T: Inline complex styles
<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ... }}>
```

### Dark Mode
```tsx
// ✅ DO: Always support dark mode
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
  {/* Content */}
</div>

// ❌ DON'T: Light mode only
<div className="bg-white text-black">
```

### Responsive Design
```tsx
// ✅ DO: Mobile-first Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// ❌ DON'T: Fixed layouts
<div style={{ display: 'flex', width: '1200px' }}>
```

---

## 🔌 API Patterns

### Fetch Wrapper
```ts
// ✅ DO: Consistent error handling
async function fetchData(): Promise<DashboardData & { _updatedAt?: number }> {
  const res = await fetch(`${API}/api/data`);
  if (!res.ok) {
    throw new Error('Không thể tải dữ liệu');
  }
  return res.json();
}

// ❌ DON'T: Ignore errors
async function fetchData() {
  const res = await fetch(`${API}/api/data`);
  return res.json();
}
```

### API Response Types
```ts
// ✅ DO: Explicit response typing
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface SaveResponse {
  ok: boolean;
  _updatedAt?: number;
  current?: DashboardData & { _updatedAt?: number };
}

// ❌ DON'T: Generic any
function pushData(data: any): Promise<any> { ... }
```

### Request/Response Headers
```ts
// ✅ DO: Content-Type header for POST
fetch(`${API}/api/data`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// ❌ DON'T: Omit headers
fetch(`${API}/api/data`, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

---

## 🗄️ Database Patterns

### Query Structure (Node.js)
```js
// ✅ DO: Parameterized queries
const result = await pool.query(
  'SELECT * FROM members WHERE id = $1',
  [memberId]
);

// ❌ DON'T: String interpolation (SQL injection risk)
const result = await pool.query(
  `SELECT * FROM members WHERE id = '${memberId}'`
);
```

### Transaction Handling
```js
// ✅ DO: Proper transaction control
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO members ...', [values]);
  await client.query('UPDATE projects ...', [values]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}

// ❌ DON'T: Forget to release client
const client = await pool.connect();
await client.query('BEGIN');
// ... missing ROLLBACK or client.release()
```

### Data Normalization
```js
// ✅ DO: Keep created_by/created_at on INSERT
await client.query(
  `INSERT INTO members (id, name, created_by_ip, created_at, updated_at)
   VALUES ($1, $2, $3, $4, $4)`,
  [id, name, ip, now]
);

// ✅ DO: Preserve created_* on UPDATE
await client.query(
  `UPDATE members SET name=$2, updated_by_ip=$3, updated_at=$4
   WHERE id=$1`,
  [id, name, ip, now]
  // Note: created_by_ip and created_at NOT updated
);

// ❌ DON'T: Overwrite creation metadata on update
await client.query(
  `UPDATE members SET name=$2, created_at=$3 WHERE id=$1`
);
```

### JSON Field Handling
```js
// ✅ DO: Explicitly stringify/parse JSON
await pool.query(
  'INSERT INTO write_log (snapshot) VALUES ($1)',
  [JSON.stringify(snapshotData)]
);

const row = await pool.query('SELECT snapshot FROM write_log ...');
const snapshot = JSON.parse(row.rows[0].snapshot);

// ❌ DON'T: Rely on implicit conversion
await pool.query('INSERT INTO write_log (snapshot) VALUES ($1)', [data]);
```

---

## ✅ Testing & Validation

### Input Validation
```ts
// ✅ DO: Validate user input
function validateProject(p: Partial<Project>): string[] {
  const errors: string[] = [];
  if (!p.name?.trim()) errors.push('Name is required');
  if (p.progress < 0 || p.progress > 100) errors.push('Progress must be 0–100');
  if (p.startDate && p.endDate && p.startDate > p.endDate) {
    errors.push('Start date must be before end date');
  }
  return errors;
}

// ❌ DON'T: Trust user input
const handleSave = (p: Project) => {
  // Save directly without validation
  updateProject(p);
};
```

### Type Guards
```ts
// ✅ DO: Use type predicates
function isMember(obj: unknown): obj is Member {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof obj.id === 'string'
  );
}

// Usage:
if (isMember(data)) {
  console.log(data.name); // Type-safe
}
```

---

## 🔐 Security Best Practices

### IP Whitelist Validation
```js
// ✅ DO: Proper IP extraction
function getClientIP(req) {
  const raw = (req.headers['x-forwarded-for'] ?? '')
    .split(',')[0]
    .trim()
    || req.socket.remoteAddress || '';
  return raw.replace(/^::ffff:/, ''); // Strip IPv6 prefix
}

function canEdit(ip) {
  const { allowedIPs } = loadConfig();
  if (!Array.isArray(allowedIPs)) return false;
  return allowedIPs.includes('*') || allowedIPs.includes(ip);
}

// ✅ DO: Check before writes
app.post('/api/data', requirePermission, ...);

// ❌ DON'T: Skip permission checks
app.post('/api/data', (req, res) => {
  // No permission check
  writeData(...);
});
```

### Stale Detection
```ts
// ✅ DO: Check _updatedAt before accepting writes
if (clientTs > 0 && clientTs < serverTs - 1000) {
  return res.status(409).json({
    error: 'Data is stale',
    current: freshData,
  });
}

// ❌ DON'T: Accept stale writes
await writeData(incoming);
```

### Audit Logging
```js
// ✅ DO: Log every write attempt
await appendLog('WRITE_OK', ip, `members:${count}`);
await appendLog('STALE_REJECTED', ip, `conflict detected`);
await appendLog('BLOCKED', ip, `IP not in whitelist`);

// ❌ DON'T: Silent failures
// ...just fail without logging
```

---

## 📋 Code Review Checklist

Before committing:

- [ ] **TypeScript**: No `any` types, all functions typed
- [ ] **Naming**: PascalCase components, camelCase functions
- [ ] **Error Handling**: try/catch on async, proper error messages
- [ ] **Security**: Parameterized queries, IP validation, logging
- [ ] **Performance**: useCallback/useMemo for expensive operations
- [ ] **Dark Mode**: All UI supports both light and dark themes
- [ ] **Accessibility**: buttons/links semantic, alt text on images
- [ ] **Comments**: Only complex logic; self-documenting code preferred
- [ ] **No Console**: Remove console.log before commit (except errors)
- [ ] **Dependencies**: No unused imports, minimal external libraries

---

## 🔗 Related Documents
- See `codebase-summary.md` for file organization
- See `system-architecture.md` for API design patterns
