import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, ClipboardList, Award, Heart, Loader2 } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const STATUS_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300',
  preparando: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300',
  enviado: 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300',
  entregado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300',
  cancelado: 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300'
};

export default function UserProfile({ currentUser, updateProfile, token, showToast }) {
  const [nombre, setNombre] = useState(currentUser?.nombre || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [telefono, setTelefono] = useState(currentUser?.telefono || '');
  const [direccion, setDireccion] = useState(currentUser?.direccion || '');
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Sync initial values
  useEffect(() => {
    if (currentUser) {
      setNombre(currentUser.nombre || '');
      setEmail(currentUser.email || '');
      setTelefono(currentUser.telefono || '');
      setDireccion(currentUser.direccion || '');
    }
  }, [currentUser]);

  // Load orders history from central database
  const fetchOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el historial');
      setOrders(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile({ nombre, email, telefono, direccion });
    setSaving(false);
  };

  // Loyalty calculations
  const totalOrdersCount = orders.length;
  const currentCyclePurchases = totalOrdersCount % 3;
  const earnedRewards = Math.floor(totalOrdersCount / 3);
  const usedRewards = orders.filter(o => o.coupon === 'LEALTAD10').length;
  const remainingRewards = Math.max(0, earnedRewards - usedRewards);

  return (
    <div className="space-y-8 select-none font-sans">
      <section className="py-6 border-b border-line/30 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-medium text-ink">Mi Perfil</h1>
          <p className="text-xs text-ink-soft mt-1">Gestiona tus datos de envío e historial de compras.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Profile Details Form */}
        <div className="bg-card border border-line/45 rounded-lg p-5 space-y-5 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
            <User className="w-4 h-4 text-terracotta" /> Datos de Envío
          </h2>
          
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ana Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ej. ana@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Teléfono Móvil (WhatsApp)</label>
              <input
                type="tel"
                required
                placeholder="ej. 573001234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Dirección de Entrega</label>
              <textarea
                required
                placeholder="Calle 123 #45-67, Apto 101, Medellín"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4" /> : null}
              <span>{saving ? 'Guardando...' : 'Actualizar mis datos'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Loyalty Progress */}
        <div className="bg-card border border-line/45 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
            <Award className="w-4 h-4 text-terracotta" /> Programa de Lealtad
          </h2>
          
          <p className="text-xs text-ink-soft leading-relaxed">
            Por cada 3 pedidos registrados que realices, obtienes un <strong className="text-terracotta">10% de descuento automático</strong> en tu siguiente compra.
          </p>

          <div className="border-t border-line/20 pt-3 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span>Progreso de ciclo:</span>
              <span className="text-terracotta font-bold">{currentCyclePurchases} / 3 compras</span>
            </div>
            <div className="w-full h-2.5 bg-nude-pale rounded-full overflow-hidden">
              <div
                style={{ width: `${(currentCyclePurchases / 3) * 100}%` }}
                className="h-full bg-terracotta rounded-full"
              />
            </div>

            {remainingRewards > 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded text-xs text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                🎉 ¡Tienes <strong>{remainingRewards}</strong> descuento(s) del 10% disponible(s)! Se aplicará automáticamente en tu próximo checkout.
              </div>
            ) : (
              <p className="text-[10px] text-ink-soft/80 italic">
                Faltan {3 - currentCyclePurchases} compra(s) para tu próximo cupón de lealtad.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Pedidos */}
      <div className="bg-card border border-line/45 rounded-lg p-5 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2 border-b border-line/20 pb-3">
          <ClipboardList className="w-4 h-4 text-terracotta" /> Mis Pedidos
        </h2>

        {loadingOrders ? (
          <div className="py-8 text-center text-ink-soft flex items-center justify-center gap-1.5 text-xs">
            <Loader2 className="w-4 h-4 text-terracotta" />
            <span>Consultando historial...</span>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-xs text-ink-soft/85 italic text-center py-6">No tienes pedidos registrados en tu historial.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border border-line/40 rounded p-4 space-y-3 bg-bg-light/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/20 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs">{o.id}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] || 'bg-line text-ink-soft'}`}>
                      {o.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-ink-soft">
                    {new Date(o.created_at || o.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Column 1: Items */}
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block">Productos</span>
                    <ul className="space-y-0.5">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="text-ink font-semibold">
                          • {it.nombre} x{it.quantity} <span className="font-normal text-ink-soft">({currencyFormatter.format(it.precio)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Total */}
                  <div className="space-y-1 bg-black/5 dark:bg-white/5 p-3 rounded">
                    <div className="flex justify-between text-ink-soft">
                      <span>Subtotal:</span>
                      <span>{currencyFormatter.format(o.subtotal)}</span>
                    </div>
                    {o.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Descuento:</span>
                        <span>-{currencyFormatter.format(o.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-ink border-t border-line/25 pt-1 mt-1">
                      <span>Total:</span>
                      <span>{currencyFormatter.format(o.total)}</span>
                    </div>
                  </div>
                </div>

                {/* History Timeline */}
                {o.history && o.history.length > 1 && (
                  <div className="pt-2 border-t border-line/10">
                    <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Historial de Estado</span>
                    <div className="flex flex-wrap gap-2">
                      {o.history.map((h, hIdx) => (
                        <span key={hIdx} className="text-[9px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-ink-soft flex items-center gap-1">
                          <span className="font-bold uppercase">{h.status}</span>: {new Date(h.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
