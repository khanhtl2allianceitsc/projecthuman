import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode
} from 'react';
import type { DashboardData, Member, Project } from '../types';

const API = ``;

async function apiFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `${method} ${path} failed`);
  return json;
}

interface DataContextValue {
  data: DashboardData;
  loading: boolean;
  canEdit: boolean;
  myIP: string;
  addMember:    (m: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (m: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addProject:    (p: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  uploadAvatar:   (memberId: string, file: File) => Promise<void>;
  uploadPortrait: (memberId: string, file: File) => Promise<void>;
  exportJSON: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);
const EMPTY: DashboardData = { members: [], projects: [] };

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData]       = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [myIP, setMyIP]       = useState('');
  const dataRef = useRef<DashboardData>(EMPTY);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/data'),
      apiFetch('/api/me'),
    ]).then(([d, me]) => {
      const { _updatedAt: _, ...clean } = d;
      dataRef.current = clean;
      setData(clean);
      setCanEdit(me.canEdit);
      setMyIP(me.ip);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Optimistic update + rollback on error
  function optimistic<T>(
    apply: (cur: DashboardData) => DashboardData,
    apiCall: () => Promise<T>
  ) {
    const before = dataRef.current;
    const next = apply(before);
    setData(next);
    dataRef.current = next;
    return apiCall().catch((e: Error) => {
      // Rollback
      setData(before);
      dataRef.current = before;
      console.error('[DataContext]', e.message);
      throw e;
    });
  }

  const addMember = useCallback(async (m: Omit<Member, 'id'>) => {
    const newMember: Member = { id: 'm' + Date.now(), ...m };
    await optimistic(
      cur => ({ ...cur, members: [...cur.members, newMember] }),
      () => apiFetch('/api/members', 'POST', newMember)
    );
  }, []);

  const updateMember = useCallback(async (m: Member) => {
    await optimistic(
      cur => ({ ...cur, members: cur.members.map(x => x.id === m.id ? m : x) }),
      () => apiFetch(`/api/members/${m.id}`, 'PATCH', m)
    );
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    await optimistic(
      cur => ({
        ...cur,
        members: cur.members.filter(m => m.id !== id),
        projects: cur.projects.map(p => ({
          ...p, members: p.members.filter(pm => pm.memberId !== id),
        })),
      }),
      () => apiFetch(`/api/members/${id}`, 'DELETE')
    );
  }, []);

  const addProject = useCallback(async (p: Omit<Project, 'id'>) => {
    const newProject: Project = { id: 'p' + Date.now(), ...p };
    await optimistic(
      cur => ({ ...cur, projects: [...cur.projects, newProject] }),
      () => apiFetch('/api/projects', 'POST', newProject)
    );
  }, []);

  const updateProject = useCallback(async (p: Project) => {
    await optimistic(
      cur => ({ ...cur, projects: cur.projects.map(x => x.id === p.id ? p : x) }),
      () => apiFetch(`/api/projects/${p.id}`, 'PATCH', p)
    );
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await optimistic(
      cur => ({ ...cur, projects: cur.projects.filter(p => p.id !== id) }),
      () => apiFetch(`/api/projects/${id}`, 'DELETE')
    );
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataRef.current, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const uploadAvatar = useCallback(async (memberId: string, file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${API}/api/members/${memberId}/avatar`, { method: 'POST', body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? 'Upload avatar thất bại');
    setData(cur => ({
      ...cur,
      members: cur.members.map(m => m.id === memberId ? { ...m, avatarUrl: json.avatarUrl } : m),
    }));
    dataRef.current = { ...dataRef.current, members: dataRef.current.members.map(m => m.id === memberId ? { ...m, avatarUrl: json.avatarUrl } : m) };
  }, []);

  const uploadPortrait = useCallback(async (memberId: string, file: File) => {
    const form = new FormData();
    form.append('portrait', file);
    const res = await fetch(`${API}/api/members/${memberId}/portrait`, { method: 'POST', body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? 'Upload ảnh chân dung thất bại');
    setData(cur => ({
      ...cur,
      members: cur.members.map(m => m.id === memberId ? { ...m, portraitUrl: json.portraitUrl } : m),
    }));
    dataRef.current = { ...dataRef.current, members: dataRef.current.members.map(m => m.id === memberId ? { ...m, portraitUrl: json.portraitUrl } : m) };
  }, []);

  return (
    <DataContext.Provider value={{
      data, loading, canEdit, myIP,
      addMember, updateMember, deleteMember,
      addProject, updateProject, deleteProject,
      uploadAvatar, uploadPortrait,
      exportJSON,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

