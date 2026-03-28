import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import type { DashboardData } from '../types';

interface ProjectMemberBarChartProps {
  data: DashboardData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
        <p className="text-white font-semibold text-sm mb-1">{label}</p>
        <p className="text-purple-400 text-sm">
          <span className="font-bold">{payload[0].value}</span> thành viên
        </p>
        {payload[0]?.payload?.leadName && (
          <p className="text-amber-400 text-xs mt-1">👑 Lead: {payload[0].payload.leadName}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function ProjectMemberBarChart({ data }: ProjectMemberBarChartProps) {
  const chartData = data.projects.map((project) => {
    const lead = project.members.find(m => m.projectRole === 'Lead');
    const leadMember = lead ? data.members.find(m => m.id === lead.memberId) : undefined;
    return {
      name: project.name.length > 15 ? project.name.substring(0, 13) + '…' : project.name,
      fullName: project.name,
      count: project.members.length,
      leadName: leadMember?.name.split(' ').slice(-1)[0] ?? '—',
      color: project.color,
      progress: project.progress,
      status: project.status,
    };
  });

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-5">
        <h3 className="text-white font-bold text-lg">Số thành viên theo dự án</h3>
        <p className="text-slate-400 text-sm mt-1">Phân bổ nhân lực giữa các dự án</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barSize={36} margin={{ top: 20, right: 10, left: -10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
