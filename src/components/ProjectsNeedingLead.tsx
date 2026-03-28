import type { DashboardData, Project } from '../types';
import {
  Crown, HandHeart, Loader2, X, Check,
  ChevronDown, Users, AlertTriangle, Clock,
  Info, CalendarDays, TrendingUp, Tag, DollarSign, ExternalLink,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIdentity } from '../context/IdentityContext';
import { useVolunteer } from '../context/VolunteerContext';
import { useTheme } from '../context/ThemeContext';
import { getStatusColor, getStatusLabel, getDaysRemaining, getPriorityColor, getPriorityLabel } from '../utils/dateUtils';

function isDeadlinePassed(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays >= 1) {
    return `Hạn đăng ký: ${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffHours >= 1) return `Còn ${diffHours} tiếng ${diffMins % 60} phút`;
  if (diffMins >= 1) return `Còn ${diffMins} phút`;
  return 'Sắp hết hạn!';
}

interface Props { data: DashboardData; }

export default function ProjectsNeedingLead({ data }: Props) {
  const noLeadProjects = data.projects.filter(
    p => p.status !== 'completed'
      && !p.members.some(m => m.projectRole === 'Lead')
  );
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  if (noLeadProjects.length === 0) {
    return (
      <div className="animate-slide-up">
        <SectionHeader count={0} />
        <div className="flex flex-col items-center justify-center py-16 gap-3 dark:bg-white/[0.02] bg-slate-50 rounded-2xl border dark:border-white/8 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold dark:text-slate-300 text-slate-600">Tất cả dự án đều đã có Lead! 🎉</p>
          <p className="text-xs dark:text-slate-500 text-slate-400">Không có dự án nào cần thêm Lead lúc này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <SectionHeader count={noLeadProjects.length} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {noLeadProjects.map(p => (
          <NeedLeadCard key={p.id} project={p} data={data} onShowDetail={() => setDetailProject(p)} />
        ))}
      </div>
      {detailProject && (
        <ProjectDetailModal project={detailProject} data={data} onClose={() => setDetailProject(null)} />
      )}
    </div>
  );
}

function SectionHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-2">
        <h3 className="dark:text-white text-slate-800 font-bold text-lg">Dự án cần Lead</h3>
        {count > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
            {count}
          </span>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
    </div>
  );
}

function NeedLeadCard({ project, data, onShowDetail }: { project: Project; data: DashboardData; onShowDetail: () => void }) {
  const { currentUser } = useIdentity();
  const { apply, cancel, approve, reject, getMyVolunteer, volunteers, loading } = useVolunteer();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showVols, setShowVols] = useState(false);

  const statusColor  = getStatusColor(project.status);
  const memberObjs   = project.members
    .map(pm => data.members.find(m => m.id === pm.memberId))
    .filter(Boolean) as typeof data.members;

  const myVolunteer    = currentUser ? getMyVolunteer(project.id, currentUser.memberId) : undefined;
  const deadlinePassed = isDeadlinePassed(project.volunteerDeadline);
  const volunteerOpen  = project.needLead === true && !deadlinePassed;
  const canVolunteer   = currentUser && !myVolunteer && volunteerOpen;
  const pendingVols  = volunteers.filter(v => v.projectId === project.id && v.status === 'pending');
  const currentMember = currentUser ? data.members.find(m => m.id === currentUser.memberId) : undefined;
  const isAdmin      = currentMember?.isAdmin ?? false;

  return (
    <div
      className="dark:bg-[#16162a] bg-white rounded-2xl border dark:border-white/8 border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ borderTop: `3px solid ${project.color}`, boxShadow: `0 4px 24px ${project.color}18` }}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="dark:text-white text-slate-800 font-bold text-sm leading-tight">{project.name}</h4>
              <button
                onClick={onShowDetail}
                title="Xem chi tiết dự án"
                className="p-0.5 rounded-md dark:text-slate-500 text-slate-400 dark:hover:text-blue-400 hover:text-blue-500 dark:hover:bg-blue-500/10 hover:bg-blue-50 transition-colors flex-shrink-0"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onShowDetail}
              className="text-left w-full dark:text-slate-500 text-slate-400 text-xs mt-0.5 line-clamp-2 hover:dark:text-slate-300 hover:text-slate-600 transition-colors"
              title="Nhấn để xem chi tiết"
            >
              {project.description}
            </button>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
            style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* No-lead banner + deadline */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400 font-semibold flex-1">Chưa có Lead</span>
          {pendingVols.length > 0 && (
            <span className="text-[10px] text-amber-400 font-medium">{pendingVols.length} xung phong</span>
          )}
        </div>

        {/* Deadline / volunteer status chip — LUÔN hiện trong section này */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${
          !project.needLead
            ? 'bg-slate-500/8 border border-slate-500/20'
            : deadlinePassed
              ? 'bg-slate-500/8 border border-slate-500/20'
              : project.volunteerDeadline
                ? 'bg-blue-500/8 border border-blue-500/20'
                : 'bg-emerald-500/8 border border-emerald-500/20'
        }`}>
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${
            !project.needLead ? 'text-slate-500'
            : deadlinePassed ? 'text-slate-400'
            : project.volunteerDeadline ? 'text-blue-400'
            : 'text-emerald-400'
          }`} />
          <span className={`text-xs font-medium ${
            !project.needLead ? 'text-slate-500'
            : deadlinePassed ? 'text-slate-400'
            : project.volunteerDeadline ? 'text-blue-400'
            : 'text-emerald-400'
          }`}>
            {!project.needLead
              ? 'Admin chưa mở đăng ký xung phong'
              : deadlinePassed
                ? `Hết hạn lúc ${new Date(project.volunteerDeadline!).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}`
                : !project.volunteerDeadline
                  ? 'Đang mở đăng ký — không giới hạn'
                  : formatDeadline(project.volunteerDeadline)
            }
          </span>
        </div>

        {/* Members avatars */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 flex-shrink-0" />
          <span className="text-xs dark:text-slate-500 text-slate-400 mr-1">{memberObjs.length}</span>
          <div className="flex -space-x-2">
            {memberObjs.slice(0, 6).map(m => (
              <div
                key={m.id}
                title={m.name}
                className="w-6 h-6 rounded-full overflow-hidden border-2 dark:border-[#16162a] border-white flex items-center justify-center text-white text-[9px] font-bold hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                style={{ background: m.color }}
              >
                {m.avatarUrl
                  ? <img src={`http://${window.location.hostname}:4000${m.avatarUrl}`} className="w-full h-full object-cover" alt={m.name} />
                  : m.avatar.slice(0, 2)
                }
              </div>
            ))}
            {memberObjs.length > 6 && (
              <div className="w-6 h-6 rounded-full dark:bg-white/10 bg-slate-200 border-2 dark:border-[#16162a] border-white flex items-center justify-center text-[9px] dark:text-slate-400 text-slate-500 font-bold">
                +{memberObjs.length - 6}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {!myVolunteer && canVolunteer && (
          <button
            disabled={loading}
            onClick={() => apply(project.id, currentUser!.memberId)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              boxShadow: isDark
                ? '0 4px 16px rgba(109,40,217,0.45)'
                : '0 2px 8px rgba(109,40,217,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><HandHeart className="w-4 h-4" /> Tôi muốn làm Lead</>
            }
          </button>
        )}

        {/* Deadline passed — không còn nhận đăng ký */}
        {!myVolunteer && project.needLead && deadlinePassed && (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium dark:text-slate-500 text-slate-400 dark:bg-white/5 bg-slate-100">
            <Clock className="w-3.5 h-3.5" />
            Đã hết hạn đăng ký
          </div>
        )}

        {/* My pending status */}
        {myVolunteer?.status === 'pending' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-500/8 border border-purple-500/20">
            <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
            <span className="text-xs text-purple-400 font-medium flex-1">Đang chờ admin duyệt…</span>
            <button
              onClick={() => cancel(project.id, currentUser!.memberId)}
              className="text-[10px] text-slate-400 hover:text-red-400 transition-colors underline"
            >Rút đơn</button>
          </div>
        )}
        {myVolunteer?.status === 'rejected' && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15">
            <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 flex-1">Đơn bị từ chối</span>
          </div>
        )}
      </div>

      {/* Admin: volunteer list */}
      {isAdmin && pendingVols.length > 0 && (
        <div className="border-t dark:border-white/8 border-slate-100">
          {/* Header row: toggle + raffle room link */}
          <button
            onClick={() => setShowVols(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-amber-500 dark:hover:bg-amber-500/5 hover:bg-amber-50 transition-colors"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{pendingVols.length} người xung phong chờ duyệt</span>
            <a
              href={`/raffle/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              title="Mở phòng quay số — chia sẻ link cho mọi người xem"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Phòng quay số
            </a>
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showVols ? 'rotate-180' : ''}`} />
          </button>

          {showVols && (
            <div className="px-5 pb-4 space-y-2">
              {pendingVols.map(v => (
                <div key={v.id} className="flex items-center gap-2 p-2 rounded-xl dark:bg-white/[0.03] bg-slate-50">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: v.memberColor }}
                  >
                    {v.memberAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold dark:text-white text-slate-800 truncate">{v.memberName}</div>
                    <div className="text-[10px] dark:text-slate-500 text-slate-400">{v.memberRole}</div>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => approve(v.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    title="Duyệt"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => reject(v.id)}
                    className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    title="Từ chối"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Project Detail Modal ─────────────────────────────────────────────────── */

function ProjectDetailModal({
  project, data, onClose,
}: { project: Project; data: DashboardData; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const statusColor   = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);
  const priorityLabel = getPriorityLabel(project.priority);

  // Lock body scroll khi popup mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const memberObjs = project.members
    .map(pm => {
      const m = data.members.find(d => d.id === pm.memberId);
      return m ? { ...m, projectRole: pm.projectRole } : null;
    })
    .filter(Boolean) as (typeof data.members[0] & { projectRole: string })[];

  const daysLeft = getDaysRemaining(project.endDate);
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

  // Close on Escape
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onKeyDown={handleKey}
      tabIndex={-1}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl dark:bg-[#13132a] bg-white border dark:border-white/10 border-slate-200 animate-slide-up overflow-hidden"
        style={{ borderTop: `3px solid ${project.color}` }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b dark:border-white/8 border-slate-100 flex-shrink-0"
          style={{ background: isDark ? `${project.color}0d` : `${project.color}08` }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
              >
                {getStatusLabel(project.status)}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: `${priorityColor}20`, color: priorityColor, border: `1px solid ${priorityColor}40` }}
              >
                {priorityLabel}
              </span>
            </div>
            <h3 className="text-base font-bold dark:text-white text-slate-800 leading-tight">{project.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 dark:text-slate-400 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Description */}
          <div>
            <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-1.5">Mô tả dự án</p>
            <p className="text-sm dark:text-slate-300 text-slate-600 leading-relaxed whitespace-pre-wrap">
              {project.description || <span className="italic dark:text-slate-600 text-slate-400">Chưa có mô tả.</span>}
            </p>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-white/8 bg-slate-100 dark:text-slate-300 text-slate-600 border dark:border-white/8 border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline + Deadline remaining */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl dark:bg-white/[0.04] bg-slate-50 border dark:border-white/8 border-slate-200">
              <p className="text-[10px] font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Thời gian
              </p>
              <p className="text-xs dark:text-slate-300 text-slate-600 font-medium">
                {new Date(project.startDate).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-[10px] dark:text-slate-500 text-slate-400">→ {new Date(project.endDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="p-3 rounded-xl dark:bg-white/[0.04] bg-slate-50 border dark:border-white/8 border-slate-200">
              <p className="text-[10px] font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Còn lại
              </p>
              <p className={`text-xs font-bold ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'dark:text-emerald-400 text-emerald-600'}`}>
                {daysLeft < 0 ? `Trễ ${Math.abs(daysLeft)} ngày` : `${daysLeft} ngày`}
              </p>
              <p className="text-[10px] dark:text-slate-500 text-slate-400">{daysLeft < 0 ? 'Đã quá hạn' : 'đến deadline'}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Tiến độ
              </p>
              <span className="text-xs font-bold dark:text-white text-slate-700">{project.progress}%</span>
            </div>
            <div className="h-2 rounded-full dark:bg-white/8 bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)` }}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="p-3 rounded-xl dark:bg-white/[0.04] bg-slate-50 border dark:border-white/8 border-slate-200">
            <p className="text-[10px] font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Ngân sách
            </p>
            <div className="flex items-end justify-between mb-1.5">
              <div>
                <p className="text-xs dark:text-slate-300 text-slate-600">
                  Đã dùng: <span className="font-bold">{project.spent.toLocaleString('vi-VN')}đ</span>
                </p>
                <p className="text-[10px] dark:text-slate-500 text-slate-400">
                  / Tổng: {project.budget.toLocaleString('vi-VN')}đ
                </p>
              </div>
              <span className={`text-xs font-bold ${budgetPct > 90 ? 'text-red-400' : budgetPct > 70 ? 'text-amber-400' : 'dark:text-emerald-400 text-emerald-600'}`}>
                {budgetPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full dark:bg-white/8 bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(budgetPct, 100)}%`,
                  background: budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>

          {/* Members */}
          {memberObjs.length > 0 && (
            <div>
              <p className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Thành viên ({memberObjs.length})
              </p>
              <div className="space-y-1.5">
                {memberObjs.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl dark:bg-white/[0.03] bg-slate-50">
                    <div
                      className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: m.color }}
                    >
                      {m.avatarUrl
                        ? <img src={`http://${window.location.hostname}:4000${m.avatarUrl}`} className="w-full h-full object-cover" alt={m.name} />
                        : m.avatar.slice(0, 2)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold dark:text-white text-slate-800 truncate">{m.name}</p>
                      <p className="text-[10px] dark:text-slate-500 text-slate-400">{m.role}</p>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md dark:bg-white/8 bg-slate-200 dark:text-slate-400 text-slate-500">
                      {m.projectRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer deadline */}
          {project.needLead && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Đang tuyển Lead</p>
                {project.volunteerDeadline && (
                  <p className="text-[10px] text-amber-300/70">
                    Hạn: {new Date(project.volunteerDeadline).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
