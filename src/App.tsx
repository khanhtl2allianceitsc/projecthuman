import './index.css';
import { useState, useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import { IdentityProvider, useIdentity } from './context/IdentityContext';
import { VolunteerProvider } from './context/VolunteerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import PersonnelPage from './pages/PersonnelPage';
import TeamPage from './pages/TeamPage';
import RafflePage from './pages/RafflePage';
import type { DashboardData } from './types';
import Header from './components/Header';
import GanttChart from './components/GanttChart';
import ProjectMemberBarChart from './components/ProjectMemberBarChart';
import MemberProjectMatrix from './components/MemberProjectMatrix';
import ProjectStatusPie from './components/ProjectStatusPie';
import MemberProfiles from './components/MemberProfiles';
import LeadStats from './components/LeadStats';
import WanIdentityModal from './components/WanIdentityModal';
import ProjectsNeedingLead from './components/ProjectsNeedingLead';
import { Shield, Lock, Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = '1023397775782-32jvd8eolkhr7m7famrgtqc1mv9209ch.apps.googleusercontent.com';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mt-10 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/40 dark:via-white/10 to-transparent" />
      <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

function FilterBar({ myOnly, onToggle, disabled }: { myOnly: boolean; onToggle: () => void; disabled: boolean }) {
  if (disabled) return null;
  return (
    <div className="flex items-center gap-3 mt-6 mb-1">
      <div className="flex items-center gap-1 p-1 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200">
        <button
          onClick={() => myOnly && onToggle()}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            !myOnly
              ? 'bg-white dark:bg-white/15 dark:text-white text-slate-800 shadow-sm'
              : 'dark:text-slate-500 text-slate-400 hover:dark:text-slate-300 hover:text-slate-600'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => !myOnly && onToggle()}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            myOnly
              ? 'text-white shadow-sm'
              : 'dark:text-slate-500 text-slate-400 hover:dark:text-slate-300 hover:text-slate-600'
          }`}
          style={myOnly ? { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' } : {}}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          Của tôi
        </button>
      </div>
      {myOnly && (
        <span className="text-xs dark:text-slate-500 text-slate-400">
          Chỉ hiển thị dự án có sự xuất hiện của bạn
        </span>
      )}
    </div>
  );
}

function Dashboard({ loggedInUser, onLogout }: { loggedInUser?: { name: string; picture: string; email: string }; onLogout?: () => void }) {
  const { theme } = useTheme();
  const { data, loading } = useData();
  const { currentUser, identityLoading } = useIdentity();
  const isDark = theme === 'dark';
  const [myOnly, setMyOnly] = useState(false);

  const filteredData: DashboardData = useMemo(() => {
    if (!myOnly || !currentUser) return data;
    const myProjects = data.projects.filter(p =>
      p.members.some(m => m.memberId === currentUser.memberId)
    );
    const myMemberIds = new Set(myProjects.flatMap(p => p.members.map(m => m.memberId)));
    return {
      projects: myProjects,
      members: data.members.filter(m => myMemberIds.has(m.id)),
    };
  }, [data, myOnly, currentUser]);

  if (loading || identityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: isDark ? '#0f0f1a' : '#f8fafc' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm dark:text-slate-400 text-slate-500">Đang tải dữ liệu…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0a0a16 0%, #0f0f1e 50%, #0a0f1a 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #eef2ff 100%)',
      }}
    >
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isDark ? 0.03 : 0.04,
          backgroundImage: isDark
            ? `linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)`
            : `linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 pb-24">
        <Header data={data} />

        {/* WAN user info bar */}
        {loggedInUser && (
          <div className="flex items-center justify-between gap-3 mt-3 px-4 py-2 rounded-xl dark:bg-white/[0.03] bg-slate-50 border dark:border-white/8 border-slate-200">
            <div className="flex items-center gap-2">
              <img src={loggedInUser.picture} className="w-6 h-6 rounded-full" alt={loggedInUser.name} />
              <span className="text-xs dark:text-slate-400 text-slate-500">
                Đăng nhập: <span className="font-semibold dark:text-slate-200 text-slate-700">{loggedInUser.name}</span>
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Đăng xuất
            </button>
          </div>
        )}

        <FilterBar myOnly={myOnly} onToggle={() => setMyOnly(v => !v)} disabled={!currentUser} />

        {filteredData.projects.length > 0 && (
          <>
            <SectionDivider label="Timeline & Deadline" />
            <GanttChart data={filteredData} />
          </>
        )}

        {filteredData.projects.length > 0 && (
          <>
            <SectionDivider label="Lead Statistics" />
            <LeadStats data={filteredData} />
          </>
        )}

        <SectionDivider label="Dự án cần Lead" />
        <div id="section-need-lead">
          <ProjectsNeedingLead data={filteredData} />
        </div>

        {filteredData.projects.length > 0 && (
          <>
            <SectionDivider label="Project Overview" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><ProjectMemberBarChart data={filteredData} /></div>
              <div><ProjectStatusPie data={filteredData} /></div>
            </div>
          </>
        )}

        {filteredData.projects.length > 0 && (
          <>
            <SectionDivider label="Personnel × Projects" />
            <MemberProjectMatrix data={filteredData} />
          </>
        )}

        {filteredData.members.length > 0 && (
          <>
            <SectionDivider label="Nhân sự" />
            <MemberProfiles data={filteredData} />
          </>
        )}

        <div className="mt-12 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mb-6" />
          <p className="dark:text-slate-600 text-slate-400 text-xs">
            Alliance Project Hub • {isDark ? '🌙 Dark' : '☀️ Light'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLan, setIsLan] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.json())
      .then(d => {
        // ?wan=1 → force WAN mode để test login
        const forceWan = new URLSearchParams(window.location.search).get('wan') === '1';
        setIsLan(forceWan ? false : d.isLan);
      })
      .catch(() => setIsLan(false));
  }, []);

  // Đang check network
  if (isLan === null) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a]">
      <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
    </div>
  );

  // LAN — full access
  if (isLan) return (
    <ThemeProvider>
      <DataProvider>
        <IdentityProvider>
          <VolunteerProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personnel" element={<PersonnelPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/raffle/:projectId" element={<RafflePage />} />
            </Routes>
          </VolunteerProvider>
        </IdentityProvider>
      </DataProvider>
    </ThemeProvider>
  );

  // WAN — cần đăng nhập Google
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WanGate />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function WanGate() {
  const { user, login, logout, loading } = useAuth();
  const [linkedMemberId, setLinkedMemberId] = useState<string | null | undefined>(undefined);
  const [members, setMembers] = useState<import('./types').Member[]>([]);
  const [showIdentity, setShowIdentity] = useState(false);

  // Sau khi login → kiểm tra email đã link member chưa
  useEffect(() => {
    if (!user) { setLinkedMemberId(undefined); return; }
    fetch(`/api/members/by-email?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => {
        setLinkedMemberId(d.memberId ?? null);
        if (!d.memberId) {
          // Chưa link → fetch danh sách members để chọn
          fetch('/api/data').then(r => r.json()).then(data => setMembers(data.members));
          setShowIdentity(true);
        }
      })
      .catch(() => setLinkedMemberId(null));
  }, [user]);

  const handleLinkIdentity = async (memberId: string) => {
    await fetch(`/api/members/${memberId}/link-email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user!.email }),
    });
    setLinkedMemberId(memberId);
    setShowIdentity(false);
  };

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    try { await login(credentialResponse.credential); }
    catch { alert('Đăng nhập thất bại. Vui lòng thử lại.'); }
  };

  if (loading || (user && linkedMemberId === undefined)) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a]">
      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
    </div>
  );

  if (user) return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <DataProvider>
          <IdentityProvider initialMemberId={linkedMemberId ?? undefined}>
            <VolunteerProvider>
              <>
                {showIdentity && members.length > 0 && (
                  <WanIdentityModal
                    members={members}
                    googleName={user.name}
                    googleEmail={user.email}
                    onSelect={handleLinkIdentity}
                  />
                )}
                <Routes>
                  <Route path="/" element={<Dashboard loggedInUser={user} onLogout={logout} />} />
                  <Route path="/personnel" element={<PersonnelPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/raffle/:projectId" element={<RafflePage />} />
                </Routes>
              </>
            </VolunteerProvider>
          </IdentityProvider>
        </DataProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d1a] p-4">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-purple-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-white font-bold text-xl">Alliance Project Hub</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hệ thống nội bộ — đăng nhập bằng tài khoản Google để tiếp tục
          </p>
        </div>
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => alert('Đăng nhập thất bại')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signin_with"
          />
        </div>
        <p className="text-slate-600 text-xs">Alliance Project Hub • Internal</p>
      </div>
    </div>
  );
}

