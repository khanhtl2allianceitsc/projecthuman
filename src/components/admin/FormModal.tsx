import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface FormModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal overlay — render qua Portal để không bị kẹt trong drawer.
 * User không cần scroll — form luôn hiện ở giữa màn hình.
 */
export default function FormModal({ title, onClose, children }: FormModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl dark:bg-[#13132a] bg-white border dark:border-white/10 border-slate-200 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/10 border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-bold dark:text-white text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 dark:text-slate-400 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
