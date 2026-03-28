import type { DashboardData } from '../types';
import { getDaysRemaining } from '../utils/dateUtils';
import { CheckCircle2, Crown } from 'lucide-react';

interface MemberProfilesProps {
  data: DashboardData;
}

const API = ``;

const ROLE_COLORS: Record<string, string> = {
  Lead: '#f59e0b',
  PM: '#8b5cf6',
  'Frontend Dev': '#06b6d4',
  'Backend Dev': '#10b981',
  Designer: '#ec4899',
  QA: '#ef4444',
  DevOps: '#f97316',
  Analyst: '#84cc16',
  'Full Stack': '#6366f1',
  'AI Developer': '#a855f7',
};

export default function MemberProfiles({ data }: MemberProfilesProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-5">
        <h3 className="text-white font-bold text-lg">Nhân sự & Dự án tham gia</h3>
        <p className="text-slate-400 text-sm mt-1">Vai trò từng thành viên ở mỗi dự án</p>
      </div>
      <div className="space-y-3">
        {data.members.map(member => {
          const memberEntries = data.projects
            .map(p => ({ project: p, entry: p.members.find(m => m.memberId === member.id) }))
            .filter(x => x.entry !== undefined) as { project: typeof data.projects[0]; entry: NonNullable<typeof data.projects[0]['members'][0]> }[];
          const activeCount = memberEntries.filter(x => x.project.status === 'active').length;
          const leadCount = memberEntries.filter(x => x.entry.projectRole === 'Lead').length;

          return (
            <div
              key={member.id}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${member.color}, ${member.color}99)`,
                    boxShadow: `0 4px 12px ${member.color}40`,
                  }}
                >
                  {member.avatarUrl
                    ? <img src={`${API}${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                    : member.avatar
                  }
                </div>
                {leadCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
                    title={`Lead ${leadCount} dự án`}>
                    <Crown className="w-2.5 h-2.5 text-amber-900" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-semibold text-sm">{member.name}</h4>
                    {leadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30">
                        👑 Lead ×{leadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: activeCount > 0 ? '#10b98120' : '#6b728020',
                      color: activeCount > 0 ? '#10b981' : '#6b7280',
                      border: `1px solid ${activeCount > 0 ? '#10b98140' : '#6b728040'}`,
                    }}
                  >
                    {activeCount > 0 ? `${activeCount} active` : 'Available'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-slate-500 text-xs">{member.role}</p>
                  {member.manMonth ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      💰 {new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(member.manMonth)}/tháng
                    </span>
                  ) : null}
                </div>

                {/* Projects with role badges */}
                <div className="flex flex-wrap gap-1.5">
                  {memberEntries.map(({ project, entry }) => {
                    const daysLeft = getDaysRemaining(project.endDate);
                    const isLead = entry.projectRole === 'Lead';
                    const roleColor = ROLE_COLORS[entry.projectRole] ?? '#6b7280';
                    return (
                      <div
                        key={project.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all hover:scale-105 cursor-default"
                        style={{
                          background: isLead ? `${project.color}20` : `${project.color}10`,
                          border: `1px solid ${isLead ? project.color + '60' : project.color + '30'}`,
                          boxShadow: isLead ? `0 0 8px ${project.color}25` : 'none',
                        }}
                        title={`${project.name} — ${entry.projectRole}`}
                      >
                        {isLead && <span className="text-[10px]">👑</span>}
                        <span className="max-w-[90px] truncate" style={{ color: project.color }}>
                          {project.name}
                        </span>
                        <span
                          className="px-1 py-0.5 rounded text-[9px] font-bold"
                          style={{ background: `${roleColor}20`, color: roleColor }}
                        >
                          {entry.projectRole}
                        </span>
                        {project.status !== 'completed' && (
                          <span className="text-[9px] opacity-60" style={{ color: project.color }}>
                            {daysLeft > 0 ? `${daysLeft}d` : 'OD'}
                          </span>
                        )}
                        {project.status === 'completed' && (
                          <CheckCircle2 className="w-2.5 h-2.5 opacity-60" style={{ color: project.color }} />
                        )}
                      </div>
                    );
                  })}
                  {memberEntries.length === 0 && (
                    <span className="text-slate-600 text-xs italic">Chưa có dự án</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
