import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Briefcase, ArrowLeft, Users, ExternalLink, Sun, Moon, UserCircle, ImageIcon } from 'lucide-react';
import type { Member, Project } from '../types';
import { useTheme } from '../context/ThemeContext';

const API = ``;

// ─── Tier ────────────────────────────────────────────────────────────────────
interface Tier { label: string; color: string; bg: string; border: string; min: number }
const TIERS: Tier[] = [
  { label: 'Master',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)',  min: 20_000_000 },
  { label: 'Senior',    color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)',  min: 15_000_000 },
  { label: 'Mid-level', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.4)',   min: 10_000_000 },
  { label: 'Junior+',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)',  min: 7_000_000  },
  { label: 'Junior',    color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  min: 5_000_000  },
  { label: 'Fresher',   color: '#84cc16', bg: 'rgba(132,204,22,0.12)', border: 'rgba(132,204,22,0.35)', min: 4_000_000  },
  { label: 'Intern',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', min: 2_500_000  },
  { label: 'TBD',       color: '#6b7280', bg: 'rgba(107,114,128,0.10)',border: 'rgba(107,114,128,0.25)',min: 0          },
];
function getTier(mm: number | undefined): Tier {
  const v = mm ?? 0;
  return TIERS.find(t => v >= t.min) ?? TIERS[TIERS.length - 1];
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamData { members: Member[]; projects: Project[] }
type ViewMode = 'avatar' | 'portrait'

// ─── Avatar circle ───────────────────────────────────────────────────────────
function AvatarCircle({ member, size = 80 }: { member: Member; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0 select-none"
      style={{ width: size, height: size, background: member.color, fontSize: size * 0.32 }}
    >
      {member.avatarUrl && !imgErr
        ? <img
            src={`${API}${member.avatarUrl}`}
            className="w-full h-full object-cover"
            alt={member.name}
            onError={() => setImgErr(true)}
          />
        : member.avatar}
    </div>
  );
}

// ─── Member card ─────────────────────────────────────────────────────────────
function MemberCard({ member, projects, isDark, viewMode }: {
  member: Member; projects: Project[]; isDark: boolean; viewMode: ViewMode
}) {
  const [portraitErr, setPortraitErr] = useState(false);
  const tier = getTier(member.manMonth);
  const activeProjects = projects.filter(
    p => p.members.some(m => m.memberId === member.id) && p.status !== 'completed'
  );
  const leadCount = projects.filter(
    p => p.members.some(m => m.memberId === member.id && m.projectRole === 'Lead')
  ).length;

  // Theme-aware values
  const cardBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.85)';
  const cardBorder = `${member.color}${isDark ? '28' : '40'}`;
  const portraitBg = isDark
    ? 'linear-gradient(to bottom, rgba(30,30,50,0.6), rgba(10,10,26,0.9))'
    : 'linear-gradient(to bottom, rgba(240,244,255,0.8), rgba(230,235,255,0.95))';
  const overlayFrom = isDark ? '#0d0d1a' : '#f5f7ff';
  const nameColor   = isDark ? '#ffffff' : '#1e1b4b';
  const roleColor   = isDark ? '#94a3b8' : '#64748b';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const statColor   = isDark ? '#94a3b8' : '#64748b';
  const statValColor = isDark ? '#e2e8f0' : '#334155';
  const moreColor   = isDark
    ? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', color: '#64748b' }
    : { bg: 'rgba(0,0,0,0.04)',        border: 'rgba(0,0,0,0.10)',       color: '#94a3b8' };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-default"
      style={{
        background: cardBg,
        borderColor: cardBorder,
        boxShadow: isDark ? undefined : '0 2px 12px rgba(0,0,0,0.06)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${member.color}28`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)')}
    >
      {/* Color accent top bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${member.color}, ${member.color}66)` }} />

      {/* Portrait or avatar area */}
      <div
        className="relative overflow-hidden flex items-end justify-center"
        style={{
          height: viewMode === 'portrait' ? '13rem' : '8rem',
          background: portraitBg,
          transition: 'height 0.3s ease',
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${member.color} 0%, transparent 70%)` }}
        />

        {/* Portrait mode */}
        {viewMode === 'portrait' && member.portraitUrl && !portraitErr ? (
          <img
            src={`${API}${member.portraitUrl}`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            alt={member.name}
            onError={() => setPortraitErr(true)}
          />
        ) : viewMode === 'portrait' && (portraitErr || !member.portraitUrl) ? (
          /* Fallback khi không có / lỗi portrait */
          <div className="relative z-10 flex flex-col items-center gap-2 pb-4">
            <AvatarCircle member={member} size={72} />
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#475569' : '#94a3b8',
              }}
            >
              Chưa có ảnh
            </span>
          </div>
        ) : (
          /* Avatar mode */
          <div className="relative z-10 pb-4">
            <AvatarCircle member={member} size={72} />
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 z-10"
          style={{ background: `linear-gradient(to top, ${overlayFrom}, ${overlayFrom}99, transparent)` }}
        />
      </div>

      {/* Info */}
      <div className="relative z-10 px-4 pb-4 -mt-2">
        {/* Tier + Admin badges */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}
          >
            {tier.label}
          </span>
          {member.isAdmin && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500">
              Admin
            </span>
          )}
        </div>

        <h3
          className="text-base font-bold leading-tight mb-0.5 truncate"
          style={{ color: nameColor }}
        >
          {member.name}
        </h3>
        <p className="text-xs mb-3 truncate" style={{ color: roleColor }}>{member.role}</p>

        {/* Stats row */}
        <div
          className="flex items-center gap-3 pt-3"
          style={{ borderTop: `1px solid ${dividerColor}` }}
        >
          <div className="flex items-center gap-1.5" style={{ color: statColor }}>
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold" style={{ color: statValColor }}>{activeProjects.length}</span>
            <span className="text-[11px]">dự án</span>
          </div>
          {leadCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-500">
              <Crown className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{leadCount}</span>
              <span className="text-[11px]">lead</span>
            </div>
          )}
        </div>

        {/* Active project pills */}
        {activeProjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {activeProjects.slice(0, 3).map(p => (
              <span
                key={p.id}
                className="text-[10px] px-2 py-0.5 rounded-full truncate max-w-[110px]"
                style={{ background: `${p.color}18`, border: `1px solid ${p.color}35`, color: p.color }}
                title={p.name}
              >
                {p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name}
              </span>
            ))}
            {activeProjects.length > 3 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: moreColor.bg, border: `1px solid ${moreColor.border}`, color: moreColor.color }}
              >
                +{activeProjects.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('portrait');

  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/data`)
      .then(r => r.json())
      .then((d: TeamData & { _updatedAt?: number }) => {
        const { _updatedAt: _, ...rest } = d as TeamData & { _updatedAt?: number };
        void _;
        setData(rest);
      })
      .catch(() => setError(true));
  }, []);

  const totalActive = data ? data.projects.filter(p => p.status === 'active').length : 0;
  const totalLeads  = data
    ? new Set(data.projects.flatMap(p => p.members.filter(m => m.projectRole === 'Lead').map(m => m.memberId))).size
    : 0;

  // ── Theme tokens ──
  const pageBg = isDark
    ? 'linear-gradient(135deg, #0a0a16 0%, #0f0f1e 50%, #0a0f1a 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #eef2ff 100%)';
  const gridColor    = isDark ? 'rgba(139,92,246,0.5)' : 'rgba(99,102,241,0.25)';
  const headingColor = isDark ? '#ffffff' : '#1e1b4b';
  const subColor     = isDark ? '#94a3b8' : '#64748b';
  const backColor    = isDark ? '#64748b' : '#94a3b8';
  const chipBg       = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)';
  const chipBorder   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const chipText     = isDark ? '#ffffff' : '#1e293b';
  const chipSub      = isDark ? '#94a3b8' : '#64748b';
  const footerColor  = isDark ? '#334155' : '#94a3b8';
  const toggleBg     = isDark
    ? 'linear-gradient(135deg,#1e1b4b,#312e81)'
    : 'linear-gradient(135deg,#fef3c7,#fde68a)';
  const toggleBorder = isDark ? 'rgba(139,92,246,0.4)' : 'rgba(251,191,36,0.5)';
  const toggleKnobBg = isDark ? '#6d28d9' : '#f59e0b';

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: pageBg }}>
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isDark ? 0.025 : 0.04,
          backgroundImage: `linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs transition-colors mb-4 hover:text-purple-500"
              style={{ color: backColor }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://allianceitsc.com/alliance-uploads/logo.png"
                alt="Alliance"
                className="h-8 w-auto object-contain opacity-90"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: headingColor }}>
              Our{' '}
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                Team
              </span>
            </h1>
            <p className="text-sm mt-1" style={{ color: subColor }}>
              Alliance IT Service Center — Toàn bộ nhân sự
            </p>
          </div>

          {/* Right: chips + toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {data && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: chipBg, borderColor: chipBorder, backdropFilter: 'blur(8px)' }}>
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold" style={{ color: chipText }}>{data.members.length}</span>
                  <span className="text-xs" style={{ color: chipSub }}>thành viên</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: chipBg, borderColor: chipBorder, backdropFilter: 'blur(8px)' }}>
                  <Briefcase className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-bold" style={{ color: chipText }}>{totalActive}</span>
                  <span className="text-xs" style={{ color: chipSub }}>dự án active</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: chipBg, borderColor: chipBorder, backdropFilter: 'blur(8px)' }}>
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold" style={{ color: chipText }}>{totalLeads}</span>
                  <span className="text-xs" style={{ color: chipSub }}>leads</span>
                </div>
                <a
                  href={`${API}/api/data`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all hover:border-purple-500/40 hover:text-purple-500"
                  style={{ background: chipBg, borderColor: chipBorder, color: chipSub, backdropFilter: 'blur(8px)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> JSON
                </a>
              </>
            )}

            {/* ── View mode toggle ── */}
            <div
              className="flex items-center rounded-full p-0.5 border"
              style={{ background: chipBg, borderColor: chipBorder, backdropFilter: 'blur(8px)' }}
            >
              <button
                onClick={() => setViewMode('avatar')}
                title="Chế độ Avatar"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={viewMode === 'avatar'
                  ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }
                  : { color: chipSub }
                }
              >
                <UserCircle className="w-3.5 h-3.5" />
                Avatar
              </button>
              <button
                onClick={() => setViewMode('portrait')}
                title="Chế độ Ảnh chân dung"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={viewMode === 'portrait'
                  ? { background: `linear-gradient(135deg, #7c3aed, #a855f7)`, color: '#fff', boxShadow: '0 2px 8px rgba(168,85,247,0.4)' }
                  : { color: chipSub }
                }
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Portrait
              </button>
            </div>

            {/* ── Theme toggle ── */}
            <button
              onClick={toggle}
              title={isDark ? 'Light mode' : 'Dark mode'}
              className="relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer flex-shrink-0"
              style={{ background: toggleBg, borderColor: toggleBorder }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
                style={{
                  left: isDark ? '2px' : 'calc(100% - 26px)',
                  background: toggleKnobBg,
                  boxShadow: isDark ? '0 0 8px rgba(139,92,246,0.6)' : '0 0 8px rgba(245,158,11,0.6)',
                }}
              >
                {isDark
                  ? <Moon className="w-3.5 h-3.5 text-purple-100" />
                  : <Sun  className="w-3.5 h-3.5 text-amber-900" />}
              </span>
            </button>
          </div>
        </div>

        {/* ── States ── */}
        {error && (
          <div className="text-center py-24" style={{ color: chipSub }}>
            <p className="text-lg mb-1">Không thể kết nối API</p>
            <p className="text-sm">Kiểm tra lại server đang chạy tại {API}</p>
          </div>
        )}
        {!data && !error && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Grid ── */}
        {data && (
          <>
            {/* Tier legend */}
            <div className="flex flex-wrap gap-2 mb-8">
              {TIERS.filter(t => t.label !== 'TBD').map(t => (
                <span
                  key={t.label}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color }}
                >
                  {t.label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...data.members]
                .sort((a, b) => (b.manMonth ?? 0) - (a.manMonth ?? 0))
                .map(m => (
                  <MemberCard key={m.id} member={m} projects={data.projects} isDark={isDark} viewMode={viewMode} />
                ))
              }
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div
            className="h-px mb-6"
            style={{ background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.25), transparent)' }}
          />
          <p className="text-xs" style={{ color: footerColor }}>
            Alliance Project Hub • Team Directory
          </p>
        </div>
      </div>
    </div>
  );
}
