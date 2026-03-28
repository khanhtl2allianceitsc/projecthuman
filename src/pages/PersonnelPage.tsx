import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, TrendingUp, DollarSign, Crown,
  BarChart2, LayoutGrid, ChevronUp, ChevronDown, Minus,
  Pencil, Check, X, List, Layers,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useIdentity } from '../context/IdentityContext';
import type { Member } from '../types';

// ─── Tier logic ──────────────────────────────────────────────────────────────
interface Tier {
  label: string;
  color: string;
  bg: string;
  border: string;
  bar: string; // gradient
  min: number;
}

const TIERS: Tier[] = [
  {
    label: 'Master',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    bar: 'linear-gradient(90deg,#d97706,#f59e0b)',
    min: 20_000_000,
  },
  {
    label: 'Senior',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.35)',
    bar: 'linear-gradient(90deg,#7c3aed,#a855f7)',
    min: 15_000_000,
  },
  {
    label: 'Mid-level',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.35)',
    bar: 'linear-gradient(90deg,#0891b2,#06b6d4)',
    min: 10_000_000,
  },
  {
    label: 'Junior+',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    bar: 'linear-gradient(90deg,#2563eb,#3b82f6)',
    min: 7_000_000,
  },
  {
    label: 'Junior',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    bar: 'linear-gradient(90deg,#059669,#10b981)',
    min: 5_000_000,
  },
  {
    label: 'Fresher',
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.10)',
    border: 'rgba(132,204,22,0.30)',
    bar: 'linear-gradient(90deg,#65a30d,#84cc16)',
    min: 4_000_000,
  },
  {
    label: 'Intern',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.30)',
    bar: 'linear-gradient(90deg,#ea580c,#fb923c)',
    min: 2_500_000,
  },
  {
    label: 'TBD',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.20)',
    bar: 'linear-gradient(90deg,#4b5563,#6b7280)',
    min: 0,
  },
];

function getTier(manMonth: number | undefined): Tier {
  const mm = manMonth ?? 0;
  for (const t of TIERS) {
    if (mm >= t.min) return t;
  }
  return TIERS[TIERS.length - 1];
}

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

// ─── Avatar component ────────────────────────────────────────────────────────
const PERSONNEL_API = `http://${window.location.hostname}:4000`;

