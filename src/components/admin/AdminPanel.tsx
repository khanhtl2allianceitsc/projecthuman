import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Users, FolderKanban, Download } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useIdentity } from '../../context/IdentityContext';
import { useVolunteer } from '../../context/VolunteerContext';
import MembersTab from './MembersTab';
import ProjectsTab from './ProjectsTab';

type Tab = 'members' | 'projects';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { exportJSON, canEdit, myIP, data } = useData();
  const { currentUser } = useIdentity();
  const { getPendingCount } = useVolunteer();
  const [tab, setTab] = useState<Tab>('members');

  const currentMember = data.members.find(m => m.id === currentUser?.memberId);
  const isAdmin = currentMember?.isAdmin ?? false;
  const pendingCount = isAdmin ? getPendingCount() : 0;

  if (!open) return (
    <>
      {pendingCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-bounce shadow-lg">
            {pendingCount}
          </span>
        </div>
      )}
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[4vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl dark:bg-[#111122] bg-white border dark:border-white/10 border-slate-200 animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/10 border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-xl border border-purple-500/30">
              <Settings className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold dark:text-white text-slate-800">Quản lý dữ liệu</h2>
              <p className="text-xs dark:text-slate-500 text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${canEdit ? 'bg-green-400' : 'bg-amber-400'}`} />
                {myIP} — {canEdit ? 'có quyền chỉnh sửa' : 'chỉ xem'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export button in header */}
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Xuất JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 dark:text-slate-400 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body: sidebar tabs + content */}
        <div className="flex flex-1 min-h-0">

          {/* Left sidebar — tabs */}
          <div className="w-44 flex-shrink-0 border-r dark:border-white/8 border-slate-100 flex flex-col gap-1 p-3">
            {([
              { id: 'members'  as Tab, label: 'Nhân sự',  icon: <Users className="w-4 h-4" />,         count: data.members.length },
              { id: 'projects' as Tab, label: 'Dự án',    icon: <FolderKanban className="w-4 h-4" />,  count: data.projects.length },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  tab === t.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'dark:text-slate-400 text-slate-500 dark:hover:bg-white/5 hover:bg-slate-100'
                }`}
              >
                {t.icon}
                <span className="flex-1">{t.label}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-white/20 text-white' : 'dark:bg-white/8 bg-slate-200 dark:text-slate-400 text-slate-500'
                }`}>{t.count}</span>
              </button>
            ))}

            {/* Pending badge in sidebar */}
            {pendingCount > 0 && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[11px] text-red-400 font-semibold">{pendingCount} đơn chờ duyệt</p>
              </div>
            )}
          </div>

          {/* Right content area */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'members' ? <MembersTab /> : <ProjectsTab />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
