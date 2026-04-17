import { useState, useEffect } from 'react';

/**
 * Toast notification system.
 * Shows auto-dismissing notifications for errors, info, and success.
 */
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const bgColor = {
    error: 'var(--color-toast-error)',
    success: 'var(--color-toast-success)',
    info: 'var(--color-toast-info)',
  }[toast.type] || 'var(--color-toast-info)';

  const borderColor = {
    error: 'rgba(239, 68, 68, 0.3)',
    success: 'rgba(34, 197, 94, 0.3)',
    info: 'rgba(99, 102, 241, 0.3)',
  }[toast.type] || 'rgba(99, 102, 241, 0.3)';

  const icon = {
    error: '⚠️',
    success: '✅',
    info: 'ℹ️',
  }[toast.type] || 'ℹ️';

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl text-sm
        backdrop-blur-xl border shadow-lg
        ${isExiting ? 'animate-[fade-in_0.3s_ease-out_reverse]' : 'animate-[slide-up_0.3s_ease-out]'}
      `}
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <span className="text-base mt-0.5">{icon}</span>
      <p className="flex-1 text-[var(--color-text-primary)] text-sm leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5 cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Hook for managing toast notifications.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
