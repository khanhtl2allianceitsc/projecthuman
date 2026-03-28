import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import type { DashboardData } from '../types';

interface MemberWorkloadRadarProps {
  data: DashboardData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-bold">{p.value} dự án</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MemberWorkloadRadar({ data }: MemberWorkloadRadarProps) {
  // Each member's project count per type (active, planning, completed)
  const radarData = data.members.map(member => {
    const memberProjects = data.projects.filter(p => p.members.some(m => m.memberId === member.id));
    return {
      member: member.avatar,
      fullName: member.name,
      'Đang chạy': memberProjects.filter(p => p.status === 'active').length,
      'Lên kế hoạch': memberProjects.filter(p => p.status === 'planning').length,
      'Hoàn thành': memberProjects.filter(p => p.status === 'completed').length,
    };
  });

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-5">
        <h3 className="text-white font-bold text-lg">Phân bổ công việc nhân sự</h3>
        <p className="text-slate-400 text-sm mt-1">Số dự án mỗi thành viên tham gia theo trạng thái</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="member"
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 4]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Đang chạy"
            dataKey="Đang chạy"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Lên kế hoạch"
            dataKey="Lên kế hoạch"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Hoàn thành"
            dataKey="Hoàn thành"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
