import { useState, useRef, useEffect } from 'react';
import { X, Phone } from 'lucide-react';

export default function PhoneModal({ onClose, onSubmit }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const digits = input.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Ingresa al menos 10 dígitos (ej. 521234567890)');
      return;
    }
    setError('');
    onSubmit(digits);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-[var(--color-card)] rounded-xl shadow-2xl border border-[var(--color-line)] w-full max-w-sm p-6 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-[Fraunces] text-lg font-semibold">Número de WhatsApp</h3>
            <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[var(--color-ink-soft)]">
            Ingresa tu número de WhatsApp para recibir la confirmación de tu pedido:
          </p>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-deep)]">
            <Phone className="w-4 h-4 text-[var(--color-ink-soft)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="tel"
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="521234567890"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {error && <p className="text-[10px] text-rose-600 font-semibold">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded bg-[var(--color-terracotta)] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[var(--color-terracotta)]/90 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}