import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config';
import { fetchApi } from '../lib/api';

const CartContext = createContext();

function loadCart() {
  try { return JSON.parse(localStorage.getItem('lua_cart')) || []; }
  catch { return []; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lua_coupon')); }
    catch { return null; }
  });
  const [phone, setPhone] = useState(() => localStorage.getItem('lua_phone') || '');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [whatsappConfirm, setWhatsappConfirm] = useState(null); // { resolve, orderData }

  useEffect(() => {
    localStorage.setItem('lua_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('lua_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('lua_coupon');
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (phone) localStorage.setItem('lua_phone', phone);
  }, [phone]);

  const addToCart = useCallback((product, variant = null) => {
    const cartKey = variant ? `${product.id}_${variant.id}` : product.id;
    const maxStock = variant ? variant.stock : product.stock;
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (maxStock <= 0) return prev;
      return [...prev, {
        cartKey,
        productId: product.id,
        variantId: variant?.id || null,
        variantName: variant?.nombre || null,
        nombre: product.nombre,
        precio: product.precio + (variant?.extra_price || 0),
        url_imagen: product.url_imagen,
        quantity: 1,
        maxStock
      }];
    });
  }, []);

  const removeFromCart = useCallback((cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > (i.maxStock || 999)) return i;
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  }, []);

  const requestPhone = useCallback(() => {
    return new Promise((resolve) => {
      setPendingCheckout(() => resolve);
      setPhoneModalOpen(true);
    });
  }, []);

  const submitPhone = useCallback((phoneNumber) => {
    setPhone(phoneNumber);
    setPhoneModalOpen(false);
    if (pendingCheckout) {
      pendingCheckout(phoneNumber);
      setPendingCheckout(null);
    }
  }, [pendingCheckout]);

  const cancelPhone = useCallback(() => {
    setPhoneModalOpen(false);
    setPendingCheckout(null);
  }, []);

  const requestWhatsAppConfirm = useCallback(() => {
    return new Promise((resolve) => {
      setWhatsappConfirm(() => resolve);
    });
  }, []);

  const confirmWhatsApp = useCallback(() => {
    if (whatsappConfirm) {
      whatsappConfirm(true);
      setWhatsappConfirm(null);
    }
  }, [whatsappConfirm]);

  const cancelWhatsApp = useCallback(() => {
    if (whatsappConfirm) {
      whatsappConfirm(false);
      setWhatsappConfirm(null);
    }
  }, [whatsappConfirm]);

  const checkout = useCallback(async (user, deliveryZone = '', bankInfo = null) => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.type === 'percentage' ? subtotal * appliedCoupon.discount : appliedCoupon.discount;
    }
    const total = Math.max(0, subtotal - discount);

    // Ask for confirmation before opening WhatsApp
    const confirmed = await requestWhatsAppConfirm();
    if (!confirmed) return;

    let message = '🛒 *Nuevo Pedido - Lúa Beauty*\n\n*Productos:*\n';
    cart.forEach(item => {
      const variantText = item.variantName ? ` (${item.variantName})` : '';
      message += `• ${item.nombre}${variantText} x${item.quantity} (ID: ${item.productId}) - $${(item.precio * item.quantity).toLocaleString('es-MX')}\n`;
    });
    message += `\n*Subtotal:* $${subtotal.toLocaleString('es-MX')}\n`;
    if (discount > 0) message += `*Descuento:* -$${discount.toLocaleString('es-MX')}\n`;
    message += `*Total:* $${total.toLocaleString('es-MX')}\n`;
    if (deliveryZone) message += `\n*Zona de entrega:* ${deliveryZone}\n`;
    message += `\n*Método de pago:* Transferencia bancaria / Depósito\n`;
    if (bankInfo) {
      message += `\n*Datos bancarios:*\n`;
      message += `• Banco: ${bankInfo.bank_name}\n`;
      message += `• CLABE: ${bankInfo.bank_clabe}\n`;
      message += `• Cuenta: ${bankInfo.bank_account}\n`;
      message += `• Titular: ${bankInfo.bank_holder}\n`;
    }
    message += `\n*Importante:* Una vez realizado tu depósito, envía tu comprobante por este chat para confirmar tu pedido. ¡Gracias! ✨`;

    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

    // Save order locally
    const order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal, discount, total,
      coupon: appliedCoupon?.code || null,
      status: 'pendiente',
      payment_method: 'transferencia',
      delivery_zone: deliveryZone,
      history: [{ status: 'pendiente', date: new Date().toISOString() }],
    };
    try {
      const history = JSON.parse(localStorage.getItem('lua_orders')) || [];
      history.push(order);
      localStorage.setItem('lua_orders', JSON.stringify(history));
    } catch (_) {}

    // Save order to backend
    const payload = {
      items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, variantName: i.variantName, nombre: i.nombre, precio: i.precio, quantity: i.quantity })),
      subtotal, discount, total,
      coupon: appliedCoupon?.code || null,
      payment_method: 'transferencia',
      delivery_zone: deliveryZone,
    };
    if (user) {
      await fetchApi('/api/orders', 'POST', payload);
    } else {
      let p = phone;
      if (!p) {
        p = await requestPhone();
        if (!p) return;
      }
      payload.phone = p;
      await fetch(`${CONFIG.API_BASE_URL}/api/orders/chatbot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
    }

    setCart([]);
    return total;
  }, [cart, appliedCoupon, phone, requestPhone]);

  const clearCart = useCallback(() => setCart([]), []);

  return (
    <CartContext.Provider value={{ cart, appliedCoupon, setAppliedCoupon, phone, setPhone, addToCart, removeFromCart, updateQuantity, checkout, clearCart, phoneModalOpen, submitPhone, cancelPhone, whatsappConfirm, confirmWhatsApp, cancelWhatsApp }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
