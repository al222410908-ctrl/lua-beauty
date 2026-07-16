import { CheckCircle, X, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    error: <X className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg bg-[var(--color-card)] border border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink)]">
        {icons[type] || icons.success}
        <span>{message}</span>
      </div>
    </div>
  );
}
