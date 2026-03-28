import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardData } from '../types';
import { getStatusLabel, getStatusColor } from '../utils/dateUtils';

interface ProjectStatusPieProps {
  data: DashboardData;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name
}: any) => {
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600/50 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
        <p className="text-white font-semibold text-sm">{payload[0].name}</p>
        <p className="text-slate-300 text-sm mt-1">
          <span className="font-bold text-white">{payload[0].value}</span> dự án
        </p>
      </div>
    );
  }
  return null;
};

export default function ProjectStatusPie({ data }: ProjectStatusPieProps) {
  const statusCounts = data.projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: getStatusLabel(status as any),
    value: count,
    color: getStatusColor(status as any),
  }));

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="mb-4">
        <h3 className="text-white font-bold text-lg">Trạng thái dự án</h3>
        <p className="text-slate-400 text-sm mt-1">Tỷ lệ theo trạng thái</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={`${entry.color}40`}
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
