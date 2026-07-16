import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant = 'danger' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div className="bg-card w-full max-w-sm rounded-lg border border-line overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-line flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-rose-500' : 'text-amber-500'}`} />
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <button onClick={onCancel} className="ml-auto p-1 text-ink-soft hover:text-ink cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          <p className="text-xs text-ink-soft leading-relaxed">{message}</p>
        </div>
        <div className="p-4 border-t border-line flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded border border-line text-xs font-semibold cursor-pointer hover:bg-black/5">
            {cancelLabel || 'Cancelar'}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded text-xs font-semibold cursor-pointer text-white ${
            variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
          }`}>
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
