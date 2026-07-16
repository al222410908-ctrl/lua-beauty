import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { CONFIG } from '../config';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('¡Suscripción exitosa! Pronto recibirás novedades.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al suscribir');
      }
    } catch {
      setStatus('error');
      setMessage('Error de conexión. Intenta de nuevo.');
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 border-t border-[var(--color-line)]/30">
      <div className="max-w-md mx-auto text-center">
        <Mail className="w-6 h-6 mx-auto mb-2 text-[var(--color-terracotta)]" />
        <h3 className="font-[Fraunces] text-lg font-semibold mb-1">Newsletter</h3>
        <p className="text-xs text-[var(--color-ink-soft)] mb-4">
          Recibe las últimas novedades, lanzamientos y ofertas exclusivas.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-sm focus:outline-none focus:border-[var(--color-terracotta)] text-[var(--color-ink)]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-2.5 rounded bg-[var(--color-terracotta)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--color-terracotta)]/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suscribir'}
          </button>
        </form>

        {message && (
          <div className={`flex items-center justify-center gap-1.5 mt-3 text-xs font-semibold ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
