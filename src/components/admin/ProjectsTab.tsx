import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Project, ProjectMember, ProjectRoleType } from '../../types';
import { useData } from '../../context/DataContext';
import { useIdentity } from '../../context/IdentityContext';
import { useVolunteer } from '../../context/VolunteerContext';
import { X, Trash2, Edit2, FolderPlus, ChevronDown, ChevronUp, Search, Crown, Check, Loader2 } from 'lucide-react';
import AuditBadge from '../AuditBadge';
import FormModal from './FormModal';

const PROJECT_ROLES: ProjectRoleType[] = [
  'Lead','PM','Frontend Dev','Backend Dev',
  'Designer','QA','DevOps','Analyst','Full Stack','AI Developer',
];

const STATUS_OPTIONS = ['active','planning','completed','paused'] as const;
const PRIORITY_OPTIONS = ['low','medium','high','critical'] as const;

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang chạy', planning: 'Lên kế hoạch', completed: 'Hoàn thành', paused: 'Tạm dừng',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Khẩn cấp',
};

const PRESET_COLORS = [
  '#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#ec4899','#f97316','#84cc16',
  '#6366f1','#14b8a6','#e879f9','#3b82f6',
];

type FormState = Omit<Project, 'id'>;

const DEFAULT_FORM: FormState = {
  name: '', description: '', status: 'planning', priority: 'medium',
  color: PRESET_COLORS[0], startDate: '', endDate: '',
  members: [], progress: 0, budget: 0, spent: 0, tags: [],
  needLead: false, volunteerDeadline: '',
};

