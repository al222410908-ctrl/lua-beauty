import { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';

const STATUS_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300',
  preparando: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300',
  enviado: 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300',
  entregado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300',
  cancelado: 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300',
};

export default function OrdersPanel({ onClose }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOrders, setBackendOrders] = useState([]);

  // Load local orders from localStorage
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem('lua_orders')) || [];
      setOrders(local);
    } catch { setOrders([]); }
  }, []);

  // Load backend orders if user is logged in
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchApi('/api/orders').then(data => {
      setBackendOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  // Merge: backend first (by id uniqueness), then local
  const allIds = new Set();
  const merged = [];
  for (const o of [...backendOrders, ...orders]) {
    if (!allIds.has(o.id)) {
      allIds.add(o.id);
      merged.push(o);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-[var(--color-card)] border-r border-[var(--color-line)] shadow-2xl animate-slide-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-line)]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--color-terracotta)]" />
            <h2 className="font-[Fraunces] text-lg font-semibold">Mis Pedidos</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-[var(--color-ink-soft)] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-terracotta)]" />
              <span>Cargando pedidos...</span>
            </div>
          ) : merged.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)] italic text-center pt-12">
              No tienes pedidos registrados.
            </p>
          ) : merged.map(o => (
            <div key={o.id} className="border border-[var(--color-line)]/40 rounded p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)]/20 pb-2">
                <span className="font-bold text-[10px]">{o.id}</span>
                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
              </div>

              <div className="space-y-1">
                {(o.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="font-semibold truncate">{it.nombre} x{it.quantity}</span>
                    <span className="text-[var(--color-ink-soft)]">{formatPrice(it.precio * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {o.discount > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(o.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold border-t border-[var(--color-line)]/20 pt-1">
                <span>Total</span>
                <span>{formatPrice(o.total)}</span>
              </div>

              <div className="text-[9px] text-[var(--color-ink-soft)]">
                {new Date(o.date || o.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
