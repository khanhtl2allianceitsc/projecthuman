import { useState, useMemo, useRef } from 'react';
import type { Member } from '../../types';
import { useData } from '../../context/DataContext';
import { Edit2, Trash2, UserPlus, Search, X, Upload, ImageIcon } from 'lucide-react';
import AuditBadge from '../AuditBadge';
import FormModal from './FormModal';

const API = `http://${window.location.hostname}:4000`;

const PRESET_COLORS = [
  '#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#ec4899','#f97316','#84cc16',
  '#6366f1','#14b8a6','#e879f9','#fb923c',
];

const ROLES = [
  'Full Stack Developer','Frontend Developer','Backend Developer',
  'UI/UX Designer','Project Manager','DevOps Engineer',
  'QA Engineer','Data Analyst','Mobile Developer','Tech Lead',
  'AI Developer',
];

interface MemberFormProps {
  initial?: Member;
  onClose: () => void;
}

export function MemberForm({ initial, onClose }: MemberFormProps) {
  const { addMember, updateMember, uploadAvatar, uploadPortrait } = useData();
  const [form, setForm] = useState({
    name:     initial?.name     ?? '',
    role:     initial?.role     ?? ROLES[0],
    color:    initial?.color    ?? PRESET_COLORS[0],
    avatar:   initial?.avatar   ?? '',
    manMonth: initial?.manMonth ?? 0,
  });
  const [uploading, setUploading] = useState<'avatar' | 'portrait' | null>(null);
  const avatarInputRef   = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 3).map(w => w[0].toUpperCase()).join('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const avatar = form.avatar || initials(form.name);
    if (initial) {
      updateMember({ ...initial, ...form, avatar, manMonth: form.manMonth });
    } else {
      addMember({ ...form, avatar, manMonth: form.manMonth });
    }
    onClose();
  };

  const handleUpload = async (type: 'avatar' | 'portrait', file: File | null | undefined) => {
    if (!file || !initial) return;
    setUploading(type);
    try {
      if (type === 'avatar')   await uploadAvatar(initial.id, file);
      if (type === 'portrait') await uploadPortrait(initial.id, file);
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Họ tên *</label>
        <input
          required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="VD: Nguyễn Văn A"
          className="w-full px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-white text-slate-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Chức danh *</label>
        <select
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:[&>option]:bg-slate-800"
        >
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Avatar initials override */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">
          Chữ viết tắt (để trống sẽ tự tạo)
        </label>
        <input
          value={form.avatar}
          onChange={e => setForm(f => ({ ...f, avatar: e.target.value.toUpperCase().slice(0, 3) }))}
          placeholder={initials(form.name) || 'VD: NVA'}
          maxLength={3}
          className="w-full px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-white text-slate-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Man Month */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">
          Man Month (VNĐ/tháng)
        </label>
        <div className="relative">
          <input
            type="number"
            min={0}
            max={50000000}
            step="any"
            value={form.manMonth}
            onChange={e => setForm(f => ({ ...f, manMonth: Math.max(0, Number(e.target.value)) }))}
            placeholder="VD: 20000000"
            className="w-full px-3 py-2 rounded-xl text-sm dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-white text-slate-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {form.manMonth > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs dark:text-slate-400 text-slate-500 pointer-events-none">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(form.manMonth)}
            </span>
          )}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">Màu đại diện</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ background: c, boxShadow: form.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none' }}
            />
          ))}
          <input
            type="color" value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 overflow-hidden"
            title="Tuỳ chỉnh màu"
          />
        </div>
        {/* Preview */}
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: form.color }}>
            {initial?.avatarUrl
              ? <img src={`${API}${initial.avatarUrl}`} className="w-full h-full object-cover" alt={form.name} />
              : form.avatar || initials(form.name) || '?'
            }
          </div>
          <div>
            <div className="text-sm font-semibold dark:text-white text-slate-800">{form.name || 'Tên nhân sự'}</div>
            <div className="text-xs dark:text-slate-400 text-slate-500">{form.role}</div>
          </div>
        </div>
      </div>

      {/* Image Upload — chỉ hiện khi đang edit member đã tồn tại */}
      {initial && (
        <div className="space-y-3 pt-1">
          <div className="border-t dark:border-white/8 border-slate-200 pt-3">
            <p className="text-xs font-semibold dark:text-slate-300 text-slate-600 mb-3">Ảnh nhân sự</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Avatar upload */}
              <div>
                <label className="block text-[11px] dark:text-slate-400 text-slate-500 mb-1.5 font-medium">
                  Avatar <span className="text-slate-500">(tối đa 5MB)</span>
                </label>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-dashed dark:border-white/15 border-slate-200 hover:dark:border-purple-400/50 hover:border-purple-400 transition-colors group"
                  style={{ height: 88 }}
                >
                  {initial.avatarUrl ? (
                    <img src={`${API}${initial.avatarUrl}`} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: form.color }}>
                        {form.avatar || initials(form.name) || '?'}
                      </div>
                      <span className="text-[10px] dark:text-slate-500 text-slate-400">Chưa có ảnh</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading === 'avatar'
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-5 h-5 text-white" />
                    }
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleUpload('avatar', e.target.files?.[0])} />
              </div>

              {/* Portrait upload */}
              <div>
                <label className="block text-[11px] dark:text-slate-400 text-slate-500 mb-1.5 font-medium">
                  Ảnh chân dung <span className="text-slate-500">(tối đa 10MB)</span>
                </label>
                <div
                  onClick={() => portraitInputRef.current?.click()}
                  className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-dashed dark:border-white/15 border-slate-200 hover:dark:border-purple-400/50 hover:border-purple-400 transition-colors group"
                  style={{ height: 88 }}
                >
                  {initial.portraitUrl ? (
                    <img src={`${API}${initial.portraitUrl}`} className="w-full h-full object-cover" alt="portrait" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="w-7 h-7 dark:text-slate-600 text-slate-300" />
                      <span className="text-[10px] dark:text-slate-500 text-slate-400">Chưa có ảnh</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading === 'portrait'
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-5 h-5 text-white" />
                    }
                  </div>
                </div>
                <input ref={portraitInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleUpload('portrait', e.target.files?.[0])} />
              </div>
            </div>
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
          {initial ? 'Lưu thay đổi' : 'Thêm nhân sự'}
        </button>
      </div>
    </form>
  );
}

