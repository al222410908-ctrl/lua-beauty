import { MessageCircle, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';

export default function WhatsAppConfirmModal() {
  const { cart, appliedCoupon, whatsappConfirm, confirmWhatsApp, cancelWhatsApp } = useCart();
  if (!whatsappConfirm) return null;

  const subtotal = cart.reduce((s, i) => s + i.precio * i.quantity, 0);
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percentage' ? subtotal * appliedCoupon.discount : appliedCoupon.discount;
  }
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40" onClick={cancelWhatsApp}>
      <div className="bg-[var(--color-card)] w-full max-w-sm rounded-lg border border-[var(--color-line)] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--color-line)] flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-[var(--color-ink)]">Confirmar pedido</h3>
          <button onClick={cancelWhatsApp} className="ml-auto p-1 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
          <p className="text-[11px] text-[var(--color-ink-soft)]">¿Enviar este pedido por WhatsApp?</p>
          <div className="space-y-1.5">
            {cart.map(item => (
              <div key={item.cartKey} className="flex justify-between text-xs">
                <span className="text-[var(--color-ink)] truncate mr-2">
                  {item.nombre}{item.variantName ? ` (${item.variantName})` : ''} <span className="text-[var(--color-ink-soft)]">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-[var(--color-ink)] flex-shrink-0">{formatPrice(item.precio * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-line)]/30 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-[var(--color-ink-soft)]">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Descuento</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-[var(--color-ink)] pt-1 border-t border-[var(--color-line)]/30">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--color-line)] flex gap-3">
          <button onClick={cancelWhatsApp} className="flex-1 py-2 rounded border border-[var(--color-line)] text-xs font-semibold cursor-pointer hover:bg-black/5">
            Cancelar
          </button>
          <button onClick={confirmWhatsApp} className="flex-1 py-2 rounded bg-emerald-600 text-white text-xs font-semibold cursor-pointer hover:bg-emerald-500 flex items-center justify-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Enviar a WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
