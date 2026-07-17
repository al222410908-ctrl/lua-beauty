import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Landmark, DollarSign, MapPin, Building2, CreditCard, Sparkles } from 'lucide-react';

export default function ShopSettings({ token, showToast }) {
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingZones, setSavingZones] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');

  // Payment settings
  const [paymentMethods, setPaymentMethods] = useState(['transferencia', 'efectivo']);
  const [bankName, setBankName] = useState('');
  const [bankClabe, setBankClabe] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');

  // Coupons settings
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');
  const [newCouponDescription, setNewCouponDescription] = useState('');
  const [savingCoupons, setSavingCoupons] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchZones();
    fetchCoupons();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setPaymentMethods(data.payment_methods || ['transferencia', 'efectivo']);
        setBankName(data.bank_name || '');
        setBankClabe(data.bank_clabe || '');
        setBankAccount(data.bank_account || '');
        setBankHolder(data.bank_holder || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/delivery-zones');
      const data = await res.json();
      setDeliveryZones(data);
    } catch (err) {
      console.error('Error fetching zones:', err);
    }
  };

  const savePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          payment_methods: paymentMethods,
          bank_name: bankName,
          bank_clabe: bankClabe,
          bank_account: bankAccount,
          bank_holder: bankHolder,
        }),
      });
      const data = await res.json();
      if (data.success) showToast('Configuración de pago guardada', 'success');
      else showToast('Error al guardar', 'error');
    } catch (err) {
      showToast('Error al guardar', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const togglePaymentMethod = (method) => {
    setPaymentMethods(prev => {
      if (prev.includes(method)) {
        if (prev.length <= 1) return prev;
        return prev.filter(m => m !== method);
      }
      return [...prev, method];
    });
  };

  const addZone = async () => {
    if (!newZoneName.trim()) return;
    setSavingZones(true);
    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: newZoneName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Zona agregada', 'success');
        setNewZoneName('');
        fetchZones();
      } else showToast('Error al agregar zona', 'error');
    } catch {
      showToast('Error al agregar zona', 'error');
    } finally {
      setSavingZones(false);
    }
  };

  const deleteZone = async (id) => {
    try {
      const res = await fetch(`/api/delivery-zones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Zona eliminada', 'success');
        fetchZones();
      } else showToast('Error al eliminar zona', 'error');
    } catch {
      showToast('Error al eliminar zona', 'error');
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCoupons(data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const addCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponDiscount) return;
    setSavingCoupons(true);
    try {
      let discountVal = parseFloat(newCouponDiscount);
      if (newCouponType === 'percentage' && discountVal > 1) {
        discountVal = discountVal / 100;
      }
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discount: discountVal,
          type: newCouponType,
          description: newCouponDescription.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cupón creado con éxito ✨', 'success');
        setNewCouponCode('');
        setNewCouponDiscount('');
        setNewCouponDescription('');
        fetchCoupons();
      } else {
        showToast(data.error || 'Error al agregar cupón', 'error');
      }
    } catch {
      showToast('Error al agregar cupón', 'error');
    } finally {
      setSavingCoupons(false);
    }
  };

  const deleteCoupon = async (code) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cupón desactivado correctamente', 'success');
        fetchCoupons();
      } else {
        showToast(data.error || 'Error al desactivar cupón', 'error');
      }
    } catch {
      showToast('Error al desactivar cupón', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Methods */}
      <section className="bg-card border border-line/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-terracotta" />
          <h2 className="text-lg font-display font-medium">Métodos de Pago</h2>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-ink-soft">Selecciona los métodos de pago disponibles para tus clientes:</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-line/30 hover:bg-bg-light/30 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.includes('transferencia')}
                onChange={() => togglePaymentMethod('transferencia')}
                className="w-4 h-4 accent-terracotta"
              />
              <Landmark className="w-4 h-4 text-ink-soft" />
              <div>
                <p className="text-sm font-semibold">Transferencia bancaria / Depósito</p>
                <p className="text-[10px] text-ink-soft">El cliente paga por transferencia y envía comprobante</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-line/30 hover:bg-bg-light/30 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.includes('efectivo')}
                onChange={() => togglePaymentMethod('efectivo')}
                className="w-4 h-4 accent-terracotta"
              />
              <DollarSign className="w-4 h-4 text-ink-soft" />
              <div>
                <p className="text-sm font-semibold">Efectivo contra entrega</p>
                <p className="text-[10px] text-ink-soft">El cliente paga en efectivo al recibir el pedido</p>
              </div>
            </label>
          </div>
        </div>

        {paymentMethods.includes('transferencia') && (
          <div className="mt-6 pt-6 border-t border-line/30 space-y-4">
            <h3 className="text-sm font-display font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Datos bancarios para transferencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                  placeholder="Ej. BBVA, Banamex, Santander..."
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">CLABE (18 dígitos)</label>
                <input
                  type="text"
                  value={bankClabe}
                  onChange={e => setBankClabe(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                  placeholder="012180015738654321"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Número de cuenta</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                  placeholder="1573865432"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Titular de la cuenta</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={e => setBankHolder(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
                  placeholder="Lúa Beauty México"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={savePaymentSettings}
          disabled={savingPayment}
          className="mt-6 px-5 py-2.5 rounded bg-terracotta text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {savingPayment ? 'Guardando...' : 'Guardar configuración de pago'}
        </button>
      </section>

      {/* Delivery Zones */}
      <section className="bg-card border border-line/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-5 h-5 text-terracotta" />
          <h2 className="text-lg font-display font-medium">Zonas de Entrega</h2>
        </div>

        <p className="text-xs text-ink-soft mb-4">Las entregas son sin costo dentro de estas zonas. Agrega o elimina zonas según tu cobertura.</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newZoneName}
            onChange={e => setNewZoneName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addZone()}
            className="flex-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta"
            placeholder="Nombre de la zona (ej. Centro)"
          />
          <button
            onClick={addZone}
            disabled={savingZones || !newZoneName.trim()}
            className="px-4 py-2 rounded bg-terracotta text-white text-xs font-bold cursor-pointer hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        <div className="space-y-2">
          {deliveryZones.length === 0 ? (
            <p className="text-xs text-ink-soft italic">No hay zonas de entrega configuradas</p>
          ) : (
            deliveryZones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-3 rounded-lg border border-line/30 hover:bg-bg-light/30">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-ink-soft" />
                  <div>
                    <p className="text-sm font-semibold">{zone.nombre}</p>
                    {zone.descripcion && <p className="text-[10px] text-ink-soft">{zone.descripcion}</p>}
                  </div>
                </div>
                <button
                  onClick={() => deleteZone(zone.id)}
                  className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 cursor-pointer transition-colors"
                  title="Eliminar zona"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Coupons Administration */}
      <section className="bg-card border border-line/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-terracotta" />
          <h2 className="text-lg font-display font-medium">Cupones de Descuento</h2>
        </div>

        <p className="text-xs text-ink-soft mb-4">Genera cupones para aplicar descuentos en el catálogo de clientes. El código se autoconvierte a mayúsculas.</p>

        <form onSubmit={addCoupon} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div>
              <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">Código del Cupón</label>
              <input
                type="text"
                required
                value={newCouponCode}
                onChange={e => setNewCouponCode(e.target.value)}
                className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink"
                placeholder="Ej. BIENVENIDA"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">Tipo de Descuento</label>
              <select
                value={newCouponType}
                onChange={e => setNewCouponType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-line bg-[var(--color-card)] text-[var(--color-ink)] text-sm focus:outline-none focus:border-terracotta cursor-pointer"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">Valor del Descuento</label>
              <input
                type="number"
                required
                step="any"
                value={newCouponDiscount}
                onChange={e => setNewCouponDiscount(e.target.value)}
                className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink"
                placeholder={newCouponType === 'percentage' ? 'Ej. 10 para 10%' : 'Ej. 50 para $50'}
              />
            </div>
          </div>

          <div className="text-left">
            <label className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">Descripción Corta</label>
            <input
              type="text"
              value={newCouponDescription}
              onChange={e => setNewCouponDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta text-ink"
              placeholder="Ej. 10% de descuento en toda tu compra"
            />
          </div>

          <button
            type="submit"
            disabled={savingCoupons || !newCouponCode.trim() || !newCouponDiscount}
            className="px-4 py-2.5 rounded bg-terracotta text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {savingCoupons ? 'Creando...' : 'Crear Cupón'}
          </button>
        </form>

        <div className="space-y-2.5 border-t border-line/30 pt-6">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 text-left">Cupones Activos</h3>
          {coupons.length === 0 ? (
            <p className="text-xs text-ink-soft italic text-left">No hay cupones activos actualmente</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map(c => (
                <div key={c.code} className="flex items-center justify-between p-3.5 rounded-xl border border-line/30 bg-bg-light/30">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink bg-line/40 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600">
                        {c.type === 'percentage' ? `${Math.round(c.discount * 100)}% Off` : `$${c.discount} Off`}
                      </span>
                    </div>
                    {c.description && <p className="text-[10px] text-ink-soft">{c.description}</p>}
                  </div>
                  <button
                    onClick={() => deleteCoupon(c.code)}
                    className="p-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 cursor-pointer transition-colors"
                    title="Desactivar cupón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}