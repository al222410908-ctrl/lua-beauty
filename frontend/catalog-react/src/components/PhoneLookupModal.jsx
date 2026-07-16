import { useState } from 'react';
import { X, Phone, Loader2, Package, ChevronRight } from 'lucide-react';
import { CONFIG } from '../config';

const STATUS_BADGE = {
  pendiente:  { bg: 'rgba(251,191,36,0.15)',  color: '#92400e', label: 'Pendiente' },
  confirmado: { bg: 'rgba(59,130,246,0.12)',   color: '#1d4ed8', label: 'Confirmado' },
  preparando: { bg: 'rgba(99,102,241,0.12)',   color: '#4338ca', label: 'Preparando' },
  enviado:    { bg: 'rgba(168,85,247,0.12)',   color: '#7e22ce', label: 'Enviado' },
  entregado:  { bg: 'rgba(16,185,129,0.12)',   color: '#065f46', label: 'Entregado ✓' },
  cancelado:  { bg: 'rgba(239,68,68,0.12)',    color: '#991b1b', label: 'Cancelado' },
};

function formatMXN(n) {
  return `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

export default function PhoneLookupModal({ onClose }) {
  const [step, setStep]     = useState('input'); // 'input' | 'results'
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [orders, setOrders] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 7) {
      setError('Ingresa un número de WhatsApp válido (ej. 5213312345678)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/orders/by-phone/${clean}`);
      if (!res.ok) throw new Error('Error al consultar pedidos');
      const data = await res.json();
      setOrders(data);
      setStep('results');
    } catch {
      setError('No se pudo consultar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
          style={{
            background: 'linear-gradient(160deg, rgba(255,236,245,0.97) 0%, rgba(255,248,252,0.98) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(210,160,190,0.3)',
          }}
        >
          {/* Top accent */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#C8638A,#E8A0BF,#C8638A)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#C8638A,#B0507A)', boxShadow: '0 4px 12px rgba(180,80,120,0.3)' }}
              >
                {step === 'input'
                  ? <Phone className="w-4 h-4 text-white" />
                  : <Package className="w-4 h-4 text-white" />
                }
              </div>
              <div>
                <h2 className="font-[Fraunces] text-base font-semibold" style={{ color: '#6B2A50' }}>
                  {step === 'input' ? 'Consultar mis pedidos' : 'Mis Pedidos'}
                </h2>
                <p className="text-[10px]" style={{ color: '#B07090' }}>
                  {step === 'input'
                    ? 'Ingresa tu número de WhatsApp'
                    : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} encontrado${orders.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90"
              style={{ background: 'rgba(180,100,140,0.12)' }}
            >
              <X className="w-4 h-4" style={{ color: '#8B3A6B' }} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-6">
            {step === 'input' ? (
              <form onSubmit={handleSearch} className="space-y-4">
                <div
                  className="p-3 rounded-xl text-xs leading-relaxed"
                  style={{ background: 'rgba(200,100,140,0.08)', border: '1px solid rgba(200,100,140,0.18)', color: '#704060' }}
                >
                  📱 Usamos tu número de WhatsApp para identificar tus pedidos — <strong>sin necesidad de contraseña</strong>.
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: '#8B3A6B' }}>
                    Número de WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#C8638A' }} />
                    <input
                      type="tel"
                      placeholder="Ej. 5213312345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      autoFocus
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border focus:outline-none transition-all font-mono"
                      style={{
                        background: 'rgba(255,255,255,0.7)',
                        border: '1.5px solid rgba(200,100,140,0.3)',
                        color: '#3A1228',
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: '#B07090' }}>
                    Incluye código de país (52 para México)
                  </p>
                </div>

                {error && (
                  <p className="text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#C8638A,#B0507A)', boxShadow: '0 4px 16px rgba(180,80,120,0.3)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {loading ? 'Buscando...' : 'Ver mis pedidos'}
                </button>
              </form>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {/* Back button */}
                <button
                  onClick={() => { setStep('input'); setOrders([]); setError(''); }}
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer mb-3 hover:underline"
                  style={{ color: '#C8638A' }}
                >
                  ← Cambiar número
                </button>

                {orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(200,100,140,0.1)', border: '1.5px dashed rgba(200,100,140,0.35)' }}
                    >
                      <Package className="w-7 h-7" style={{ color: '#C8638A', opacity: 0.5 }} />
                    </div>
                    <div>
                      <p className="font-[Fraunces] text-sm font-semibold mb-1" style={{ color: '#6B2A50' }}>
                        Sin pedidos registrados
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#B07090' }}>
                        No encontramos pedidos con este número. Si hiciste un pedido por WhatsApp, asegúrate de usar el mismo número.
                      </p>
                    </div>
                  </div>
                ) : (
                  orders.map(order => {
                    const badge = STATUS_BADGE[order.status] || { bg: 'rgba(200,200,200,0.2)', color: '#666', label: order.status };
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,100,140,0.18)' }}
                      >
                        {/* Order header */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold" style={{ color: '#6B2A50' }}>
                            {order.id}
                          </span>
                          <span
                            className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="font-semibold truncate max-w-[65%]" style={{ color: '#3A1228' }}>
                                {item.nombre}{item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}
                              </span>
                              <span style={{ color: '#B07090' }}>
                                {formatMXN(item.precio * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t pt-2 space-y-0.5" style={{ borderColor: 'rgba(200,100,140,0.15)' }}>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-[10px] text-emerald-700">
                              <span>Descuento {order.coupon ? `(${order.coupon})` : ''}</span>
                              <span>-{formatMXN(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-bold" style={{ color: '#3A1228' }}>
                            <span>Total</span>
                            <span>{formatMXN(order.total)}</span>
                          </div>
                          <div className="text-[9px] mt-1" style={{ color: '#B07090' }}>
                            {new Date(order.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                            {order.delivery_zone && ` · ${order.delivery_zone}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