interface ProjectFormProps {
  initial?: Project;
  onClose: () => void;
}

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ProjectForm({ initial, onClose }: ProjectFormProps) {
  const { data, addProject, updateProject } = useData();
  const { currentUser } = useIdentity();
  const { volunteers, approve, reject, loading: volLoading } = useVolunteer();
  const [form, setForm] = useState<FormState>(
    initial
      ? { ...initial, volunteerDeadline: toDatetimeLocal(initial.volunteerDeadline) }
      : { ...DEFAULT_FORM, startDate: new Date().toISOString().slice(0,10) }
  );
  const [tagInput, setTagInput] = useState('');

  // Auto-resize description textarea
  const descRef = useRef<HTMLTextAreaElement>(null);
  const resizeDesc = useCallback(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => { resizeDesc(); }, [form.description, resizeDesc]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const addMemberToProject = (memberId: string) => {
    if (form.members.some(m => m.memberId === memberId)) return;
    set('members', [...form.members, { memberId, projectRole: 'Frontend Dev' }]);
  };

  const removeMemberFromProject = (memberId: string) =>
    set('members', form.members.filter(m => m.memberId !== memberId));

  const updateMemberRole = (memberId: string, projectRole: ProjectRoleType) =>
    set('members', form.members.map(m => m.memberId === memberId ? { ...m, projectRole } : m));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); setTagInput(''); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert volunteerDeadline từ local time → UTC ISO trước khi lưu
    const toSave = {
      ...form,
      volunteerDeadline: form.volunteerDeadline
        ? new Date(form.volunteerDeadline).toISOString()
        : '',
    };
    if (initial) updateProject({ ...toSave, id: initial.id });
    else addProject(toSave);
    onClose();
  };

  const availableMembers = data.members.filter(m => !form.members.some(pm => pm.memberId === m.id));

  const currentMember = currentUser ? data.members.find(m => m.id === currentUser.memberId) : undefined;
  const isAdmin = currentMember?.isAdmin ?? false;
  const pendingVols = initial
    ? volunteers.filter(v => v.projectId === initial.id && v.status === 'pending')
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name & Description */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Tên dự án *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="VD: Mobile App v2"
            className="input-field" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold dark:text-slate-300 text-slate-600">Mô tả</label>
            <span className={`text-[10px] tabular-nums ${
              form.description.length > 400
                ? 'text-red-400'
                : form.description.length > 250
                  ? 'text-amber-400'
                  : 'dark:text-slate-600 text-slate-400'
            }`}>
              {form.description.length} ký tự
            </span>
          </div>
          <textarea
            ref={descRef}
            value={form.description}
            onChange={e => { set('description', e.target.value); resizeDesc(); }}
            placeholder="Mô tả chi tiết về dự án: mục tiêu, phạm vi, công nghệ sử dụng..."
            className="input-field resize-none leading-relaxed"
            style={{ minHeight: '80px', overflow: 'hidden' }}
          />
        </div>
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Trạng thái</label>
          <select value={form.status} onChange={e => set('status', e.target.value as any)} className="input-field">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Ưu tiên</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value as any)} className="input-field">
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Ngày bắt đầu *</label>
          <input required type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
            className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Deadline *</label>
          <input required type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
            className="input-field" />
        </div>
      </div>

      {/* Progress */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">
          Tiến độ: <span className="font-bold" style={{ color: form.color }}>{form.progress}%</span>
        </label>
        <input type="range" min={0} max={100} value={form.progress}
          onChange={e => set('progress', Number(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer" />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Ngân sách (VND)</label>
          <input type="number" min={0} value={form.budget || ''} onChange={e => set('budget', Number(e.target.value))}
            placeholder="VD: 500000000" className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Đã chi (VND)</label>
          <input type="number" min={0} value={form.spent || ''} onChange={e => set('spent', Number(e.target.value))}
            placeholder="VD: 250000000" className="input-field" />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Màu dự án</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }} />
          ))}
          <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
            className="w-6 h-6 rounded-full cursor-pointer border-0 p-0" title="Tuỳ chỉnh" />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Tech tags</label>
        <div className="flex gap-2 mb-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="VD: React (Enter để thêm)"
            className="input-field flex-1 text-xs" />
          <button type="button" onClick={addTag}
            className="px-3 py-1.5 rounded-xl text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors">
            + Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {form.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs dark:bg-white/8 bg-slate-100 dark:text-slate-300 text-slate-600 border dark:border-white/10 border-slate-200">
              {tag}
              <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}>
                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Members */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-2">Nhân sự dự án</label>

        {/* Assigned */}
        {form.members.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.members.map(pm => {
              const member = data.members.find(m => m.id === pm.memberId);
              if (!member) return null;
              return (
                <div key={pm.memberId} className="flex items-center gap-2 p-2 rounded-xl dark:bg-white/5 bg-slate-50 border dark:border-white/8 border-slate-200">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: member.color }}>
                    {member.avatar}
                  </div>
                  <span className="text-xs font-medium dark:text-white text-slate-800 flex-1 truncate">{member.name}</span>
                  <select value={pm.projectRole}
                    onChange={e => updateMemberRole(pm.memberId, e.target.value as ProjectRoleType)}
                    className="text-xs px-2 py-1 rounded-lg dark:bg-slate-800 bg-white border dark:border-white/10 border-slate-200 dark:text-slate-300 text-slate-600 focus:outline-none">
                    {PROJECT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="button" onClick={() => removeMemberFromProject(pm.memberId)}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add member */}
        {availableMembers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableMembers.map(m => (
              <button key={m.id} type="button" onClick={() => addMemberToProject(m.id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-slate-300 text-slate-600 hover:dark:bg-white/10 hover:bg-slate-200 transition-colors">
                <div className="w-4 h-4 rounded-full" style={{ background: m.color }} />
                <span>+ {m.name.split(' ').slice(-1)[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Lead fields — chỉ hiện khi chưa có Lead */}
      {!form.members.some(m => m.projectRole === 'Lead') && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-400">Xung phong Lead</span>
          </div>

          {/* Toggle needLead */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => set('needLead', !form.needLead)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                form.needLead ? 'bg-amber-500' : 'dark:bg-white/15 bg-slate-200'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                form.needLead ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-xs dark:text-slate-300 text-slate-600">
              Mở đăng ký xung phong Lead cho dự án này
            </span>
          </label>

          {/* Deadline — chỉ hiện khi needLead = true */}
          {form.needLead && (
            <div>
              <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">
                Thời hạn xung phong
                <span className="ml-1 font-normal dark:text-slate-500 text-slate-400">(để trống = không giới hạn)</span>
              </label>
              <input
                type="datetime-local"
                value={form.volunteerDeadline ?? ''}
                onChange={e => set('volunteerDeadline', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="input-field"
              />
              {form.volunteerDeadline && (
                <button
                  type="button"
                  onClick={() => set('volunteerDeadline', '')}
                  className="mt-1 text-[10px] text-slate-400 hover:text-red-400 transition-colors underline"
                >
                  Xoá thời hạn
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Volunteer Lead section — chỉ admin + edit + có pending */}
      {isAdmin && initial && pendingVols.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/20">
            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-400">
              {pendingVols.length} người xung phong làm Lead
            </span>
          </div>
          <div className="p-3 space-y-2">
            {pendingVols.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl dark:bg-white/[0.03] bg-white border dark:border-white/8 border-amber-500/15">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: v.memberColor }}
                >
                  {v.memberAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold dark:text-white text-slate-800 truncate">{v.memberName}</div>
                  <div className="text-[10px] dark:text-slate-500 text-slate-400">{v.memberRole}</div>
                  {v.note && (
                    <div className="text-[10px] dark:text-slate-400 text-slate-500 italic mt-0.5">"{v.note}"</div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    disabled={volLoading}
                    onClick={() => approve(v.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    {volLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={volLoading}
                    onClick={() => reject(v.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-xl text-sm dark:text-slate-400 text-slate-500 dark:bg-white/5 bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
          Huỷ
        </button>
        <button type="submit"
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors">
          {initial ? 'Lưu thay đổi' : 'Tạo dự án'}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsTab() {
  const { data, deleteProject } = useData();
  const [editing, setEditing] = useState<Project | null | 'new'>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.projects.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterPriority && p.priority !== filterPriority) return false;
      return true;
    });
  }, [data.projects, search, filterStatus, filterPriority]);

  const hasFilter = search || filterStatus || filterPriority;

  const getStatusColor = (s: string) => ({
    active: '#10b981', completed: '#6366f1', planning: '#f59e0b', paused: '#ef4444'
  }[s] ?? '#6b7280');

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs dark:text-slate-400 text-slate-500">
          {filtered.length !== data.projects.length
            ? <><span className="font-semibold dark:text-white text-slate-700">{filtered.length}</span> / {data.projects.length} dự án</>
            : <>{data.projects.length} dự án</>
          }
        </p>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors">
          <FolderPlus className="w-3.5 h-3.5" /> Thêm dự án
        </button>
      </div>

      {/* Filter row */}
      <div className="flex gap-2 mb-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, mô tả dự án…"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200 dark:text-white text-slate-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>

        {/* Status dropdown */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="py-2 px-2.5 rounded-xl text-xs dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200 dark:text-slate-300 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer dark:[&>option]:bg-slate-800"
        >
          <option value="">Tất cả TT</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        {/* Priority dropdown */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="py-2 px-2.5 rounded-xl text-xs dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200 dark:text-slate-300 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer dark:[&>option]:bg-slate-800"
        >
          <option value="">Tất cả UT</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>

        {/* Clear all */}
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}
            className="px-2.5 py-2 rounded-xl text-xs dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-500 border dark:border-red-500/20 border-red-200 hover:dark:bg-red-500/20 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            Xoá lọc
          </button>
        )}
      </div>

      {/* Modal form */}
      {editing !== null && (
        <FormModal
          title={editing === 'new' ? '➕ Dự án mới' : `✏️ ${(editing as Project).name}`}
          onClose={() => setEditing(null)}
        >
          <ProjectForm initial={editing === 'new' ? undefined : editing as Project} onClose={() => setEditing(null)} />
        </FormModal>
      )}

      {/* Project list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 dark:text-slate-500 text-slate-400 text-sm">
            {hasFilter
              ? <>Không tìm thấy dự án phù hợp — <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }} className="underline dark:text-purple-400 text-purple-600">xoá bộ lọc</button></>
              : 'Chưa có dự án nào'
            }
          </div>
        )}
        {filtered.map(project => {
          const sc = getStatusColor(project.status);
          const leadEntry = project.members.find(m => m.projectRole === 'Lead');
          const leadMember = leadEntry ? data.members.find(m => m.id === leadEntry.memberId) : undefined;
          const isOpen = expanded === project.id;

          return (
            <div key={project.id}
              className="rounded-xl border dark:border-white/8 border-slate-200 dark:bg-white/[0.02] bg-white overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: project.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-white text-slate-800 truncate">{project.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${sc}20`, color: sc }}>{STATUS_LABELS[project.status]}</span>
                  </div>
                  <div className="text-xs dark:text-slate-500 text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{project.members.length} người</span>
                    {leadMember && <span>· 👑 {leadMember.name.split(' ').slice(-1)[0]}</span>}
                    <span>· {project.progress}%</span>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={() => setEditing(project)}
                    className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-slate-100 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />
                  </button>
                  <button onClick={() => {
                    if (confirm(`Xoá dự án "${project.name}"?`)) deleteProject(project.id);
                  }} className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                  <button onClick={() => setExpanded(isOpen ? null : project.id)}
                    className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-slate-100 transition-colors">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />
                             : <ChevronDown className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* Expanded members + audit */}
              {isOpen && (
                <div className="px-3 pb-3 border-t dark:border-white/5 border-slate-100 pt-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {project.members.map(pm => {
                      const m = data.members.find(x => x.id === pm.memberId);
                      if (!m) return null;
                      return (
                        <div key={pm.memberId} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
                          style={{ background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color }}>
                          {pm.projectRole === 'Lead' && '👑'}
                          <span>{m.name.split(' ').slice(-1)[0]}</span>
                          <span className="opacity-60">· {pm.projectRole}</span>
                        </div>
                      );
                    })}
                    {project.members.length === 0 && (
                      <span className="text-xs dark:text-slate-600 text-slate-400 italic">Chưa có thành viên</span>
                    )}
                  </div>
                  <AuditBadge
                    createdByIp={project.createdByIp}
                    createdAt={project.createdAt}
                    updatedByIp={project.updatedByIp}
                    updatedAt={project.updatedAt}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
