import { Users, FolderKanban, TrendingUp, Crown, Sun, Moon, LogOut, Bell, ChevronRight, Settings, Pencil, UserSquare2, Shuffle, X, Plus, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { DashboardData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useIdentity } from '../context/IdentityContext';
import { useVolunteer } from '../context/VolunteerContext';
import { useData } from '../context/DataContext';
import AdminPanel from './admin/AdminPanel';
import { MemberForm } from './admin/MembersTab';
import FormModal from './admin/FormModal';

function scrollToNeedLead() {
  document.getElementById('section-need-lead')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface HeaderProps {
  data: DashboardData;
}

export default function Header({ data }: HeaderProps) {
  const { theme, toggle } = useTheme();
  const { currentUser, clearIdentity } = useIdentity();
  const { getPendingCount } = useVolunteer();
  const { data: allData } = useData();
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);
  const [editSelfOpen, setEditSelfOpen] = useState(false);
  const [customRaffleOpen, setCustomRaffleOpen] = useState(false);
  const activeProjects = data.projects.filter(p => p.status === 'active').length;
  const completedProjects = data.projects.filter(p => p.status === 'completed').length;
  const totalLeads = new Set(
    data.projects
      .map(p => p.members.find(m => m.projectRole === 'Lead')?.memberId)
      .filter(Boolean)
  ).size;
  const noLeadCount = data.projects.filter(
    p => p.status !== 'completed' && !p.members.some(m => m.projectRole === 'Lead')
  ).length;
  const currentMember = currentUser ? allData.members.find(m => m.id === currentUser.memberId) : undefined;
  const isAdmin = currentMember?.isAdmin ?? false;
  const pendingCount = isAdmin ? getPendingCount() : 0;
  const isDark = theme === 'dark';
  const API = ``;

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 right-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-8 pt-10 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <img
              src="https://allianceitsc.com/alliance-uploads/logo.png"
              alt="Alliance"
              className="h-10 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 className="text-xl font-bold dark:text-white text-slate-800">Alliance Project Hub</h1>
              <p className="text-xs dark:text-slate-400 text-slate-500">Dashboard phân tích nhân sự & dự án</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Custom raffle button */}
            <button
              onClick={() => setCustomRaffleOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 dark:bg-purple-500/10 bg-purple-50 dark:border-purple-500/30 border-purple-200 dark:text-purple-300 text-purple-700 hover:dark:bg-purple-500/20 hover:bg-purple-100"
              title="Tạo phòng quay số ngẫu nhiên"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Quay số
            </button>
            {/* Team directory link */}
            <Link
              to="/team"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/30 border-cyan-200 dark:text-cyan-300 text-cyan-700 hover:dark:bg-cyan-500/20 hover:bg-cyan-100"
            >
              <UserSquare2 className="w-3.5 h-3.5" />
              Team
            </Link>
            {/* Personnel page link */}
            <Link
              to="/personnel"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 dark:bg-purple-500/10 bg-purple-50 dark:border-purple-500/30 border-purple-200 dark:text-purple-300 text-purple-700 hover:dark:bg-purple-500/20 hover:bg-purple-100"
            >
              <Users className="w-3.5 h-3.5" />
              Man Month
            </Link>
            {currentUser && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
                style={{ background: `${currentUser.color}18`, borderColor: `${currentUser.color}40` }}
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: currentUser.color }}
                >
                  {currentMember?.avatarUrl
                    ? <img src={`${API}${currentMember.avatarUrl}`} className="w-full h-full object-cover" alt={currentUser.name} />
                    : currentUser.avatar
                  }
                </div>
                <span className="text-xs font-semibold dark:text-white text-slate-700 max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                {/* Edit self button */}
                <button
                  onClick={() => setEditSelfOpen(true)}
                  title="Chỉnh sửa hồ sơ"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3 h-3 dark:text-slate-300 text-slate-500" />
                </button>
                {/* Settings button */}
                <button
                  onClick={() => setAdminOpen(true)}
                  title="Quản lý dữ liệu"
                  className="relative opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Settings className="w-3.5 h-3.5 dark:text-slate-300 text-slate-500" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={clearIdentity}
                  title="Đổi người dùng"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <LogOut className="w-3 h-3 dark:text-slate-400 text-slate-500" />
                </button>
              </div>
            )}

            {/* Live badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              style={{
                background: isDark ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'linear-gradient(135deg,#fef3c7,#fde68a)',
                borderColor: isDark ? 'rgba(139,92,246,0.4)' : 'rgba(251,191,36,0.5)',
              }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
                style={{
                  left: isDark ? '2px' : 'calc(100% - 26px)',
                  background: isDark ? '#6d28d9' : '#f59e0b',
                  boxShadow: isDark ? '0 0 8px rgba(139,92,246,0.6)' : '0 0 8px rgba(245,158,11,0.6)',
                }}
              >
                {isDark ? <Moon className="w-3.5 h-3.5 text-purple-100" /> : <Sun className="w-3.5 h-3.5 text-amber-900" />}
              </span>
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold dark:text-white text-slate-800 mb-2 tracking-tight">
            Project &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Personnel
            </span>{' '}
            Overview
          </h2>
          <p className="dark:text-slate-400 text-slate-500 text-base">
            Trực quan hóa toàn diện về dự án, nhân sự và tiến độ thực hiện
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<FolderKanban className="w-5 h-5 text-purple-400" />} label="Tổng dự án" value={data.projects.length} sub="dự án" color="purple" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-green-400" />} label="Đang hoạt động" value={activeProjects} sub={`${completedProjects} hoàn thành`} color="green" />
          <StatCard icon={<Users className="w-5 h-5 text-cyan-400" />} label="Nhân sự" value={data.members.length} sub="thành viên" color="cyan" />
          <StatCard icon={<Crown className="w-5 h-5 text-amber-400" />} label="Số Lead" value={totalLeads} sub={`/ ${data.projects.length} dự án`} color="amber" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      {/* Need-lead nudge banner */}
      {noLeadCount > 0 && (
        <button
          onClick={scrollToNeedLead}
          className="w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 group hover:opacity-90"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(124,58,237,0.10) 100%)'
              : 'linear-gradient(90deg, rgba(239,68,68,0.08) 0%, rgba(124,58,237,0.06) 100%)',
            borderBottom: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <span className="relative flex-shrink-0">
            <Bell className="w-4 h-4 text-red-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </span>
          <span className="text-sm font-semibold text-red-400 flex-1 text-left">
            Có <span className="font-extrabold">{noLeadCount}</span> dự án đang cần Lead —{' '}
            <span className="dark:text-purple-400 text-purple-600 underline underline-offset-2">
              Xung phong ngay
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>
      )}

      {editSelfOpen && currentMember && (
        <FormModal title={`✏️ Chỉnh sửa hồ sơ`} onClose={() => setEditSelfOpen(false)}>
          <MemberForm initial={currentMember} onClose={() => setEditSelfOpen(false)} />
        </FormModal>
      )}
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
      {customRaffleOpen && (
        <CustomRaffleModal
          onClose={() => setCustomRaffleOpen(false)}
          onCreated={(roomId) => {
            setCustomRaffleOpen(false);
            window.open(`/raffle/${roomId}`, '_blank');
          }}
        />
      )}
    </header>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: 'purple' | 'green' | 'cyan' | 'amber';
}

