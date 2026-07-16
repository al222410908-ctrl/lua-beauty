import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Alert({ message, type = 'success', onClose }) {
  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
    info: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
  };

  const bgMap = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-200',
    error: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-200'
  };

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full">
      <div className={`flex items-start gap-3 p-4 rounded border ${bgMap[type] || bgMap.info}`}>
        <div className="flex-shrink-0 mt-0.5">
          {iconMap[type] || iconMap.info}
        </div>
        <div className="flex-1 text-sm font-medium pr-2">
          {message}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-ink-soft hover:text-ink transition-colors rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
