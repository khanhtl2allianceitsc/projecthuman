import { useState } from 'react';
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

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-md flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full dark:bg-[#111122] bg-white shadow-2xl border-l dark:border-white/10 border-slate-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/10 border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-xl border border-purple-500/30">
                <Settings className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold dark:text-white text-slate-800">Quản lý dữ liệu</h2>
                <p className="text-xs dark:text-slate-500 text-slate-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${canEdit ? 'bg-green-400' : 'bg-amber-400'}`} />
                  {myIP} — {canEdit ? 'có quyền chỉnh sửa' : 'chỉ xem'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 dark:text-slate-400 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-3 flex-shrink-0 border-b dark:border-white/8 border-slate-100">
            {([
              { id: 'members' as Tab, label: 'Nhân sự', icon: <Users className="w-3.5 h-3.5" /> },
              { id: 'projects' as Tab, label: 'Dự án',  icon: <FolderKanban className="w-3.5 h-3.5" /> },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'dark:text-slate-400 text-slate-500 dark:hover:bg-white/5 hover:bg-slate-100'
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {tab === 'members' ? <MembersTab /> : <ProjectsTab />}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t dark:border-white/10 border-slate-200 flex-shrink-0">
            <button
              onClick={exportJSON}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Xuất data.json
            </button>
            <p className="text-center text-[10px] dark:text-slate-600 text-slate-400 mt-2">
              Dữ liệu lưu thẳng vào <code>src/data/data.json</code>
            </p>
          </div>
        </div>
      </div>

      {/* Pending badge — portal-style absolute so it doesn't break layout */}
      {pendingCount > 0 && !open && (
        <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-bounce shadow-lg">
            {pendingCount}
          </span>
        </div>
      )}
    </>
  );
}