function Avatar({ member, size = 44 }: { member: Member; size?: number }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center font-bold text-white rounded-2xl transition-transform overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${member.color}, ${member.color}99)`,
        boxShadow: `0 4px 14px ${member.color}40`,
      }}
    >
      {member.avatarUrl
        ? <img src={`${PERSONNEL_API}${member.avatarUrl}`} style={{ width: size, height: size, objectFit: 'cover' }} alt={member.name} />
        : member.avatar
      }
    </div>
  );
}

// ─── Summary stat cards ────────────────────────────────────────────────────
function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm"
      style={{ background: `${color}10`, borderColor: `${color}25` }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10"
        style={{ background: color }}
      />
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
          {icon}
        </div>
        <div>
          <p className="text-xs dark:text-slate-400 text-slate-500 mb-1">{label}</p>
          <p className="text-xl font-extrabold dark:text-white text-slate-800 leading-none">{value}</p>
          {sub && <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Tier legend ──────────────────────────────────────────────────────────
function TierLegend() {
  return (
    <div className="flex items-center flex-wrap gap-3">
      {TIERS.map(t => (
        <div
          key={t.label}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{ background: t.bg, borderColor: t.border, color: t.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
          {t.label}
          {t.min > 0
            ? <span className="opacity-60">≥ {fmtCompact(t.min)}</span>
            : <span className="opacity-60">chưa set</span>
          }
        </div>
      ))}
    </div>
  );
}

// ─── Inline edit input ────────────────────────────────────────────────────
const QUICK_VALUES = [
  { label: '2tr5', value: 2_500_000 },
  { label: '4tr',  value: 4_000_000 },
  { label: '5tr',  value: 5_000_000 },
  { label: '7tr',  value: 7_000_000 },
  { label: '10tr', value: 10_000_000 },
  { label: '15tr', value: 15_000_000 },
  { label: '20tr', value: 20_000_000 },
];

function InlineMMEdit({ value, color, onSave, onCancel }: {
  value: number;
  color: string;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value === 0 ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const commit = () => {
    const n = Number(draft.replace(/[^0-9]/g, ''));
    onSave(isNaN(n) ? 0 : n);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Quick pick chips */}
      <div className="flex flex-wrap gap-1">
        {QUICK_VALUES.map(q => (
          <button
            key={q.label}
            type="button"
            onClick={() => { setDraft(String(q.value)); inputRef.current?.focus(); }}
            className="px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all hover:scale-105"
            style={{
              background: draft === String(q.value) ? `${color}30` : `${color}10`,
              borderColor: draft === String(q.value) ? `${color}80` : `${color}30`,
              color,
            }}
          >
            {q.label}
          </button>
        ))}
      </div>
      {/* Input row */}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
          placeholder="0"
          className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm font-bold text-right border focus:outline-none focus:ring-2"
          style={{
            background: `${color}15`,
            borderColor: `${color}50`,
            color,
          }}
        />
        <button onClick={commit} className="p-1 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main bar chart row ────────────────────────────────────────────────────
function MemberRow({
  member,
  rank,
  maxMM,
  projectCount,
  leadCount,
  isAdmin,
  onSave,
}: {
  member: Member;
  rank: number;
  maxMM: number;
  projectCount: number;
  leadCount: number;
  isAdmin: boolean;
  onSave: (member: Member, newMM: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const tier = getTier(member.manMonth);
  const mm = member.manMonth ?? 0;
  const pct = maxMM > 0 ? (mm / maxMM) * 100 : 0;
  const isTop3 = rank <= 3;
  const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] group"
      style={{
        background: isTop3 ? `${tier.color}08` : 'rgba(255,255,255,0.02)',
        borderColor: isTop3 ? `${tier.color}30` : 'rgba(255,255,255,0.06)',
        boxShadow: isTop3 ? `0 0 20px ${tier.color}10` : 'none',
      }}
    >
      {/* Rank */}
      <div className="w-8 text-center text-sm font-bold dark:text-slate-500 text-slate-400 flex-shrink-0">
        {rankDisplay}
      </div>

      {/* Avatar / Portrait */}
      <div className="flex-shrink-0">
        {member.portraitUrl ? (
          <div
            className="rounded-xl overflow-hidden border dark:border-white/10 border-slate-200"
            style={{ width: 36, height: 48, boxShadow: `0 2px 8px ${member.color}30` }}
          >
            <img
              src={`${PERSONNEL_API}${member.portraitUrl}`}
              style={{ width: 36, height: 48, objectFit: 'cover', display: 'block' }}
              alt={member.name}
            />
          </div>
        ) : (
          <Avatar member={member} size={48} />
        )}
      </div>

      {/* Name + role */}
      <div className="w-44 flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold dark:text-white text-slate-800 truncate">{member.name}</p>
          {leadCount > 0 && (
            <span title={`Lead ${leadCount} dự án`}>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </span>
          )}
        </div>
        <p className="text-xs dark:text-slate-500 text-slate-400 truncate">{member.role}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
            style={{ background: tier.bg, borderColor: tier.border, color: tier.color }}
          >
            {tier.label}
          </span>
          {projectCount > 0 && (
            <span className="text-[10px] dark:text-slate-600 text-slate-400">
              {projectCount} dự án
            </span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="flex-1 min-w-0">
        <div className="relative h-7 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: mm > 0 ? `${Math.max(pct, 2)}%` : '0%',
              background: tier.bar,
              boxShadow: mm > 0 ? `0 0 12px ${tier.color}40` : 'none',
            }}
          />
          {mm === 0 && (
            <span className="absolute inset-0 flex items-center pl-3 text-xs dark:text-slate-600 text-slate-400 italic">
              Chưa thiết lập
            </span>
          )}
        </div>
      </div>

      {/* Value + edit */}
      <div className="w-64 flex items-center justify-end gap-2 flex-shrink-0">
        {editing ? (
          <InlineMMEdit
            value={mm}
            color={tier.color}
            onSave={v => { onSave(member, v); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="text-right">
              {mm > 0 ? (
                <>
                  <p className="text-sm font-extrabold" style={{ color: tier.color }}>{fmtCompact(mm)}</p>
                  <p className="text-[10px] dark:text-slate-600 text-slate-400">/ tháng</p>
                </>
              ) : (
                <Minus className="w-4 h-4 dark:text-slate-700 text-slate-300 ml-auto" />
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-slate-200 transition-all"
                title="Chỉnh sửa Man Month"
              >
                <Pencil className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────
function MemberCard({
  member,
  rank,
  projectCount,
  leadCount,
  isAdmin,
  onSave,
}: {
  member: Member;
  rank: number;
  projectCount: number;
  leadCount: number;
  isAdmin: boolean;
  onSave: (member: Member, newMM: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const tier = getTier(member.manMonth);
  const mm = member.manMonth ?? 0;
  const isTop3 = rank <= 3;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group"
      style={{
        background: isTop3 ? `${tier.color}08` : 'rgba(255,255,255,0.03)',
        borderColor: isTop3 ? `${tier.color}35` : 'rgba(255,255,255,0.08)',
        boxShadow: isTop3 ? `0 4px 24px ${tier.color}15` : 'none',
      }}
    >
      {/* Rank badge */}
      <div className="absolute top-3 right-3 text-lg leading-none">
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
          <span className="text-xs font-bold dark:text-slate-600 text-slate-400">#{rank}</span>
        )}
      </div>

      {/* Edit button (admin) */}
      {isAdmin && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg dark:hover:bg-white/10 hover:bg-slate-100 transition-all"
          title="Chỉnh sửa Man Month"
        >
          <Pencil className="w-3 h-3 dark:text-slate-500 text-slate-400" />
        </button>
      )}

      {/* Tier stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: tier.bar }}
      />

      {/* Avatar + info */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Avatar member={member} size={52} />
          {member.portraitUrl && (
            <div className="mt-1.5 w-[52px] h-[68px] rounded-xl overflow-hidden border dark:border-white/10 border-slate-200">
              <img
                src={`${PERSONNEL_API}${member.portraitUrl}`}
                className="w-full h-full object-cover"
                alt={`${member.name} chân dung`}
              />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold dark:text-white text-slate-800 truncate">{member.name}</p>
            {leadCount > 0 && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-xs dark:text-slate-400 text-slate-500 truncate">{member.role}</p>
          <div
            className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{ background: tier.bg, borderColor: tier.border, color: tier.color }}
          >
            {tier.label}
          </div>
        </div>
      </div>

      {/* Man Month value */}
      <div
        className="rounded-xl p-3 text-center"
        style={{ background: mm > 0 ? `${tier.color}10` : 'rgba(255,255,255,0.03)' }}
      >
        {editing ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <InlineMMEdit
              value={mm}
              color={tier.color}
              onSave={v => { onSave(member, v); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
            <p className="text-[10px] dark:text-slate-500 text-slate-400">VNĐ / tháng • Enter để lưu</p>
          </div>
        ) : mm > 0 ? (
          <>
            <p className="text-2xl font-extrabold" style={{ color: tier.color }}>
              {fmtCompact(mm)}
            </p>
            <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-0.5">/ tháng</p>
            <p className="text-[10px] dark:text-slate-600 text-slate-400 mt-0.5">{fmtVND(mm)}</p>
          </>
        ) : (
          <p className="text-xs dark:text-slate-600 text-slate-400 italic py-1">Chưa thiết lập</p>
        )}
      </div>

      {/* Projects count */}
      {projectCount > 0 && (
        <p className="text-[11px] dark:text-slate-600 text-slate-400 text-center -mt-1">
          Tham gia <span className="font-semibold dark:text-slate-400 text-slate-500">{projectCount}</span> dự án
        </p>
      )}
    </div>
  );
}

// ─── Man Month Bar Chart ─────────────────────────────────────────────────
function ManMonthChart({
  members,
  pcMap,
  lcMap,
}: {
  members: Member[];
  pcMap: Record<string, number>;
  lcMap: Record<string, number>;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = [...members]
    .sort((a, b) => (b.manMonth ?? 0) - (a.manMonth ?? 0))
    .map(m => {
      const tier = getTier(m.manMonth);
      const parts = m.name.trim().split(' ');
      const shortName = parts.length >= 2 ? parts.slice(-2).join(' ') : m.name;
      return {
        name: shortName,
        fullName: m.name,
        value: m.manMonth ?? 0,
        tierColor: tier.color,
        tierLabel: tier.label,
        role: m.role,
        projects: pcMap[m.id] ?? 0,
        leads: lcMap[m.id] ?? 0,
      };
    });

  const withMM = chartData.filter(d => d.value > 0);
  const avg = withMM.length > 0
    ? withMM.reduce((s, d) => s + d.value, 0) / withMM.length
    : 0;

  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  function MMTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as (typeof chartData)[0];
    const diff = avg > 0 && d.value > 0 ? d.value - avg : null;
    return (
      <div
        className="rounded-xl border shadow-2xl px-4 py-3 min-w-[160px]"
        style={{
          background: isDark ? 'rgba(15,15,30,0.97)' : 'rgba(255,255,255,0.97)',
          borderColor: d.tierColor + '55',
        }}
      >
        <p className={`font-bold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {d.fullName}
        </p>
        <p className="text-xs mb-2" style={{ color: tickColor }}>{d.role}</p>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: d.tierColor + '22', color: d.tierColor }}
        >
          {d.tierLabel}
        </span>
        {d.value > 0 ? (
          <p className="text-lg font-extrabold mt-1.5" style={{ color: d.tierColor }}>
            {fmtCompact(d.value)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ tháng</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-1 italic">Chưa thiết lập</p>
        )}
        {d.projects > 0 && (
          <p className="text-[11px] text-slate-400 mt-1">
            {d.projects} dự án{d.leads > 0 ? ` · ${d.leads} lead` : ''}
          </p>
        )}
        {diff !== null && (
          <p
            className="text-[11px] mt-1.5 border-t pt-1"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              color: diff > 0 ? '#10b981' : diff < 0 ? '#f87171' : '#94a3b8',
            }}
          >
            {diff > 0 ? `▲ +${fmtCompact(diff)}` : diff < 0 ? `▼ -${fmtCompact(Math.abs(diff))}` : '= trung bình'}
            {' '}so với TB
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Man Month theo nhân sự
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Màu sắc theo cấp bậc · đường nét đứt = trung bình
          </p>
        </div>
        {avg > 0 && (
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="w-8 border-t-2 border-dashed border-amber-400/70" />
            <span>TB: <span className="font-bold text-amber-400">{fmtCompact(avg)}</span></span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 10, bottom: 72 }}
          maxBarSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            angle={-38}
            textAnchor="end"
            interval={0}
            height={72}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v === 0 ? '' : fmtCompact(v)}
            width={52}
          />
          <Tooltip
            content={<MMTooltip />}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#f59e0b"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              strokeOpacity={0.65}
              label={{
                value: `TB ${fmtCompact(avg)}`,
                position: 'right',
                fontSize: 10,
                fill: '#f59e0b',
                fontWeight: 700,
              }}
            />
          )}
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={d.tierColor}
                fillOpacity={d.value > 0 ? 0.85 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tier legend */}
      <div
        className="flex flex-wrap items-center gap-3 mt-4 pt-4"
        style={{ borderTop: `1px solid ${gridColor}` }}
      >
        {TIERS.filter(t => chartData.some(d => d.tierLabel === t.label)).map(t => (
          <div key={t.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: t.color }} />
            <span className="text-[11px] font-semibold" style={{ color: t.color }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tier Columns View ────────────────────────────────────────────────────
function TierColumnsView({
  members,
  pcMap,
  lcMap,
}: {
  members: Member[];
  pcMap: Record<string, number>;
  lcMap: Record<string, number>;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const groups = TIERS.map(tier => ({
    tier,
    members: [...members]
      .filter(m => getTier(m.manMonth).label === tier.label)
      .sort((a, b) => (b.manMonth ?? 0) - (a.manMonth ?? 0)),
  })).filter(g => g.members.length > 0);

  const maxAvg = Math.max(
    ...groups.map(g => {
      const withMM = g.members.filter(m => (m.manMonth ?? 0) > 0);
      return withMM.length > 0
        ? withMM.reduce((s, m) => s + (m.manMonth ?? 0), 0) / withMM.length
        : 0;
    }),
    1,
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 items-start">
      {groups.map(({ tier, members: tierMembers }) => {
        const withMM = tierMembers.filter(m => (m.manMonth ?? 0) > 0);
        const totalMM = withMM.reduce((s, m) => s + (m.manMonth ?? 0), 0);
        const avgMM = withMM.length > 0 ? totalMM / withMM.length : 0;
        const barPct = maxAvg > 0 ? (avgMM / maxAvg) * 100 : 0;

        return (
          <div
            key={tier.label}
            className="flex-shrink-0 w-52 flex flex-col rounded-2xl border overflow-hidden"
            style={{
              borderColor: tier.color + '40',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)',
            }}
          >
            {/* ── Column header ── */}
            <div
              className="p-4 pb-3"
              style={{ background: tier.color + (isDark ? '1a' : '12') }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full border"
                  style={{ background: tier.bg, borderColor: tier.border, color: tier.color }}
                >
                  {tier.label}
                </span>
                <span className="text-xs font-bold" style={{ color: tier.color }}>
                  {tierMembers.length} người
                </span>
              </div>

              {/* Bar: avg MM proportional to max tier avg */}
              <div
                className="h-2 rounded-full overflow-hidden mb-2"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(barPct, 4)}%`,
                    background: tier.bar,
                    boxShadow: `0 0 8px ${tier.color}60`,
                  }}
                />
              </div>

              {avgMM > 0 ? (
                <div className="flex items-baseline justify-between">
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TB / người</span>
                  <span className="text-sm font-extrabold" style={{ color: tier.color }}>
                    {fmtCompact(avgMM)}
                  </span>
                </div>
              ) : (
                <p className={`text-[10px] italic text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Chưa thiết lập
                </p>
              )}
            </div>

            {/* ── Member list ── */}
            <div className="flex-1 p-2.5 space-y-1.5">
              {tierMembers.map(m => {
                const mm = m.manMonth ?? 0;
                const leads = lcMap[m.id] ?? 0;
                const projects = pcMap[m.id] ?? 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors hover:scale-[1.01]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <Avatar member={m} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {m.name}
                        </p>
                        {leads > 0 && <Crown className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {m.role}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] font-extrabold" style={{ color: tier.color }}>
                          {mm > 0 ? fmtCompact(mm) : '—'}
                        </span>
                        {projects > 0 && (
                          <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {projects} DA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tier group section (for grouped view) ───────────────────────────────
type SortKey = 'manMonth' | 'name' | 'projects';
type SortDir = 'asc' | 'desc';
type ViewMode = 'bar' | 'card' | 'chart' | 'tier';

export default function PersonnelPage() {
  const { theme } = useTheme();
  const { data, updateMember } = useData();
  const { currentUser } = useIdentity();
  const isDark = theme === 'dark';

  const isAdmin = !!(currentUser?.isAdmin);

  const handleSaveMM = (member: Member, newMM: number) => {
    updateMember({ ...member, manMonth: newMM });
  };

  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [sortKey, setSortKey] = useState<SortKey>('manMonth');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // project counts per member
  const projectCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    const leadMap: Record<string, number> = {};
    for (const p of data.projects) {
      for (const pm of p.members) {
        map[pm.memberId] = (map[pm.memberId] ?? 0) + 1;
        if (pm.projectRole === 'Lead') {
          leadMap[pm.memberId] = (leadMap[pm.memberId] ?? 0) + 1;
        }
      }
    }
    return { projectCountMap: map, leadCountMap: leadMap };
  }, [data.projects]);
  const { projectCountMap: pcMap, leadCountMap: lcMap } = projectCountMap;

  const sorted = useMemo(() => {
    return [...data.members].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'manMonth') diff = (a.manMonth ?? 0) - (b.manMonth ?? 0);
      else if (sortKey === 'name') diff = a.name.localeCompare(b.name, 'vi');
      else if (sortKey === 'projects') diff = (pcMap[a.id] ?? 0) - (pcMap[b.id] ?? 0);
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [data.members, sortKey, sortDir, pcMap]);

  const maxMM = useMemo(() => Math.max(...data.members.map(m => m.manMonth ?? 0), 1), [data.members]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Summary stats
  const membersWithMM = data.members.filter(m => (m.manMonth ?? 0) > 0);
  const totalBudget = data.members.reduce((s, m) => s + (m.manMonth ?? 0), 0);
  const avgMM = membersWithMM.length > 0 ? totalBudget / membersWithMM.length : 0;
  const maxMember = data.members.reduce<Member | null>((mx, m) => (!mx || (m.manMonth ?? 0) > (mx.manMonth ?? 0)) ? m : mx, null);

  // Tier distribution
  const tierDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of data.members) {
      const t = getTier(m.manMonth);
      counts[t.label] = (counts[t.label] ?? 0) + 1;
    }
    return TIERS.map(t => ({ ...t, count: counts[t.label] ?? 0 }));
  }, [data.members]);

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => setSort(k)}
        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${
          active
            ? 'dark:bg-purple-500/20 bg-purple-100 dark:border-purple-500/40 border-purple-300 dark:text-purple-300 text-purple-700'
            : 'dark:bg-white/5 bg-slate-100 dark:border-white/8 border-slate-200 dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-700'
        }`}
      >
        {label}
        {active
          ? sortDir === 'desc'
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronUp className="w-3 h-3" />
          : <Minus className="w-3 h-3 opacity-30" />
        }
      </button>
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
      {/* Grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.03 : 0.04,
          backgroundImage: isDark
            ? `linear-gradient(rgba(139,92,246,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.5) 1px,transparent 1px)`
            : `linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-24">

        {/* ── Page header ── */}
        <div className="pt-8 pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs dark:text-slate-500 text-slate-400 hover:dark:text-slate-300 hover:text-slate-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
          </Link>

          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold dark:text-white text-slate-800 tracking-tight">
                Nhân sự &{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Chi phí Man Month
                </span>
              </h1>
              <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">
                Phân tích chi phí nhân sự theo cấp bậc và tháng
              </p>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200">
              {(['bar', 'card', 'chart', 'tier'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === mode
                      ? 'dark:bg-white/15 bg-white dark:text-white text-slate-800 shadow-sm'
                      : 'dark:text-slate-500 text-slate-400'
                  }`}
                >
                  {mode === 'bar'   && <List       className="w-3.5 h-3.5" />}
                  {mode === 'card'  && <LayoutGrid className="w-3.5 h-3.5" />}
                  {mode === 'chart' && <BarChart2  className="w-3.5 h-3.5" />}
                  {mode === 'tier'  && <Layers     className="w-3.5 h-3.5" />}
                  {mode === 'bar' ? 'Bảng' : mode === 'card' ? 'Thẻ' : mode === 'chart' ? 'Biểu đồ' : 'Cấp bậc'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-8" />

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<Users className="w-4 h-4" style={{ color: '#8b5cf6' }} />}
            label="Tổng nhân sự"
            value={`${data.members.length}`}
            sub={`${membersWithMM.length} đã có Man Month`}
            color="#8b5cf6"
          />
          <SummaryCard
            icon={<DollarSign className="w-4 h-4" style={{ color: '#10b981' }} />}
            label="Tổng chi phí / tháng"
            value={totalBudget > 0 ? fmtCompact(totalBudget) : '—'}
            sub={totalBudget > 0 ? fmtVND(totalBudget) : 'Chưa thiết lập'}
            color="#10b981"
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" style={{ color: '#06b6d4' }} />}
            label="Trung bình / người"
            value={avgMM > 0 ? fmtCompact(avgMM) : '—'}
            sub={avgMM > 0 ? `${fmtVND(avgMM)} / tháng` : 'Chưa có dữ liệu'}
            color="#06b6d4"
          />
          <SummaryCard
            icon={<Crown className="w-4 h-4" style={{ color: '#f59e0b' }} />}
            label="Cao nhất"
            value={maxMember && (maxMember.manMonth ?? 0) > 0 ? fmtCompact(maxMember.manMonth!) : '—'}
            sub={maxMember && (maxMember.manMonth ?? 0) > 0 ? maxMember.name : 'Chưa có dữ liệu'}
            color="#f59e0b"
          />
        </div>

        {/* ── Tier distribution bars ── */}
        <div className="dark:bg-white/[0.03] bg-white/60 rounded-2xl border dark:border-white/8 border-slate-200 p-5 mb-6">
          <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-4">
            Phân bổ cấp bậc
          </p>
          <div className="space-y-2.5">
            {tierDist.map(t => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="w-20 text-[11px] font-bold text-right" style={{ color: t.color }}>{t.label}</div>
                <div className="flex-1 h-6 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden relative">
                  {t.count > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full flex items-center px-2"
                      style={{
                        width: `${(t.count / data.members.length) * 100}%`,
                        background: t.bar,
                        minWidth: '2rem',
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">{t.count}</span>
                    </div>
                  )}
                  {t.count === 0 && (
                    <span className="absolute inset-y-0 left-3 flex items-center text-[10px] dark:text-slate-700 text-slate-400">0</span>
                  )}
                </div>
                <div className="w-16 text-[11px] dark:text-slate-500 text-slate-400">
                  {t.min > 0 ? `≥ ${fmtCompact(t.min)}` : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar (single tab for now, easy to extend) ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold dark:bg-white/15 bg-white dark:text-white text-slate-800 shadow-sm">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              Man Month Overview
            </button>
          </div>

          {/* Sort controls — hidden in tier view (sorted by tier order) */}
          {viewMode !== 'tier' && (
            <div className="flex items-center gap-2">
              <span className="text-xs dark:text-slate-600 text-slate-400">Sắp xếp:</span>
              <SortBtn k="manMonth" label="Man Month" />
              <SortBtn k="name" label="Tên" />
              <SortBtn k="projects" label="Dự án" />
            </div>
          )}
        </div>

        {/* ── Tier legend ── */}
        <div className="mb-5">
          <TierLegend />
        </div>

        {/* ── List / Card / Chart / Tier ── */}
        {data.members.length === 0 ? (
          <div className="text-center py-20 dark:text-slate-500 text-slate-400">
            Chưa có nhân sự nào
          </div>
        ) : viewMode === 'chart' ? (
          <ManMonthChart members={sorted} pcMap={pcMap} lcMap={lcMap} />
        ) : viewMode === 'tier' ? (
          <TierColumnsView members={data.members} pcMap={pcMap} lcMap={lcMap} />
        ) : viewMode === 'bar' ? (
          <div className="space-y-2">
            {sorted.map((member, i) => (
              <MemberRow
                key={member.id}
                member={member}
                rank={i + 1}
                maxMM={maxMM}
                projectCount={pcMap[member.id] ?? 0}
                leadCount={lcMap[member.id] ?? 0}
                isAdmin={isAdmin}
                onSave={handleSaveMM}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((member, i) => (
              <MemberCard
                key={member.id}
                member={member}
                rank={i + 1}
                projectCount={pcMap[member.id] ?? 0}
                leadCount={lcMap[member.id] ?? 0}
                isAdmin={isAdmin}
                onSave={handleSaveMM}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mb-6" />
          <p className="dark:text-slate-600 text-slate-400 text-xs">
            Alliance Project Hub — Personnel Analytics
          </p>
        </div>
      </div>
    </div>
  );
}
