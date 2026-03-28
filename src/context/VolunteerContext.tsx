import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { LeadVolunteer } from '../types';

const API = `http://${window.location.hostname}:4000`;

export interface RandomPickResult {
  winnerId: string;
  winnerName: string;
  winnerAvatar: string;
  winnerColor: string;
}

interface VolunteerContextValue {
  volunteers: LeadVolunteer[];
  loading: boolean;
  refresh: () => Promise<void>;
  apply: (projectId: string, memberId: string, note?: string) => Promise<void>;
  cancel: (projectId: string, memberId: string) => Promise<void>;
  approve: (id: number) => Promise<void>;
  reject: (id: number) => Promise<void>;
  randomPick: (projectId: string) => Promise<RandomPickResult>;
  getMyVolunteer: (projectId: string, memberId: string) => LeadVolunteer | undefined;
  getPendingCount: () => number;
}

const Ctx = createContext<VolunteerContextValue>({
  volunteers: [], loading: false,
  refresh: async () => {},
  apply: async () => {},
  cancel: async () => {},
  approve: async () => {},
  reject: async () => {},
  randomPick: async () => ({ winnerId: '', winnerName: '', winnerAvatar: '', winnerColor: '' }),
  getMyVolunteer: () => undefined,
  getPendingCount: () => 0,
});

export function VolunteerProvider({ children }: { children: React.ReactNode }) {
  const [volunteers, setVolunteers] = useState<LeadVolunteer[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/volunteers`);
      const data = await r.json();
      if (Array.isArray(data)) setVolunteers(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10_000); // poll 10s
    return () => clearInterval(t);
  }, [refresh]);

  const apply = useCallback(async (projectId: string, memberId: string, note = '') => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, memberId, note }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi xung phong');
      await refresh();
    } finally { setLoading(false); }
  }, [refresh]);

  const cancel = useCallback(async (projectId: string, memberId: string) => {
    setLoading(true);
    try {
      await fetch(`${API}/api/volunteers/${projectId}/${memberId}`, { method: 'DELETE' });
      await refresh();
    } finally { setLoading(false); }
  }, [refresh]);

  const approve = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/volunteers/${id}/approve`, { method: 'PATCH' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi duyệt');
      await refresh();
    } finally { setLoading(false); }
  }, [refresh]);

  const reject = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await fetch(`${API}/api/volunteers/${id}/reject`, { method: 'PATCH' });
      await refresh();
    } finally { setLoading(false); }
  }, [refresh]);

  const randomPick = useCallback(async (projectId: string): Promise<RandomPickResult> => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/volunteers/${projectId}/random-pick`, { method: 'POST' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi quay số');
      await refresh();
      return data as RandomPickResult;
    } finally { setLoading(false); }
  }, [refresh]);

  const getMyVolunteer = useCallback((projectId: string, memberId: string) =>
    volunteers.find(v => v.projectId === projectId && v.memberId === memberId),
  [volunteers]);

  const getPendingCount = useCallback(() =>
    volunteers.filter(v => v.status === 'pending').length,
  [volunteers]);

  return (
    <Ctx.Provider value={{ volunteers, loading, refresh, apply, cancel, approve, reject, randomPick, getMyVolunteer, getPendingCount }}>
      {children}
    </Ctx.Provider>
  );
}

export const useVolunteer = () => useContext(Ctx);
