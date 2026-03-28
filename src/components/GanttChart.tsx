import { parseISO, differenceInDays, startOfDay } from 'date-fns';
import type { DashboardData, Project } from '../types';
import { formatDate, getDaysRemaining, getStatusColor, getStatusLabel } from '../utils/dateUtils';
import { Clock, AlertTriangle, CheckCircle2, CalendarDays, EyeOff } from 'lucide-react';

interface GanttChartProps {
  data: DashboardData;
}

export default function GanttChart({ data }: GanttChartProps) {
  const today = startOfDay(new Date());

  // Chỉ hiển thị dự án đang hoạt động hoặc đang lên kế hoạch
  const activeProjects = data.projects.filter(
    p => p.status === 'active' || p.status === 'planning'
  );
  const hiddenCount = data.projects.length - activeProjects.length;

  if (activeProjects.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-slide-up">
        <Header hiddenCount={hiddenCount} />
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <EyeOff className="w-8 h-8 text-slate-500" />
          <p className="text-sm text-slate-400">Không có dự án nào đang hoạt động</p>
        </div>
      </div>
    );
  }

  // minDate / maxDate tính trên activeProjects
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);
  const allStarts = activeProjects.map(p => parseISO(p.startDate));
  const allEnds   = activeProjects.map(p => parseISO(p.endDate));
  const earliestStart = new Date(Math.min(...allStarts.map(d => d.getTime())));
  const minDate = new Date(Math.max(earliestStart.getTime(), thirtyDaysAgo.getTime()));
  const sixtyDaysLater = new Date(today); sixtyDaysLater.setDate(today.getDate() + 60);
  const latestEnd = new Date(Math.max(...allEnds.map(d => d.getTime())));
  const maxDate = new Date(Math.min(latestEnd.getTime(), sixtyDaysLater.getTime()));
  const totalDays = differenceInDays(maxDate, minDate);

  const todayOffset = ((differenceInDays(today, minDate) / totalDays) * 100).toFixed(2);

  // Month markers
  const months: { label: string; left: number }[] = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    const left = (differenceInDays(cursor, minDate) / totalDays) * 100;
    months.push({
      label: cursor.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
      left,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <Header hiddenCount={hiddenCount} />

      <div className="relative">
        {/* Month headers */}
        <div className="relative h-6 mb-2 border-b border-white/5">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-slate-500 transform -translate-x-1/2"
              style={{ left: `${m.left}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Today line */}
        <div
          className="absolute top-6 bottom-0 w-px z-20 pointer-events-none"
          style={{ left: `${todayOffset}%` }}
        >
          <div className="w-full h-full bg-amber-400/70" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
        </div>

        {/* Project bars */}
        <div className="space-y-3 pt-2">
          {activeProjects.map((project) => {
            const startOffset = (differenceInDays(parseISO(project.startDate), minDate) / totalDays) * 100;
            const duration = (differenceInDays(parseISO(project.endDate), parseISO(project.startDate)) / totalDays) * 100;
            const daysLeft = getDaysRemaining(project.endDate);
            const isOverdue = daysLeft < 0 && project.status !== 'completed';

            return (
              <GanttRow
                key={project.id}
                project={project}
                startOffset={startOffset}
                duration={duration}
                daysLeft={daysLeft}
                isOverdue={isOverdue}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4">
        {[
          { color: '#10b981', label: 'Đang chạy' },
          { color: '#f59e0b', label: 'Lên kế hoạch' },
          { color: '#ef4444', label: 'Quá hạn' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <EyeOff className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-600">
              Ẩn {hiddenCount} dự án (hoàn thành / tạm dừng)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ hiddenCount }: { hiddenCount: number }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h3 className="text-white font-bold text-lg">Timeline Dự án (Gantt)</h3>
        <p className="text-slate-400 text-sm mt-1">Chỉ hiển thị dự án đang hoạt động &amp; lên kế hoạch</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-400 inline-block" />
          Hôm nay
        </span>
      </div>
    </div>
  );
}

interface GanttRowProps {
  project: Project;
  startOffset: number;
  duration: number;
  daysLeft: number;
  isOverdue: boolean;
}

function GanttRow({ project, startOffset, duration, daysLeft, isOverdue }: GanttRowProps) {
  const statusColor = getStatusColor(project.status);

  return (
    <div className="flex items-center gap-3 group">
      {/* Project name */}
      <div className="w-44 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />
          <span className="text-xs text-slate-300 truncate font-medium group-hover:text-white transition-colors">
            {project.name}
          </span>
        </div>
      </div>

      {/* Bar area */}
      <div className="flex-1 relative h-8">
        {/* Track */}
        <div className="absolute inset-0 bg-white/[0.03] rounded-lg border border-white/[0.05]" />

        {/* Bar */}
        <div
          className="absolute top-1 h-6 rounded-md gantt-bar cursor-pointer"
          style={{
            left: `${Math.max(0, startOffset)}%`,
            width: `${Math.min(100 - Math.max(0, startOffset), duration)}%`,
            background: `linear-gradient(90deg, ${project.color}cc, ${project.color}88)`,
            border: `1px solid ${project.color}60`,
            boxShadow: `0 0 12px ${project.color}30`,
          }}
        >
          {/* Progress fill */}
          <div
            className="h-full rounded-md opacity-60"
            style={{
              width: `${project.progress}%`,
              background: `${project.color}`,
            }}
          />
          {/* Progress label */}
          {duration > 10 && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
              {project.progress}%
            </span>
          )}
        </div>
      </div>

      {/* Right info */}
      <div className="w-36 flex-shrink-0 flex items-center justify-end gap-2">
        {project.status === 'completed' ? (
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Xong</span>
          </div>
        ) : isOverdue ? (
          <div className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{Math.abs(daysLeft)}d quá hạn</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {daysLeft < 30
                ? <span className="text-amber-400 font-medium">{daysLeft}d</span>
                : <span>{Math.floor(daysLeft / 30)}th {daysLeft % 30}d</span>
              }
            </span>
          </div>
        )}
        <div
          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: `${statusColor}20`, color: statusColor }}
        >
          {formatDate(project.endDate).slice(3)}
        </div>
      </div>
    </div>
  );
}
