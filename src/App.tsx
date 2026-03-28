import './index.css';
import { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import { IdentityProvider, useIdentity } from './context/IdentityContext';
import { VolunteerProvider } from './context/VolunteerContext';
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
import WhoAreYouModal from './components/WhoAreYouModal';
import ProjectsNeedingLead from './components/ProjectsNeedingLead';

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

function Dashboard() {
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

      {/* Who are you? — hiện khi chưa có identity */}
      {!currentUser && <WhoAreYouModal />}

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 pb-24">
        <Header data={data} />

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
  return (
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
}

