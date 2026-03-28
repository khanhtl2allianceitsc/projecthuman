import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, UserPlus, Check, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useIdentity } from '../context/IdentityContext';
import { useTheme } from '../context/ThemeContext';
import type { Member } from '../types';

const COLORS = [
  '#8b5cf6','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#ec4899','#f97316','#84cc16',
  '#6366f1','#14b8a6',
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
}

type Mode = 'pick' | 'add';

export default function WhoAreYouModal() {
  const { data, addMember } = useData();
  const { setIdentity } = useIdentity();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const API = ``;

  const [mode, setMode]         = useState<Mode>('pick');
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [newName, setNewName]   = useState('');
  const [newRole, setNewRole]   = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  // theme tokens
  const card   = isDark ? '#1e1e30'    : '#ffffff';
  const cardBd = isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.2)';
  const titleC = isDark ? '#ffffff'    : '#1e1b4b';
  const subC   = isDark ? '#94a3b8'    : '#64748b';
  const inputBg   = isDark ? 'rgba(255,255,255,0.07)' : '#f8f7ff';
  const inputBd   = isDark ? 'rgba(255,255,255,0.12)'  : '#ddd6fe';
  const inputC    = isDark ? '#f1f5f9'  : '#1e1b4b';
  const inputPh   = isDark ? '#64748b'  : '#a5b4fc';
  const labelC    = isDark ? '#cbd5e1'  : '#4c1d95';
  const rowBg     = isDark ? 'rgba(255,255,255,0.04)' : '#faf9ff';
  const rowBd     = isDark ? 'rgba(255,255,255,0.08)' : '#ede9fe';
  const rowNameC  = isDark ? '#f1f5f9'  : '#1e1b4b';
  const rowRoleC  = isDark ? '#94a3b8'  : '#7c3aed';
  const tabInactBg = isDark ? 'rgba(255,255,255,0.06)' : '#f3f0ff';
  const tabInactC  = isDark ? '#94a3b8' : '#7c3aed';
  const emptyC     = isDark ? '#94a3b8' : '#a78bfa';
  const previewBg  = isDark ? 'rgba(255,255,255,0.05)' : '#f5f3ff';
  const previewBd  = isDark ? 'rgba(255,255,255,0.1)'  : '#ddd6fe';

  const filtered = data.members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = useCallback(async (member: Member) => {
    setPickedId(member.id);
    setSaving(true);
    try { await setIdentity(member.id); }
    finally { setSaving(false); setPickedId(null); }
  }, [setIdentity]);

  const handleAddNew = useCallback(async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const tempMember: Omit<Member, 'id'> = {
        name: newName.trim(),
        role: newRole.trim() || 'Member',
        color: newColor,
        avatar: initials(newName.trim()),
      };
      await addMember(tempMember);
      const res = await fetch(`/api/data`);
      const freshData = await res.json();
      const added = (freshData.members as Member[]).find(
        m => m.name === tempMember.name && m.role === tempMember.role
      );
      if (added) await setIdentity(added.id);
    } finally { setSaving(false); }
  }, [newName, newRole, newColor, addMember, setIdentity]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(99,102,241,0.12)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{
          background: card,
          border: `1px solid ${cardBd}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)'
            : '0 24px 80px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="px-8 pt-8 pb-6 text-center relative overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, rgba(139,92,246,0.15) 0%, transparent 60%)'
              : 'linear-gradient(160deg, #ede9fe 0%, #f5f3ff 60%)',
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.1)', filter: 'blur(24px)' }} />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.1)', filter: 'blur(20px)' }} />

          <img
            src="https://allianceitsc.com/alliance-uploads/logo.png"
            alt="Alliance"
            className="h-12 w-auto mx-auto mb-5 object-contain relative z-10"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <h2 className="text-2xl font-extrabold tracking-tight relative z-10" style={{ color: titleC }}>
            Xin chào! 👋
          </h2>
          <p className="text-sm mt-1.5 relative z-10" style={{ color: subC }}>
            Bạn là ai? Chọn hoặc thêm tên để tiếp tục
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="flex gap-2 px-6 pt-5 pb-3">
          {(['pick', 'add'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={mode === m
                ? { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }
                : { background: tabInactBg, color: tabInactC }
              }
            >
              {m === 'pick' ? '👤  Chọn từ danh sách' : '✨  Thêm người mới'}
            </button>
          ))}
        </div>

        {/* ── Pick tab ───────────────────────────────────── */}
        {mode === 'pick' ? (
          <div className="px-6 pb-7">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: inputPh }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc vai trò…"
                style={{ background: inputBg, borderColor: inputBd, color: inputC }}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none transition-all"
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBd; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <style>{`input::placeholder { color: ${inputPh}; }`}</style>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-center text-sm py-8 font-medium" style={{ color: emptyC }}>
                  Không tìm thấy — thêm mới nhé ✨
                </p>
              )}
              {filtered.map(member => {
                const isActive = pickedId === member.id;
                return (
                  <button
                    key={member.id}
                    disabled={saving}
                    onClick={() => handlePick(member)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left group hover:scale-[1.01]"
                    style={{
                      background: isActive ? `${member.color}18` : rowBg,
                      borderColor: isActive ? `${member.color}70` : rowBd,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.borderColor = `${member.color}60`;
                        (e.currentTarget as HTMLElement).style.background = `${member.color}10`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.borderColor = rowBd;
                        (e.currentTarget as HTMLElement).style.background = rowBg;
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md transition-transform group-hover:scale-105"
                      style={{ background: member.color }}
                    >
                      {isActive && saving
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : member.avatarUrl
                          ? <img src={`${API}${member.avatarUrl}`} className="w-full h-full object-cover" alt={member.name} />
                          : member.avatar
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: rowNameC }}>{member.name}</div>
                      <div className="text-xs font-medium truncate" style={{ color: rowRoleC }}>{member.role}</div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
                      style={{ color: isActive ? member.color : (isDark ? '#64748b' : '#a78bfa') }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Add tab ─────────────────────────────────── */
          <div className="px-6 pb-7 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wide" style={{ color: labelC }}>
                Tên của bạn *
              </label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{ background: inputBg, borderColor: inputBd, color: inputC }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all"
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBd; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-bold mb-1.5 block uppercase tracking-wide" style={{ color: labelC }}>
                Vai trò
              </label>
              <input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Frontend Dev, PM, Designer…"
                style={{ background: inputBg, borderColor: inputBd, color: inputC }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all"
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = inputBd; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="text-xs font-bold mb-2 block uppercase tracking-wide" style={{ color: labelC }}>
                Màu đại diện
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    style={{
                      background: c,
                      boxShadow: newColor === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                      transform: newColor === c ? 'scale(1.15)' : undefined,
                    }}
                  >
                    {newColor === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {newName && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: previewBg, borderColor: previewBd }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0"
                  style={{ background: newColor, boxShadow: `0 4px 12px ${newColor}60` }}
                >
                  {initials(newName)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: rowNameC }}>{newName}</div>
                  <div className="text-xs font-medium" style={{ color: rowRoleC }}>{newRole || 'Member'}</div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              disabled={!newName.trim() || saving}
              onClick={handleAddNew}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                boxShadow: newName.trim() ? '0 6px 20px rgba(109,40,217,0.4)' : 'none',
              }}
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Thêm &amp; Đăng nhập</>
              }
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
