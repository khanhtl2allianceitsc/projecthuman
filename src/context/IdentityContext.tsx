import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode
} from 'react';
import type { Member } from '../types';

const API = ``;

export interface IdentityInfo extends Pick<Member, 'avatar' | 'name' | 'role' | 'color'> {
  memberId: string;
  isAdmin?: boolean;
}

interface IdentityContextValue {
  currentUser: IdentityInfo | null;
  identityLoading: boolean;
  setIdentity: (memberId: string) => Promise<void>;
  clearIdentity: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<IdentityInfo | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/identity`)
      .then(r => r.json())
      .then(data => setCurrentUser(data.identity ?? null))
      .catch(() => setCurrentUser(null))
      .finally(() => setIdentityLoading(false));
  }, []);

  const setIdentity = useCallback(async (memberId: string) => {
    await fetch(`${API}/api/identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    // Refresh from server để lấy đầy đủ member info
    const res = await fetch(`${API}/api/identity`);
    const data = await res.json();
    setCurrentUser(data.identity ?? null);
  }, []);

  const clearIdentity = useCallback(async () => {
    await fetch(`${API}/api/identity`, { method: 'DELETE' });
    setCurrentUser(null);
  }, []);

  return (
    <IdentityContext.Provider value={{ currentUser, identityLoading, setIdentity, clearIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
}

export const useIdentity = () => {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
};
