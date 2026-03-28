import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useIdentity } from '../context/IdentityContext';
import { useTheme } from '../context/ThemeContext';
import { Crown, Shuffle, Sparkles, ArrowLeft, Users, Loader2, Copy, Check } from 'lucide-react';

const API = `http://${window.location.hostname}:4000`;
const SPIN_DURATION = 5000;

interface Candidate {
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberColor: string;
}

interface RaffleSession {
  state: 'none' | 'waiting' | 'spinning' | 'done';
  title?: string;
  candidates?: Candidate[];
  spinStartedAt?: number;
  spinDurationMs?: number;
  winnerId?: string;
  winnerName?: string;
  winnerAvatar?: string;
  winnerColor?: string;
}

export default function RafflePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data } = useData();
  const { currentUser } = useIdentity();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [session, setSession] = useState<RaffleSession>({ state: 'none' });
  const [apiLoading, setApiLoading] = useState(false);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const animRef = useRef<number | null>(null);

  const project = data.projects.find(p => p.id === projectId);
  const currentMember = currentUser ? data.members.find(m => m.id === currentUser.memberId) : undefined;
  const isAdmin = currentMember?.isAdmin ?? false;
  const isCustomRoom = projectId?.startsWith('room_') ?? false;
  const canSpin = isCustomRoom || isAdmin;
  const projectColor = project?.color ?? '#8b5cf6';
  const roomTitle = session.title ?? project?.name ?? projectId;
  const candidates = session.candidates ?? [];

  // ── Poll session every 500ms ───────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    if (!projectId) return;
    try {
      const r = await fetch(`${API}/api/raffle/${projectId}`);
      const d = await r.json();
      setSession(d);
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => {
    fetchSession();
    const t = setInterval(fetchSession, 500);
    return () => clearInterval(t);
  }, [fetchSession]);

  // ── Slot machine animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (session.state !== 'spinning' || !session.spinStartedAt || candidates.length === 0) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const start = session.spinStartedAt;
    const duration = session.spinDurationMs ?? SPIN_DURATION;
    const n = candidates.length;
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) return;
      setDisplayIdx(Math.floor(elapsed / 100) % n);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [session.state, session.spinStartedAt, session.spinDurationMs, candidates.length]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setApiLoading(true);
    try {
      const r = await fetch(`${API}/api/raffle/${projectId}/create`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) alert(d.error);
      else fetchSession();
    } finally { setApiLoading(false); }
  };

  const handleSpin = async () => {
    setApiLoading(true);
    try {
      const r = await fetch(`${API}/api/raffle/${projectId}/spin`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) alert(d.error);
      else fetchSession();
    } finally { setApiLoading(false); }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNone    = session.state === 'none';
  const isWaiting = session.state === 'waiting';
  const isSpinning = session.state === 'spinning';
  const isDone    = session.state === 'done';

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const bg       = isDark ? 'linear-gradient(135deg,#06060f 0%,#0d0d1f 50%,#060f1a 100%)' : 'linear-gradient(135deg,#f0f4ff 0%,#f8fafc 50%,#eef2ff 100%)';
  const cardBg   = isDark ? 'bg-white/[0.04]' : 'bg-white shadow-sm';
  const cardBorder = isDark ? 'border-white/8 hover:border-white/15' : 'border-slate-200 hover:border-slate-300';
  const textPrimary   = isDark ? 'text-white' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const idleCard  = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const idleBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ background: bg }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b transition-colors"
        style={{
          borderBottomColor: isDark ? `${projectColor}25` : `${projectColor}35`,
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link to="/" className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/8' : 'hover:bg-slate-100'}`}>
          <ArrowLeft className={`w-4 h-4 ${textSecondary}`} />
        </Link>
        <div className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: projectColor, boxShadow: `0 0 8px ${projectColor}80` }} />
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] ${textSecondary} uppercase tracking-widest`}>
            Phòng quay số{isCustomRoom ? ' • Custom' : ' • Lead'}
          </p>
          <h1 className={`text-sm font-bold ${textPrimary} truncate`}>{roomTitle}</h1>
        </div>

        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={copied
            ? { background: '#10b98120', borderColor: '#10b98140', color: '#10b981' }
            : isDark
              ? { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }
              : { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.12)', color: '#64748b' }
          }
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Đã copy!' : 'Copy link'}
        </button>

        {candidates.length > 0 && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/8' : 'bg-slate-100 border-slate-200'}`}>
            <Users className={`w-3.5 h-3.5 ${textSecondary}`} />
            <span className={`text-xs ${textSecondary}`}>{candidates.length} ứng viên</span>
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">

        {/* none */}
        {isNone && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${projectColor}15`, border: `1px solid ${projectColor}30`, boxShadow: `0 0 40px ${projectColor}15` }}>
              <Shuffle className="w-10 h-10" style={{ color: projectColor }} />
            </div>
            <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Chưa có phòng quay số</h2>
            <p className={`text-sm ${textSecondary} mb-8 max-w-sm mx-auto`}>
              {isAdmin ? 'Tạo phòng để chia sẻ link cho mọi người vào xem quay số trực tiếp.' : 'Admin chưa tạo phòng quay số cho dự án này.'}
            </p>
            {isAdmin && (
              <button onClick={handleCreate} disabled={apiLoading}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg,${projectColor},${projectColor}99)`, boxShadow: `0 8px 32px ${projectColor}40` }}>
                {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                Tạo phòng quay số
              </button>
            )}
          </div>
        )}

        {/* waiting */}
        {isWaiting && (
          <div className="w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">Phòng đã sẵn sàng</span>
              </div>
              <h2 className={`text-2xl font-bold ${textPrimary} mb-1`}>Ai sẽ là Lead?</h2>
              <p className={`text-sm ${textSecondary}`}>
                {canSpin ? 'Nhấn bắt đầu khi mọi người đã vào xem.' : 'Đang chờ admin bắt đầu quay số…'}
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {candidates.map(c => (
                <div key={c.memberId} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${cardBg} ${cardBorder}`}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: c.memberColor, boxShadow: `0 4px 16px ${c.memberColor}50` }}>
                    {c.memberAvatar}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium text-center leading-tight`}>
                    {c.memberName.split(' ').slice(-2).join(' ')}
                  </p>
                </div>
              ))}
            </div>

            {canSpin ? (
              <div className="text-center">
                <button onClick={handleSpin} disabled={apiLoading || candidates.length < 2}
                  className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 8px 40px rgba(124,58,237,0.5)' }}>
                  {apiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shuffle className="w-5 h-5" />}
                  Bắt đầu quay số!
                </button>
                {candidates.length < 2 && <p className={`text-xs ${textSecondary} mt-3`}>Cần ít nhất 2 ứng viên để quay số</p>}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className={`w-4 h-4 ${textSecondary} animate-spin`} />
                <span className={`text-sm ${textSecondary}`}>Chờ admin bắt đầu…</span>
              </div>
            )}
          </div>
        )}

        {/* spinning */}
        {isSpinning && (
          <div className="w-full">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${textPrimary} mb-1 flex items-center justify-center gap-2`}>
                <Shuffle className="w-6 h-6 text-purple-400 animate-spin" style={{ animationDuration: '0.5s' }} />
                Đang quay số…
                <Shuffle className="w-6 h-6 text-purple-400 animate-spin" style={{ animationDuration: '0.5s', animationDirection: 'reverse' }} />
              </h2>
              <p className={`text-sm ${textSecondary}`}>Số phận đang được định đoạt… ✨</p>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
              {candidates.map((c, i) => {
                const active = i === displayIdx;
                return (
                  <div key={c.memberId} className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-100"
                    style={active ? {
                      background: isDark ? `${projectColor}20` : `${projectColor}12`,
                      border: `2px solid ${projectColor}`,
                      transform: 'scale(1.2)',
                      boxShadow: `0 0 32px ${projectColor}60, 0 0 64px ${projectColor}20`,
                    } : {
                      background: idleCard,
                      border: `1px solid ${idleBorder}`,
                      transform: 'scale(0.88)',
                      opacity: 0.35,
                    }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ background: c.memberColor, boxShadow: active ? `0 0 20px ${c.memberColor}80` : 'none' }}>
                      {c.memberAvatar}
                    </div>
                    <p className={`text-xs font-semibold ${active ? textPrimary : textSecondary}`}>
                      {c.memberName.split(' ').slice(-1)[0]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* done */}
        {isDone && session.winnerId && (
          <div className="flex flex-col items-center gap-5 animate-slide-up text-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className={`text-2xl font-bold ${textPrimary}`}>Lead đã được chọn!</h2>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>

            <div className="relative mt-2">
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                style={{ background: session.winnerColor, boxShadow: `0 0 50px ${session.winnerColor}80, 0 0 100px ${session.winnerColor}30` }}>
                {session.winnerAvatar}
              </div>
              <div className="absolute -top-3 -right-2 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-xl">
                <Crown className="w-5 h-5 text-amber-900" />
              </div>
            </div>

            <div>
              <p className={`text-3xl font-bold ${textPrimary} mb-2`}>{session.winnerName}</p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">Lead mới của dự án</span>
              </div>
            </div>

            {canSpin && (
              <button onClick={handleCreate} disabled={apiLoading}
                className={`mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  isDark
                    ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                    : 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}>
                <Shuffle className="w-4 h-4" />
                Quay lại (reset)
              </button>
            )}

            <Link to="/"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                isDark
                  ? 'text-slate-500 hover:text-white bg-white/[0.03] hover:bg-white/8 border-white/8'
                  : 'text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}>
              <ArrowLeft className="w-4 h-4" />
              Về Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
