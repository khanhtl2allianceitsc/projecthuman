import type { DashboardData } from '../types';

interface MemberProjectMatrixProps {
  data: DashboardData;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Lead:         { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b50' },
  PM:           { bg: '#8b5cf620', text: '#8b5cf6', border: '#8b5cf650' },
  'Frontend Dev': { bg: '#06b6d420', text: '#06b6d4', border: '#06b6d450' },
  'Backend Dev':  { bg: '#10b98120', text: '#10b981', border: '#10b98150' },
  Designer:     { bg: '#ec489920', text: '#ec4899', border: '#ec489950' },
  QA:           { bg: '#ef444420', text: '#ef4444', border: '#ef444450' },
  DevOps:       { bg: '#f9731620', text: '#f97316', border: '#f9731650' },
  Analyst:      { bg: '#84cc1620', text: '#84cc16', border: '#84cc1650' },
  'Full Stack':  { bg: '#6366f120', text: '#6366f1', border: '#6366f150' },
  'AI Developer': { bg: '#a855f720', text: '#a855f7', border: '#a855f750' },
};

export default function MemberProjectMatrix({ data }: MemberProjectMatrixProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Ma trận Nhân sự × Dự án</h3>
          <p className="text-slate-400 text-sm mt-1">Ai làm gì ở dự án nào — 👑 là Lead</p>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
          {Object.entries(ROLE_COLORS).slice(0, 4).map(([role, style]) => (
            <span key={role} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
              {role}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr>
              <th className="text-left pb-4 pr-4 text-xs text-slate-500 font-medium uppercase tracking-wide w-36">
                Nhân sự
              </th>
              {data.projects.map(project => (
                <th key={project.id} className="pb-4 px-2 text-center" style={{ minWidth: 80 }}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: project.color }} />
                    <span className="text-xs text-slate-400 font-medium leading-tight"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 80 }}>
                      {project.name}
                    </span>
                  </div>
                </th>
              ))}
              <th className="pb-4 px-2 text-center text-xs text-slate-500 font-medium uppercase tracking-wide">
                Tổng
              </th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((member, mIdx) => {
              const memberEntries = data.projects
                .map(p => ({ project: p, entry: p.members.find(m => m.memberId === member.id) }))
                .filter(x => x.entry !== undefined);
              return (
                <tr
                  key={member.id}
                  className={`border-t border-white/5 ${mIdx % 2 === 0 ? 'bg-white/[0.01]' : ''} hover:bg-white/[0.03] transition-colors`}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: member.color }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <div className="text-white text-xs font-medium">{member.name.split(' ').slice(-1)[0]}</div>
                        <div className="text-slate-500 text-[10px]">{member.role.split(' ')[0]}</div>
                      </div>
                    </div>
                  </td>
                  {data.projects.map(project => {
                    const entry = project.members.find(m => m.memberId === member.id);
                    const isLead = entry?.projectRole === 'Lead';
                    const roleStyle = entry ? ROLE_COLORS[entry.projectRole] ?? ROLE_COLORS['Full Stack'] : null;
                    return (
                      <td key={project.id} className="py-3 px-2 text-center">
                        {entry && roleStyle ? (
                          <div
                            className="rounded-lg mx-auto flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-110 cursor-default py-1 px-1.5"
                            style={{
                              background: roleStyle.bg,
                              border: `1.5px solid ${roleStyle.border}`,
                              minWidth: 52,
                            }}
                            title={`${member.name} — ${entry.projectRole}`}
                          >
                            {isLead && <span className="text-[10px]">👑</span>}
                            <span className="text-[9px] font-bold leading-none" style={{ color: roleStyle.text }}>
                              {entry.projectRole}
                            </span>
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg mx-auto border border-white/5 bg-white/[0.02]" />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-2 text-center">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                      style={{
                        background: `${member.color}20`,
                        color: member.color,
                        border: `1.5px solid ${member.color}40`,
                      }}
                    >
                      {memberEntries.length}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10">
              <td className="pt-3 text-xs text-slate-500 font-medium">Tổng/dự án</td>
              {data.projects.map(project => (
                <td key={project.id} className="pt-3 px-2 text-center">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                    style={{
                      background: `${project.color}20`,
                      color: project.color,
                      border: `1.5px solid ${project.color}40`,
                    }}
                  >
                    {project.members.length}
                  </span>
                </td>
              ))}
              <td className="pt-3 px-2 text-center">
                <span className="text-xs text-slate-400 font-bold">
                  {data.projects.reduce((s, p) => s + p.members.length, 0)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