export default function MembersTab() {
  const { data, deleteMember } = useData();
  const [editing, setEditing] = useState<Member | null | 'new'>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.members;
    return data.members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  }, [data.members, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs dark:text-slate-400 text-slate-500">
          {filtered.length !== data.members.length
            ? <><span className="font-semibold dark:text-white text-slate-700">{filtered.length}</span> / {data.members.length} thành viên</>
            : <>{data.members.length} thành viên</>
          }
        </p>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Thêm
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, chức danh…"
          className="w-full pl-9 pr-8 py-2 rounded-xl text-xs dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200 dark:text-white text-slate-800 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 hover:text-red-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Modal form */}
      {editing !== null && (
        <FormModal
          title={editing === 'new' ? '➕ Thêm nhân sự mới' : `✏️ ${(editing as Member).name}`}
          onClose={() => setEditing(null)}
        >
          <MemberForm initial={editing === 'new' ? undefined : editing as Member} onClose={() => setEditing(null)} />
        </FormModal>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 dark:text-slate-500 text-slate-400 text-sm">
            Không tìm thấy kết quả cho "<span className="font-medium dark:text-slate-300 text-slate-600">{search}</span>"
          </div>
        )}
        {filtered.map(member => {
          const projectCount = data.projects.filter((p: import('../../types').Project) => p.members.some((m: import('../../types').ProjectMember) => m.memberId === member.id)).length;
          const leadCount = data.projects.filter((p: import('../../types').Project) => p.members.some((m: import('../../types').ProjectMember) => m.memberId === member.id && m.projectRole === 'Lead')).length;
          return (
            <div key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/[0.03] bg-white border dark:border-white/5 border-slate-100 hover:dark:bg-white/[0.06] hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: member.color }}>
                {member.avatarUrl
                  ? <img src={`${API}${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                  : member.avatar
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium dark:text-white text-slate-800 truncate">{member.name}</span>
                  {leadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-500 font-bold">👑×{leadCount}</span>
                  )}
                </div>
                <span className="text-xs dark:text-slate-500 text-slate-400">{member.role} · {projectCount} dự án</span>
                <AuditBadge
                  createdByIp={member.createdByIp}
                  createdAt={member.createdAt}
                  updatedByIp={member.updatedByIp}
                  updatedAt={member.updatedAt}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditing(member)}
                  className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-slate-100 transition-colors">
                  <Edit2 className="w-3.5 h-3.5 dark:text-slate-400 text-slate-500" />
                </button>
                <button onClick={() => {
                  if (confirm(`Xoá ${member.name}? Người này sẽ bị xoá khỏi tất cả dự án.`))
                    deleteMember(member.id);
                }}
                  className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
