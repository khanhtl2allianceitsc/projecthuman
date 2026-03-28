import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, Sparkles } from 'lucide-react';
import type { Member } from '../types';

interface Props {
  members: Member[];
  googleName: string;
  googleEmail: string;
  onSelect: (memberId: string) => Promise<void>;
}

/** Normalize tên: bỏ dấu, lowercase, chỉ giữ chữ cái */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/** Score độ giống nhau giữa tên Google và tên member */
function matchScore(googleName: string, googleEmail: string, memberName: string): number {
  const gName  = normalize(googleName);
  const gEmail = normalize(googleEmail.split('@')[0]); // phần trước @
  const mName  = normalize(memberName);

  let score = 0;

  // Tên member có trong email không?
  const nameParts = mName.replace(/\s+/g, '').split('');
  if (gEmail.includes(mName.replace(/\s+/g, ''))) score += 10;

  // Từng từ trong tên Google khớp với tên member
  const gWords = gName.split(/\s+/);
  const mWords = mName.split(/\s+/);
  for (const gw of gWords) {
    if (mWords.some(mw => mw === gw)) score += 3;
    else if (mWords.some(mw => mw.includes(gw) || gw.includes(mw))) score += 1;
  }

  // Email chứa từng từ của tên member
  for (const mw of mWords) {
    if (mw.length > 1 && gEmail.includes(mw)) score += 2;
  }

  return score;
}

export default function WanIdentityModal({ members, googleName, googleEmail, onSelect }: Props) {
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);

  const scored = useMemo(() =>
    members
      .map(m => ({ ...m, score: matchScore(googleName, googleEmail, m.name) }))
      .sort((a, b) => b.score - a.score),
    [members, googleName, googleEmail]
  );

  const topScore = scored[0]?.score ?? 0;
  const suggested = scored.filter(m => m.score > 0 && m.score >= topScore * 0.6);

  const filtered = search.trim()
    ? scored.filter(m => normalize(m.name).includes(normalize(search)) || m.name.toLowerCase().includes(search.toLowerCase()))
    : scored;

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try { await onSelect(selected); } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl dark:bg-[#13132a] bg-white border dark:border-white/10 border-slate-200 shadow-2xl animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b dark:border-white/8 border-slate-100">
          <h3 className="font-bold dark:text-white text-slate-800 text-base">Bạn là ai? 👋</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
            Đăng nhập với <span className="font-medium dark:text-slate-200 text-slate-700">{googleEmail}</span>
          </p>
        </div>

        {/* Suggested */}
        {suggested.length > 0 && !search && (
          <div className="px-5 pt-4">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Có thể là bạn
            </p>
            <div className="space-y-1.5">
              {suggested.slice(0, 3).map(m => (
                <MemberRow key={m.id} member={m} selected={selected === m.id} onSelect={setSelected} highlight />
              ))}
            </div>
            <div className="my-3 h-px dark:bg-white/8 bg-slate-100" />
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/8 border-slate-200">
            <Search className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên..."
              className="flex-1 bg-transparent text-xs dark:text-white text-slate-800 outline-none placeholder:dark:text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="px-5 pb-2 max-h-56 overflow-y-auto space-y-1">
          {filtered.map(m => (
            suggested.some(s => s.id === m.id) && !search ? null :
            <MemberRow key={m.id} member={m} selected={selected === m.id} onSelect={setSelected} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t dark:border-white/8 border-slate-100">
          <button
            disabled={!selected || saving}
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
          >
            {saving ? 'Đang lưu…' : 'Xác nhận — Đây là tôi!'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MemberRow({ member, selected, onSelect, highlight }: {
  member: Member & { score?: number };
  selected: boolean;
  onSelect: (id: string) => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(member.id)}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
        selected
          ? 'dark:bg-purple-500/20 bg-purple-50 border dark:border-purple-500/40 border-purple-200'
          : highlight
            ? 'dark:bg-amber-500/8 bg-amber-50 border dark:border-amber-500/20 border-amber-100 hover:dark:bg-amber-500/15'
            : 'dark:hover:bg-white/5 hover:bg-slate-50 border border-transparent'
      }`}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold"
        style={{ background: member.color }}
      >
        {member.avatarUrl
          ? <img src={`http://${window.location.hostname}:4000${member.avatarUrl}`} className="w-full h-full object-cover" alt="" />
          : member.avatar.slice(0, 2)
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold dark:text-white text-slate-800 truncate">{member.name}</p>
        <p className="text-xs dark:text-slate-500 text-slate-400">{member.role}</p>
      </div>
      {selected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
    </button>
  );
}
