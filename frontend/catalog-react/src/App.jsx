import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, X, CreditCard, Landmark, Banknote, MapPin } from 'lucide-react';
import { fetchProducts, fetchSettings } from './lib/api';
import { CONFIG } from './config';

import { useTheme } from './contexts/ThemeContext';
import { useCart } from './contexts/CartContext';
import Layout from './components/Layout';
import Hero from './components/Hero';
import SwatchNav from './components/SwatchNav';
import SearchFilters from './components/SearchFilters';
import ProductGrid from './components/ProductGrid';
import CartPanel from './components/CartPanel';
import PhoneLookupModal from './components/PhoneLookupModal';
import ProductDetailModal from './components/ProductDetailModal';
import OrdersPanel from './components/OrdersPanel';
import PhoneModal from './components/PhoneModal';
import WhatsAppConfirmModal from './components/WhatsAppConfirmModal';
import LoyaltySection from './components/LoyaltySection';

import WishlistPanel from './components/WishlistPanel';

/* ── Community WhatsApp group link ───────────────────────────────────────── */
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/LUA_BEAUTY_GROUP_LINK'; // ← reemplaza con el link real

/* ── Policies modal ──────────────────────────────────────────────────────── */
function PoliciesModal({ onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['🛒 Proceso de Compra', '💳 Métodos de Pago', '📍 Puntos de Entrega'];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Glassmorphism panel */}
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(255,236,245,0.92) 0%, rgba(255,248,252,0.95) 50%, rgba(255,240,248,0.92) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(210,160,190,0.35)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-[Fraunces] text-lg font-semibold" style={{ color: '#8B3A6B' }}>
              Información Importante
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#B07090' }}>Políticas & Puntos de Entrega</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
            style={{ background: 'rgba(180,100,140,0.15)' }}
          >
            <X className="w-4 h-4" style={{ color: '#8B3A6B' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all"
              style={activeTab === i
                ? { background: 'linear-gradient(135deg,#C8638A,#B0507A)', color: '#fff', boxShadow: '0 2px 8px rgba(180,80,120,0.35)' }
                : { background: 'rgba(200,100,140,0.12)', color: '#8B3A6B' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-6 min-h-[180px]">
          {activeTab === 0 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(200,100,140,0.08)', border: '1px solid rgba(200,100,140,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#8B3A6B' }}>💰 Anticipo de $70 MXN por producto</p>
                <p className="text-xs leading-relaxed" style={{ color: '#704060' }}>
                  Para realizar tu pedido con el proveedor se requiere un anticipo de <strong>$70 MXN por artículo</strong>. Una vez confirmado el anticipo, tu producto queda apartado y se hace el pedido.
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(200,100,140,0.08)', border: '1px solid rgba(200,100,140,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#8B3A6B' }}>📦 Liquidación y Entrega</p>
                <p className="text-xs leading-relaxed" style={{ color: '#704060' }}>
                  El resto del costo se liquida al momento de la entrega. El tiempo estimado de llegada con el proveedor es de <strong>1 a 2 semanas</strong>.
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(240,80,80,0.07)', border: '1px solid rgba(240,80,80,0.2)' }}>
                <p className="text-xs font-bold mb-1 text-rose-700">❌ Cancelaciones</p>
                <p className="text-xs leading-relaxed text-rose-800">
                  El anticipo <strong>no es reembolsable</strong>, ya que se usa directamente para el pedido al proveedor. Por favor confirma bien tu selección antes de apartar.
                </p>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="grid grid-cols-3 gap-3 mt-1">
              {[
                { icon: <CreditCard className="w-6 h-6" />, title: 'Tarjeta', sub: 'Crédito / Débito', note: 'Vía terminal o pago en línea' },
                { icon: <Landmark className="w-6 h-6" />, title: 'Transferencia', sub: 'Bancaria / SPEI', note: 'CLABE disponible por WhatsApp' },
                { icon: <Banknote className="w-6 h-6" />, title: 'Efectivo', sub: 'En mano', note: 'Al momento de la entrega' },
              ].map((m, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-xl text-center gap-2"
                  style={{ background: 'rgba(200,100,140,0.09)', border: '1px solid rgba(200,100,140,0.18)' }}>
                  <div style={{ color: '#C8638A' }}>{m.icon}</div>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: '#8B3A6B' }}>{m.title}</p>
                    <p className="text-[9px]" style={{ color: '#B07090' }}>{m.sub}</p>
                    <p className="text-[9px] mt-1" style={{ color: '#A06080' }}>{m.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-2 mt-1">
              {[
                { place: 'Kinder de Rinconada', icon: '🏫' },
                { place: 'Kiosco de Villa', icon: '🏪' },
                { place: 'Kiosco de Xona', icon: '🏪' },
                { place: 'Zolotepec', icon: '📍' },
              ].map((loc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(200,100,140,0.09)', border: '1px solid rgba(200,100,140,0.18)' }}>
                  <span className="text-xl">{loc.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#8B3A6B' }}>{loc.place}</p>
                    <p className="text-[10px]" style={{ color: '#B07090' }}>Punto de entrega</p>
                  </div>
                  <MapPin className="w-4 h-4 ml-auto" style={{ color: '#C8638A' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Community banner with SVG QR placeholder ───────────────────────────── */
function CommunityBanner() {
  return (
    <section className="w-full px-4 py-8 flex justify-center">
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(255,228,240,0.9) 0%, rgba(255,245,250,0.95) 50%, rgba(255,230,242,0.9) 100%)',
          border: '1px solid rgba(210,160,190,0.4)',
          boxShadow: '0 8px 32px rgba(180,80,130,0.12)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Decorative top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#C8638A,#E8A0BF,#C8638A)' }} />

        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          {/* QR Code SVG */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div
              className="w-28 h-28 rounded-xl flex items-center justify-center p-2"
              style={{ background: '#fff', boxShadow: '0 4px 16px rgba(180,80,130,0.15)' }}
            >
              {/* Minimal decorative QR-like SVG */}
              <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Top-left corner block */}
                <rect x="4" y="4" width="22" height="22" rx="3" stroke="#C8638A" strokeWidth="3.5" fill="none"/>
                <rect x="10" y="10" width="10" height="10" rx="1.5" fill="#C8638A"/>
                {/* Top-right corner block */}
                <rect x="54" y="4" width="22" height="22" rx="3" stroke="#C8638A" strokeWidth="3.5" fill="none"/>
                <rect x="60" y="10" width="10" height="10" rx="1.5" fill="#C8638A"/>
                {/* Bottom-left corner block */}
                <rect x="4" y="54" width="22" height="22" rx="3" stroke="#C8638A" strokeWidth="3.5" fill="none"/>
                <rect x="10" y="60" width="10" height="10" rx="1.5" fill="#C8638A"/>
                {/* Data dots pattern */}
                <rect x="34" y="4" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="42" y="4" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="34" y="12" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="42" y="12" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="34" y="20" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="42" y="20" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="4" y="34" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="12" y="34" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="20" y="34" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="4" y="42" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="12" y="42" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="20" y="42" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="34" y="34" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="42" y="34" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="50" y="34" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="58" y="34" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="66" y="34" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="34" y="42" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="42" y="42" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="50" y="42" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="58" y="42" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="66" y="42" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="34" y="50" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="42" y="58" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="50" y="50" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="58" y="58" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="66" y="50" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="34" y="66" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="42" y="66" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="50" y="66" width="6" height="6" rx="1" fill="#C8638A"/>
                <rect x="58" y="66" width="6" height="6" rx="1" fill="#E8A0BF"/>
                <rect x="66" y="66" width="6" height="6" rx="1" fill="#C8638A"/>
              </svg>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#C8638A' }}>Escanea el QR</p>
          </div>

          {/* Text content */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#C8638A' }}>
              ✨ Comunidad Exclusiva
            </p>
            <h3 className="font-[Fraunces] text-xl font-semibold mb-1" style={{ color: '#6B2A50' }}>
              Únete a nuestro grupo de WhatsApp
            </h3>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#8B5070' }}>
              Recibe primero los lanzamientos, promociones y stock de <strong>elf, NIX, PIXI, Maybelline & L'Oréal</strong>. ¡Sé la primera en enterarte!
            </p>
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white no-underline transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 16px rgba(37,211,102,0.35)' }}
            >
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Unirme al grupo en un clic
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const { theme } = useTheme();
  const { phoneModalOpen, submitPhone, cancelPhone, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showCart, setShowCart] = useState(false);
  const [showPhoneLookup, setShowPhoneLookup] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lua_wishlist')) || []; }
    catch { return []; }
  });

  const [paymentStatus, setPaymentStatus] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pago') || null;
  });

  // Direct purchase → if no variants, open WhatsApp with pre-order message directly
  const handleDirectPurchase = (product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
    } else {
      const msg = encodeURIComponent(
        `¡Hola! Me interesa apartar el ${product.nombre}. Estoy de acuerdo con el anticipo de $70 MXN para que se realice el pedido con el proveedor. Quedo atenta para coordinar la liquidación y la entrega.`
      );
      window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    }
  };

  useEffect(() => {
    if (paymentStatus) {
      const timer = setTimeout(() => setPaymentStatus(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  useEffect(() => {
    localStorage.setItem('lua_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    fetchSettings().then(data => {
      if (data?.whatsapp_number) CONFIG.WHATSAPP_NUMBER = data.whatsapp_number;
    }).catch(() => {});
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const categories = [...new Set(products.map(p => p.categoria))];
  const filtered = products.filter(p => {
    if (activeCategory !== 'todos' && p.categoria !== activeCategory) return false;
    if (searchQuery && !p.nombre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.precio - b.precio;
    if (sortBy === 'price-desc') return b.precio - a.precio;
    if (sortBy === 'name') return a.nombre.localeCompare(b.nombre);
    return 0;
  });

  return (
    <>
      {/* Payment status toast */}
      {paymentStatus && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 animate-fade-in ${
          paymentStatus === 'exito' ? 'bg-emerald-600 text-white' :
          paymentStatus === 'fallo' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
        }`}>
          {paymentStatus === 'exito' ? <CheckCircle className="w-4 h-4" /> :
           paymentStatus === 'fallo' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          {paymentStatus === 'exito' ? '¡Pago exitoso! Pronto recibirás confirmación.' :
           paymentStatus === 'fallo' ? 'El pago no pudo completarse. Intenta de nuevo.' :
           'Pago pendiente. Te notificaremos cuando se confirme.'}
        </div>
      )}

      <Layout
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCartClick={() => setShowCart(true)}
        onPhoneLookupClick={() => setShowPhoneLookup(true)}
        onWishlistClick={() => setShowWishlist(true)}
        wishlistCount={wishlist.length}
      />
      <Hero />
      <SwatchNav
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />
      <SearchFilters
        sortBy={sortBy}
        onChangeSort={setSortBy}
      />
      <ProductGrid
        products={filtered}
        loading={loading}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
        onSelectProduct={setSelectedProduct}
        onDirectPurchase={handleDirectPurchase}
      />
      <LoyaltySection />


      {/* Community banner */}
      <CommunityBanner />

      {/* Policies section — desktop version (visible on sm+) */}
      <section className="hidden sm:block w-full px-4 pb-12 max-w-2xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,228,240,0.85) 0%, rgba(255,248,252,0.92) 100%)',
            border: '1px solid rgba(210,160,190,0.35)',
            boxShadow: '0 8px 32px rgba(180,80,130,0.10)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#C8638A,#E8A0BF,#C8638A)' }} />
          <div className="p-6">
            <h3 className="font-[Fraunces] text-lg font-semibold mb-1" style={{ color: '#6B2A50' }}>📌 Información de Compra</h3>
            <p className="text-xs mb-4" style={{ color: '#B07090' }}>Políticas, pagos y puntos de entrega</p>
            <div className="grid grid-cols-3 gap-4">
              {/* Proceso */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8638A' }}>🛒 Proceso</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#704060' }}>Anticipo de <strong>$70 MXN</strong> por producto. Liquidación al recibir. Tiempo estimado: 1–2 semanas.</p>
                <p className="text-[10px] text-rose-700 font-semibold">❌ Anticipo no reembolsable</p>
              </div>
              {/* Pagos */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8638A' }}>💳 Pagos</p>
                <div className="space-y-1">
                  {['💳 Tarjeta (crédito/débito)', '🏦 Transferencia / SPEI', '💵 Efectivo en entrega'].map(m => (
                    <p key={m} className="text-[11px]" style={{ color: '#704060' }}>{m}</p>
                  ))}
                </div>
              </div>
              {/* Entrega */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8638A' }}>📍 Entrega</p>
                <div className="space-y-1">
                  {['🏫 Kinder de Rinconada', '🏪 Kiosco de Villa', '🏪 Kiosco de Xona', '📍 Zolotepec'].map(l => (
                    <p key={l} className="text-[11px]" style={{ color: '#704060' }}>{l}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showCart && <CartPanel onClose={() => setShowCart(false)} />}
      {showPhoneLookup && <PhoneLookupModal onClose={() => setShowPhoneLookup(false)} />}
      {showOrders && <OrdersPanel onClose={() => setShowOrders(false)} />}
      {showWishlist && (
        <WishlistPanel
          wishlist={wishlist}
          products={products}
          onClose={() => setShowWishlist(false)}
          onToggleWishlist={toggleWishlist}
          onSelectProduct={setSelectedProduct}
          onDirectPurchase={handleDirectPurchase}
        />
      )}
      {phoneModalOpen && <PhoneModal onClose={cancelPhone} onSubmit={submitPhone} />}
      <WhatsAppConfirmModal />
      {showPolicies && <PoliciesModal onClose={() => setShowPolicies(false)} />}

      {/* Floating button — Mis Pedidos (left) */}
      <button
        onClick={() => setShowPhoneLookup(true)}
        className="fixed bottom-6 left-6 z-30 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[var(--color-card)] border border-[var(--color-line)] shadow-lg cursor-pointer transition-all hover:shadow-xl active:scale-95 text-[10px] font-bold text-[var(--color-ink)]"
        title="Mis Pedidos"
      >
        <span>📦</span>
        <span className="hidden sm:inline">Mis Pedidos</span>
      </button>

      {/* Floating button — Policies (right, visible on mobile) */}
      <button
        onClick={() => setShowPolicies(true)}
        className="sm:hidden fixed bottom-6 right-6 z-30 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95 text-[10px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#C8638A,#B0507A)', boxShadow: '0 4px 20px rgba(180,80,130,0.4)' }}
        title="Información Importante"
      >
        <span>📌</span>
        <span>Info</span>
      </button>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