const colorMap = {
  purple: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50',
  green:  'bg-green-500/10  border-green-500/20  hover:border-green-500/50',
  cyan:   'bg-cyan-500/10   border-cyan-500/20   hover:border-cyan-500/50',
  amber:  'bg-amber-500/10  border-amber-500/20  hover:border-amber-500/50',
};

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className={`${colorMap[color]} border rounded-2xl p-4 transition-all duration-300 hover:scale-105 cursor-default`}>
      <div className="p-2 bg-white/5 rounded-lg w-fit">{icon}</div>
      <div className="mt-3">
        <div className="text-2xl font-bold dark:text-white text-slate-800">{value}</div>
        <div className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">{label}</div>
        <div className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

/* ─── Custom Raffle Modal ──────────────────────────────────────────────────── */

const ITEM_COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#f97316','#6366f1','#14b8a6','#3b82f6','#84cc16','#e879f9'];

function CustomRaffleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const API = ``;
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const validItems = items.map(s => s.trim()).filter(Boolean);

  const setItem = (i: number, val: string) =>
    setItems(prev => prev.map((v, idx) => idx === i ? val : v));

  const addItem = () => setItems(prev => [...prev, '']);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    if (e.key === 'Backspace' && items[i] === '' && items.length > 2) {
      e.preventDefault(); removeItem(i);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validItems.length < 2) { setError('Cần ít nhất 2 mục'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/raffle/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'Quay số ngẫu nhiên', items: validItems }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Lỗi tạo phòng'); return; }
      onCreated(data.roomId);
    } catch { setError('Không kết nối được server'); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl dark:bg-[#13132a] bg-white border dark:border-white/10 border-slate-200 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/10 border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold dark:text-white text-slate-800">Tạo phòng quay số</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 dark:text-slate-400 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-600 mb-1.5">
              Tiêu đề <span className="font-normal dark:text-slate-500 text-slate-400">(tuỳ chọn)</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Chọn người trình bày, Quay thưởng..."
              className="input-field"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold dark:text-slate-300 text-slate-600">
                Danh sách ứng viên / giá trị
              </label>
              <span className="text-[10px] dark:text-slate-500 text-slate-400">{validItems.length} mục</span>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ background: ITEM_COLORS[i % ITEM_COLORS.length] }}
                  >
                    {item.trim().slice(0, 2) || (i + 1)}
                  </div>
                  <input
                    value={item}
                    onChange={e => setItem(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    placeholder={`Mục ${i + 1}`}
                    className="input-field flex-1 py-1.5 text-sm"
                    autoFocus={i === items.length - 1 && i > 1}
                  />
                  {items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-1.5 rounded-lg dark:hover:bg-red-500/15 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-xs dark:text-slate-400 text-slate-500 dark:hover:text-purple-400 hover:text-purple-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm mục (Enter)
            </button>
          </div>

          {/* Preview */}
          {validItems.length >= 2 && (
            <div className="p-3 rounded-xl dark:bg-white/[0.03] bg-slate-50 border dark:border-white/8 border-slate-200">
              <p className="text-[10px] font-semibold dark:text-slate-500 text-slate-400 uppercase tracking-wider mb-2">Xem trước</p>
              <div className="flex flex-wrap gap-1.5">
                {validItems.map((item, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ background: ITEM_COLORS[i % ITEM_COLORS.length] }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || validItems.length < 2}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang tạo…</> : <><Shuffle className="w-4 h-4" />Tạo phòng & mở</>}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
