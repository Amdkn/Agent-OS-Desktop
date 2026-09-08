import React, { useEffect } from 'react';
import { useShell, type Toast as ToastType } from '../shell/store';

const TOAST_DURATION = 4500;

const typeColors: Record<ToastType['type'], { bg: string; border: string; text: string; dot: string }> = {
  info: { bg: 'rgba(37, 99, 235, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd', dot: '#3b82f6' },
  success: { bg: 'rgba(22, 163, 74, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac', dot: '#22c55e' },
  warning: { bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fde68a', dot: '#f59e0b' },
  error: { bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5', dot: '#ef4444' },
};

export function ToastContainer(): React.ReactNode {
  const toasts = useShell((s) => s.toasts);
  const dismissToast = useShell((s) => s.dismissToast);

  return (
    <div className="fixed top-12 right-4 z-[4000] flex flex-col gap-2 pointer-events-none">
      {toasts.slice(-5).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastType;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const style = typeColors[toast.type] || typeColors.info;

  return (
    <div
      className="pointer-events-auto relative flex items-start gap-3 p-3.5 pr-8 rounded-xl backdrop-blur-xl border shadow-2xl w-80 transition-all duration-300 transform translate-y-0 opacity-100"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: style.border,
      }}
    >
      <div
        className="shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 shadow-[0_0_8px]"
        style={{ backgroundColor: style.dot, boxShadow: `0 0 8px ${style.dot}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
          {toast.source || 'Agent OS'}
        </div>
        <div className="text-xs font-medium text-white/90 leading-relaxed break-words">
          {toast.message}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
