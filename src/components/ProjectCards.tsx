import { useState } from 'react';
import type { DashboardData, Project } from '../types';
import {
  getDaysRemaining, formatDate,
  getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel, formatCurrency, isProjectOverdue
} from '../utils/dateUtils';
import {
  Clock, Users, TrendingUp, AlertTriangle, CheckCircle2,
  Calendar, Crown, HandHeart, Loader2, X, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { useIdentity } from '../context/IdentityContext';
import { useVolunteer } from '../context/VolunteerContext';

interface ProjectCardsProps { data: DashboardData; }

export default function ProjectCards({ data }: ProjectCardsProps) {
  return (
    <div className="animate-slide-up">
      <div className="mb-5">
        <h3 className="dark:text-white text-slate-800 font-bold text-lg">Chi tiết dự án</h3>
        <p className="dark:text-slate-400 text-slate-500 text-sm mt-1">Tiến độ, nhân sự và xung phong Lead</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.projects.map(project => (
          <ProjectCard key={project.id} project={project} data={data} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, data }: { project: Project; data: DashboardData }) {
  const { currentUser } = useIdentity();
  const { apply, cancel, approve, reject, getMyVolunteer, volunteers, loading } = useVolunteer();
  const [showVolunteers, setShowVolunteers] = useState(false);

  const daysLeft    = getDaysRemaining(project.endDate);
  const overdue     = isProjectOverdue(project);
  const leadEntry   = project.members.find(m => m.projectRole === 'Lead');
  const leadMember  = leadEntry ? data.members.find(m => m.id === leadEntry.memberId) : undefined;
  const memberObjs  = project.members
    .map(pm => ({ member: data.members.find(m => m.id === pm.memberId)!, projectRole: pm.projectRole }))
    .filter(x => x.member);
  const statusColor   = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);
  const budgetPct     = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

  // Volunteer state
  const myVolunteer   = currentUser ? getMyVolunteer(project.id, currentUser.memberId) : undefined;
  const iAmMember     = currentUser ? project.members.some(m => m.memberId === currentUser.memberId) : false;
  const iAmLead       = leadEntry?.memberId === currentUser?.memberId;
  const hasLead       = !!leadEntry;
  const deadlinePassed = project.volunteerDeadline
    ? new Date(project.volunteerDeadline) < new Date(new Date().toISOString().slice(0, 10))
    : false;
  const canVolunteer  = currentUser && !hasLead && !myVolunteer && project.needLead && !deadlinePassed;
  const pendingVols   = volunteers.filter(v => v.projectId === project.id && v.status === 'pending');
  const currentMember = currentUser ? data.members.find(m => m.id === currentUser.memberId) : undefined;
  const isAdmin       = currentMember?.isAdmin ?? false;

  return (
    <div
      className="dark:glass-card bg-white rounded-2xl p-5 border dark:border-white/8 border-slate-200 hover:dark:border-white/15 hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 cursor-default group"
      style={{ borderTop: `3px solid ${project.color}`, boxShadow: `0 4px 24px ${project.color}15` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="dark:text-white text-slate-800 font-bold text-sm leading-tight">{project.name}</h4>
          <p className="dark:text-slate-500 text-slate-400 text-xs mt-0.5 truncate">{project.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
            style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
            {getStatusLabel(project.status)}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
            style={{ background: `${priorityColor}15`, color: priorityColor }}>
            {getPriorityLabel(project.priority)}
          </span>
        </div>
      </div>

      {/* Lead section */}
      {leadMember ? (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-400/8 border border-amber-400/20">
          <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-500 font-semibold">Lead:</span>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ background: leadMember.color }}>
            {leadMember.avatar.slice(0, 2)}
          </div>
          <span className="text-xs text-amber-400 font-medium truncate">{leadMember.name}</span>
          {iAmLead && <span className="ml-auto text-[10px] text-amber-500 font-bold">Bạn</span>}
        </div>
      ) : (
        <div className="mb-3 space-y-2">
          {/* No-Lead warning + volunteer button */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 font-medium flex-1">Chưa có Lead</span>
            {canVolunteer && (
              <button
                disabled={loading}
                onClick={() => apply(project.id, currentUser!.memberId)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 2px 8px rgba(109,40,217,0.4)' }}
              >
                {loading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <><HandHeart className="w-3 h-3" /> Tôi muốn làm Lead</>
                }
              </button>
            )}
          </div>

          {/* My pending volunteer status */}
          {myVolunteer && myVolunteer.status === 'pending' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/8 border border-purple-500/20">
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
              <span className="text-xs text-purple-400 font-medium flex-1">Đang chờ duyệt…</span>
              <button
                onClick={() => cancel(project.id, currentUser!.memberId)}
                className="text-[10px] text-slate-400 hover:text-red-400 transition-colors underline"
              >Rút đơn</button>
            </div>
          )}
          {myVolunteer && myVolunteer.status === 'rejected' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15">
              <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400 flex-1">Đơn bị từ chối</span>
            </div>
          )}

          {/* Admin: pending volunteer list */}
          {isAdmin && pendingVols.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
              <button
                onClick={() => setShowVolunteers(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/8 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{pendingVols.length} người xung phong</span>
                {showVolunteers ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
              {showVolunteers && (
                <div className="px-3 pb-3 space-y-2 border-t border-amber-500/15">
                  {pendingVols.map(v => (
                    <div key={v.id} className="flex items-center gap-2 pt-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: v.memberColor }}>
                        {v.memberAvatarUrl
                          ? <img src={v.memberAvatarUrl} className="w-full h-full object-cover" alt={v.memberName} />
                          : v.memberAvatar}
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
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {project.tags.map(tag => (
          <span key={tag} className="px-1.5 py-0.5 dark:bg-white/5 bg-slate-100 dark:border-white/8 border-slate-200 border rounded text-[10px] dark:text-slate-400 text-slate-500">
            {tag}
          </span>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs dark:text-slate-400 text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Tiến độ
          </span>
          <span className="text-xs font-bold" style={{ color: project.color }}>{project.progress}%</span>
        </div>
        <div className="h-2 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%`, background: `linear-gradient(90deg,${project.color},${project.color}aa)`, boxShadow: `0 0 8px ${project.color}60` }} />
        </div>
      </div>

      {/* Budget */}
      {project.budget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs dark:text-slate-400 text-slate-500">Ngân sách</span>
            <span className="text-xs dark:text-slate-300 text-slate-600">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
          </div>
          <div className="h-1.5 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, budgetPct)}%`,
                background: budgetPct > 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                  : budgetPct > 70 ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                  : 'linear-gradient(90deg,#10b981,#059669)',
              }} />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-center gap-2 text-[11px] dark:text-slate-400 text-slate-500 mb-3 p-2.5 dark:bg-white/[0.03] bg-slate-50 rounded-lg border dark:border-white/5 border-slate-200">
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span>{formatDate(project.startDate)}</span>
        <span className="dark:text-white/20 text-slate-300">→</span>
        <span className={overdue ? 'text-red-400 font-medium' : ''}>{formatDate(project.endDate)}</span>
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {project.status === 'completed'
            ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 font-semibold">Xong</span></>
            : overdue
            ? <><AlertTriangle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400 font-semibold">{Math.abs(daysLeft)}d OD</span></>
            : <><Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-amber-400 font-semibold">{daysLeft}d</span></>
          }
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />
          <span className="text-xs dark:text-slate-500 text-slate-400">{memberObjs.length} thành viên</span>
        </div>
        <div className="flex -space-x-2">
          {memberObjs.slice(0, 5).map(({ member, projectRole }) => (
            <div
              key={member.id}
              title={`${member.name} — ${projectRole}`}
              className="relative w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] font-bold border-2 dark:border-slate-900 border-white hover:z-10 hover:scale-110 transition-transform cursor-pointer"
              style={{ background: member.color }}
            >
              {member.avatarUrl
                ? <img src={`${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                : member.avatar.slice(0, 2)
              }
              {projectRole === 'Lead' && <span className="absolute -top-1.5 -right-1.5 text-[8px]">👑</span>}
            </div>
          ))}
          {memberObjs.length > 5 && (
            <div className="w-7 h-7 rounded-full dark:bg-white/10 bg-slate-200 border-2 dark:border-slate-900 border-white flex items-center justify-center text-[10px] dark:text-slate-400 text-slate-500 font-bold">
              +{memberObjs.length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
