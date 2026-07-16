import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Landmark, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/utils';
import { fetchApi } from '../lib/api';

export default function CartPanel({ onClose }) {
  const { cart, appliedCoupon, setAppliedCoupon, updateQuantity, removeFromCart, checkout, phone, setPhone } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [bankInfo, setBankInfo] = useState(null);

  useEffect(() => {
    fetchApi('/api/delivery-zones', 'GET').then(setDeliveryZones).catch(() => {});
    fetchApi('/api/settings', 'GET').then(data => {
      if (data?.bank_name) setBankInfo(data);
    }).catch(() => {});
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.precio * i.quantity, 0);
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percentage' ? subtotal * appliedCoupon.discount : appliedCoupon.discount;
  }
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    const code = couponInput.toUpperCase().trim();
    if (!code) return;
    try {
      const payload = { code };
      if (phone) {
        payload.phone = phone;
      }
      const c = await fetchApi('/api/coupons/validate', 'POST', payload);
      setAppliedCoupon({ ...c, code });
      const desc = c.type === 'percentage' ? `${c.discount * 100}% de descuento` : `$${c.discount?.toLocaleString('es-MX')} de descuento`;
      setCouponMsg(`✅ Cupón aplicado: ${desc}`);
    } catch (err) {
      setCouponMsg(`❌ ${err.message}`);
    }
    setCouponInput('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg('');
  };

  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async () => {
    if (!selectedZone) {
      setCheckoutError('Selecciona una zona de entrega');
      return;
    }
    setLoading(true);
    setCheckoutError('');
    try {
      await checkout(user, selectedZone, bankInfo);
    } catch (err) {
      setCheckoutError(err.message || 'Error al procesar el pedido. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[var(--color-card)] border-l border-[var(--color-line)] shadow-2xl animate-slide-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-line)]">
          <h2 className="font-[Fraunces] text-lg font-semibold">Carrito</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)] italic text-center pt-8">Tu carrito está vacío</p>
          ) : (
            cart.map(item => (
              <div key={item.cartKey} className="flex items-center gap-3 pb-3 border-b border-[var(--color-line)]/30">
                <div className="w-14 h-14 rounded bg-[var(--color-bg-deep)] overflow-hidden flex-shrink-0">
                  {item.url_imagen ? (
                    <img src={item.url_imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--color-ink-soft)]">
                      {item.nombre[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{item.nombre}</p>
                  {item.variantName && <p className="text-[10px] text-[var(--color-ink-soft)]">{item.variantName}</p>}
                  <p className="text-[11px] text-[var(--color-terracotta)] font-bold">{formatPrice(item.precio)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.cartKey, -1)} className="p-0.5 rounded border border-[var(--color-line)] hover:bg-black/5 cursor-pointer">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartKey, 1)} className="p-0.5 rounded border border-[var(--color-line)] hover:bg-black/5 cursor-pointer">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.cartKey)} className="ml-auto p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[var(--color-line)] p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cupón"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                className="flex-1 px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
              />
              <button onClick={applyCoupon} className="px-3 py-2 rounded bg-[var(--color-terracotta)] text-white text-xs font-semibold cursor-pointer hover:bg-[var(--color-terracotta)]/90">
                Aplicar
              </button>
            </div>
            {couponMsg && <p className="text-[10px] font-semibold">{couponMsg}</p>}
            {appliedCoupon && (
              <button onClick={removeCoupon} className="text-[10px] text-rose-600 hover:underline cursor-pointer">
                Quitar cupón {appliedCoupon.code}
              </button>
            )}

            {!user && (
              <div>
                <label className="text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider">Tu WhatsApp (ej. 521234567890)</label>
                <input
                  type="tel"
                  placeholder="ej. 521234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full mt-1 px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-xs focus:outline-none focus:border-[var(--color-terracotta)] text-[var(--color-ink)]"
                />
                <p className="text-[9px] text-[var(--color-ink-soft)] mt-1">Requerido para validar cupones de lealtad y confirmar pedido</p>
              </div>
            )}

            {deliveryZones.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider">Zona de entrega</label>
                <select
                  value={selectedZone}
                  onChange={e => setSelectedZone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-[var(--color-line)] bg-transparent text-xs focus:outline-none focus:border-[var(--color-terracotta)]"
                >
                  <option value="">Selecciona tu zona</option>
                  {deliveryZones.map(z => (
                    <option key={z.id} value={z.nombre}>{z.nombre}</option>
                  ))}
                </select>
                <p className="text-[9px] text-[var(--color-ink-soft)] mt-1">Envío sin costo dentro de estas zonas</p>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-soft)]">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-[var(--color-line)]/30">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {bankInfo && (
              <div className="p-3 rounded bg-[var(--color-bg-deep)] border border-[var(--color-line)]/30 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="w-3 h-3" /> Transferencia bancaria
                </p>
                <p className="text-[10px]"><span className="text-[var(--color-ink-soft)]">Banco:</span> {bankInfo.bank_name}</p>
                <p className="text-[10px]"><span className="text-[var(--color-ink-soft)]">CLABE:</span> {bankInfo.bank_clabe}</p>
                <p className="text-[10px]"><span className="text-[var(--color-ink-soft)]">Cuenta:</span> {bankInfo.bank_account}</p>
                <p className="text-[10px]"><span className="text-[var(--color-ink-soft)]">Titular:</span> {bankInfo.bank_holder}</p>
                <p className="text-[9px] text-[var(--color-ink-soft)] italic mt-1">Envía tu comprobante por WhatsApp para confirmar</p>
              </div>
            )}

            {checkoutError && <p className="text-[10px] text-rose-600 font-semibold text-center">{checkoutError}</p>}
            <button
              onClick={handleCheckout}
              disabled={loading || !selectedZone}
              className="w-full py-2.5 rounded bg-[var(--color-terracotta)] text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[var(--color-terracotta)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
              {loading ? 'Procesando...' : 'Pedir por WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
