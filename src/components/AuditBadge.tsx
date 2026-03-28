import { Clock, UserCheck, Pencil } from 'lucide-react';

interface AuditBadgeProps {
  createdByIp?: string;
  createdAt?: string;
  updatedByIp?: string;
  updatedAt?: string;
  className?: string;
}

function fmt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditBadge({
  createdByIp, createdAt,
  updatedByIp, updatedAt,
  className = '',
}: AuditBadgeProps) {
  const hasUpdate = updatedByIp && updatedByIp !== createdByIp;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Tạo bởi */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <UserCheck size={11} className="text-emerald-400 shrink-0" />
        <span className="text-slate-500">Tạo bởi</span>
        <span className="font-mono text-emerald-400 font-medium">
          {createdByIp || '—'}
        </span>
        {createdAt && (
          <>
            <Clock size={10} className="text-slate-600 shrink-0" />
            <span className="text-slate-500">{fmt(createdAt)}</span>
          </>
        )}
      </div>

      {/* Sửa bởi — chỉ hiện nếu có update và khác created */}
      {hasUpdate && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Pencil size={11} className="text-amber-400 shrink-0" />
          <span className="text-slate-500">Sửa bởi</span>
          <span className="font-mono text-amber-400 font-medium">
            {updatedByIp}
          </span>
          {updatedAt && (
            <>
              <Clock size={10} className="text-slate-600 shrink-0" />
              <span className="text-slate-500">{fmt(updatedAt)}</span>
            </>
          )}
        </div>
      )}

      {/* Nếu cùng IP nhưng đã update */}
      {!hasUpdate && updatedAt && updatedAt !== createdAt && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Pencil size={11} className="text-amber-400 shrink-0" />
          <span className="text-slate-500">Cập nhật lúc</span>
          <Clock size={10} className="text-slate-600 shrink-0" />
          <span className="text-slate-500">{fmt(updatedAt)}</span>
        </div>
      )}
    </div>
  );
}
