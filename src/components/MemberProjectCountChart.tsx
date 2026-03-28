import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { DashboardData } from '../types';

interface MemberProjectCountChartProps {
  data: DashboardData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
        <p className="text-white font-semibold text-sm mb-2">{payload[0]?.payload?.fullName}</p>
        <p className="text-slate-400 text-xs mb-1">{payload[0]?.payload?.role}</p>
        <div className="space-y-1 mt-2">
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
              <span className="text-slate-300">{p.name}:</span>
              <span className="text-white font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function MemberProjectCountChart({ data }: MemberProjectCountChartProps) {
  const chartData = data.members.map(member => {
    const memberProjects = data.projects.filter(p => p.members.some(m => m.memberId === member.id));
    const leadCount = data.projects.filter(p => p.members.some(m => m.memberId === member.id && m.projectRole === 'Lead')).length;
    return {
      name: member.name.split(' ').slice(-2).join(' '),
      fullName: member.name,
      role: member.role,
      color: member.color,
      lead: leadCount,
      active: memberProjects.filter(p => p.status === 'active').length - leadCount,
      planning: memberProjects.filter(p => p.status === 'planning').length,
      completed: memberProjects.filter(p => p.status === 'completed').length,
      total: memberProjects.length,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-5">
        <h3 className="text-white font-bold text-lg">Khối lượng công việc nhân sự</h3>
        <p className="text-slate-400 text-sm mt-1">Số dự án mỗi thành viên đang đảm nhiệm</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 80, bottom: 0 }}
          barSize={14}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="lead" name="👑 Lead" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="active" name="Đang chạy" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="planning" name="Kế hoạch" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
          <Bar dataKey="completed" name="Hoàn thành" stackId="a" fill="#475569" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-3">
        {[
          { color: '#f59e0b', label: '👑 Lead' },
          { color: '#10b981', label: 'Đang chạy' },
          { color: '#6366f1', label: 'Kế hoạch' },
          { color: '#475569', label: 'Hoàn thành' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-2 rounded-sm" style={{ background: item.color }} />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
