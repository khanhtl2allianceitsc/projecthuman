import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import type { DashboardData } from '../types';
import { Crown, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { getStatusColor, getDaysRemaining } from '../utils/dateUtils';

const LEAD_API = `http://${window.location.hostname}:4000`;

interface LeadStatsProps {
  data: DashboardData;
}

export default function LeadStats({ data }: LeadStatsProps) {
  // Build lead-centric data
  const leadMap = data.members.map(member => {
    const leadProjects = data.projects.filter(p =>
      p.members.some(m => m.memberId === member.id && m.projectRole === 'Lead')
    );
    const activeLeads = leadProjects.filter(p => p.status === 'active');
    const completedLeads = leadProjects.filter(p => p.status === 'completed');
    const planningLeads = leadProjects.filter(p => p.status === 'planning');
    const avgProgress = leadProjects.length > 0
      ? Math.round(leadProjects.reduce((s, p) => s + p.progress, 0) / leadProjects.length)
      : 0;
    return { member, leadProjects, activeLeads, completedLeads, planningLeads, avgProgress };
  }).filter(x => x.leadProjects.length > 0).sort((a, b) => b.leadProjects.length - a.leadProjects.length);

  // Projects without lead
  const noLeadProjects = data.projects.filter(p => !p.members.some(m => m.projectRole === 'Lead'));

  // Bar chart data: lead count per person
  const barData = leadMap.map(x => ({
    name: x.member.name.split(' ').slice(-2).join(' '),
    fullName: x.member.name,
    color: x.member.color,
    active: x.activeLeads.length,
    planning: x.planningLeads.length,
    completed: x.completedLeads.length,
    avgProgress: x.avgProgress,
  }));

  // Pie: project status distribution for lead projects only
  const allLeadProjects = data.projects.filter(p => p.members.some(m => m.projectRole === 'Lead'));
  const leadStatusPie = ['active', 'completed', 'planning'].map(status => ({
    name: status === 'active' ? 'Đang chạy' : status === 'completed' ? 'Hoàn thành' : 'Kế hoạch',
    value: allLeadProjects.filter(p => p.status === status).length,
    color: getStatusColor(status as any),
  })).filter(x => x.value > 0);

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
          <p className="text-white font-semibold text-sm mb-2">{d.fullName}</p>
          <p className="text-amber-400 text-xs">👑 Lead: {d.active + d.planning + d.completed} dự án</p>
          <p className="text-slate-400 text-xs mt-1">Avg tiến độ: <span className="text-white font-bold">{d.avgProgress}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-slide-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-400/15 rounded-xl border border-amber-400/25">
          <Crown className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Lead Statistics</h2>
          <p className="text-slate-400 text-sm">Phân tích vai trò Lead — người dẫn dắt dự án</p>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <LeadKpiCard
          label="Tổng Lead assignments"
          value={allLeadProjects.length}
          sub="lượt lead"
          icon="👑"
          color="#f59e0b"
        />
        <LeadKpiCard
          label="Người giữ vai trò Lead"
          value={leadMap.length}
          sub={`/ ${data.members.length} nhân sự`}
          icon="🧑‍💼"
          color="#8b5cf6"
        />
        <LeadKpiCard
          label="Lead nhiều nhất"
          value={leadMap[0]?.member.name.split(' ').slice(-1)[0] ?? '—'}
          sub={`${leadMap[0]?.leadProjects.length ?? 0} dự án`}
          icon="🥇"
          color="#06b6d4"
        />
        <LeadKpiCard
          label="Dự án chưa có Lead"
          value={noLeadProjects.length}
          sub={noLeadProjects.length === 0 ? '✅ Đủ Lead' : 'cần assign'}
          icon={noLeadProjects.length === 0 ? '✅' : '⚠️'}
          color={noLeadProjects.length === 0 ? '#10b981' : '#ef4444'}
          alert={noLeadProjects.length > 0}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead load bar chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-white font-bold text-lg">Lead theo nhân sự</h3>
            <p className="text-slate-400 text-sm mt-1">Số dự án mỗi người đang giữ vai trò Lead</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={32} margin={{ top: 16, right: 16, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="active" name="Đang chạy" stackId="s" fill="#f59e0b" radius={[0,0,0,0]} />
              <Bar dataKey="planning" name="Kế hoạch" stackId="s" fill="#f59e0b99" radius={[0,0,0,0]} />
              <Bar dataKey="completed" name="Hoàn thành" stackId="s" fill="#f59e0b44" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-white font-bold text-lg">Trạng thái các dự án có Lead</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={leadStatusPie}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {leadStatusPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke={`${entry.color}40`} strokeWidth={2}
                    style={{ filter: `drop-shadow(0 0 6px ${entry.color}50)` }} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead per project detailed list */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Who leads what */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> Ai Lead dự án nào
          </h3>
          <div className="space-y-3">
            {leadMap.map(({ member, leadProjects }) => (
              <div key={member.id} className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: member.color, boxShadow: `0 0 10px ${member.color}40` }}
                >
                  {member.avatarUrl
                    ? <img src={`${LEAD_API}${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                    : member.avatar
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white text-sm font-medium">{member.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                      {leadProjects.length} projects
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {leadProjects.map(project => {
                      const daysLeft = getDaysRemaining(project.endDate);
                      const sc = getStatusColor(project.status);
                      return (
                        <div key={project.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: `${project.color}15`, border: `1px solid ${project.color}40` }}>
                          <span className="text-[9px]">👑</span>
                          <span style={{ color: project.color }} className="font-medium max-w-[80px] truncate">{project.name}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${sc}20`, color: sc }}>
                            {project.status === 'completed' ? 'Done' : daysLeft > 0 ? `${daysLeft}d` : 'OD'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead performance table */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> Hiệu suất Lead
          </h3>
          <div className="space-y-2">
            {leadMap.map(({ member, leadProjects, avgProgress }) => (
              <div key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: member.color }}>
                  {member.avatarUrl
                    ? <img src={`${LEAD_API}${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                    : member.avatar
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-medium truncate">{member.name.split(' ').slice(-2).join(' ')}</span>
                    <span className="text-xs font-bold" style={{ color: member.color }}>{avgProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${avgProgress}%`,
                        background: `linear-gradient(90deg, ${member.color}, ${member.color}88)`,
                        boxShadow: `0 0 6px ${member.color}50`,
                      }} />
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
                    {leadProjects.filter(p => p.status === 'active').length} active
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* No-lead projects warning */}
          {noLeadProjects.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-semibold">Dự án chưa có Lead</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {noLeadProjects.map(p => (
                  <span key={p.id} className="px-2 py-1 rounded-lg text-[11px] font-medium"
                    style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {noLeadProjects.length === 0 && (
            <div className="mt-4 p-3 rounded-xl bg-green-500/8 border border-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Tất cả dự án đều đã có Lead ✅</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LeadKpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  color: string;
  alert?: boolean;
}

function LeadKpiCard({ label, value, sub, icon, color, alert }: LeadKpiCardProps) {
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300 hover:scale-105 cursor-default"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}${alert ? '50' : '25'}`,
        boxShadow: alert ? `0 0 16px ${color}25` : 'none',
      }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-extrabold text-white leading-none">{value}</div>
      <div className="text-xs mt-1" style={{ color }}>{label}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
