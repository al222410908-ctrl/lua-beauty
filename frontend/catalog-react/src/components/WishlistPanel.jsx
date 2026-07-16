import { Heart, X, ShoppingCart, Eye } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

export default function WishlistPanel({ wishlist, products, onClose, onToggleWishlist, onSelectProduct, onDirectPurchase }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Mis Favoritos">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm h-full flex flex-col shadow-2xl animate-slide-in-right overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(255,236,245,0.97) 0%, rgba(255,248,252,0.98) 50%, rgba(255,240,248,0.97) 100%)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(210,160,190,0.3)',
        }}
      >
        {/* Decorative top bar */}
        <div className="h-1 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg,#C8638A,#E8A0BF,#C8638A)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#C8638A,#B0507A)', boxShadow: '0 4px 12px rgba(180,80,120,0.35)' }}
            >
              <Heart className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <div>
              <h2 className="font-[Fraunces] text-base font-semibold" style={{ color: '#6B2A50' }}>
                Mis Favoritos
              </h2>
              <p className="text-[10px]" style={{ color: '#B07090' }}>
                {wishlistProducts.length === 0
                  ? 'Sin productos guardados'
                  : `${wishlistProducts.length} producto${wishlistProducts.length !== 1 ? 's' : ''} guardado${wishlistProducts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(180,100,140,0.12)' }}
            title="Cerrar"
          >
            <X className="w-4 h-4" style={{ color: '#8B3A6B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {wishlistProducts.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full pb-16 text-center px-6 gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(200,100,140,0.1)', border: '1.5px dashed rgba(200,100,140,0.4)' }}
              >
                <Heart className="w-9 h-9" style={{ color: '#C8638A', opacity: 0.5 }} />
              </div>
              <div>
                <p className="font-[Fraunces] text-base font-semibold mb-1" style={{ color: '#6B2A50' }}>
                  Aún sin favoritos
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#B07090' }}>
                  Toca el corazón ❤️ en cualquier producto para guardarlo aquí y acceder a él rápidamente.
                </p>
              </div>
            </div>
          ) : (
            wishlistProducts.map(product => (
              <WishlistItem
                key={product.id}
                product={product}
                onRemove={() => onToggleWishlist(product.id)}
                onView={() => { onSelectProduct(product); onClose(); }}
                onBuy={() => { onDirectPurchase(product); onClose(); }}
              />
            ))
          )}
        </div>

        {/* Footer — clear all */}
        {wishlistProducts.length > 0 && (
          <div
            className="flex-shrink-0 px-5 py-4 border-t"
            style={{ borderColor: 'rgba(210,160,190,0.25)' }}
          >
            <button
              onClick={() => {
                wishlistProducts.forEach(p => onToggleWishlist(p.id));
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'rgba(200,100,140,0.1)', color: '#8B3A6B', border: '1px solid rgba(200,100,140,0.25)' }}
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Single wishlist item ──────────────────────────────────────── */
function WishlistItem({ product, onRemove, onView, onBuy }) {
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden flex gap-0 group transition-all hover:shadow-md"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(210,160,190,0.25)',
        boxShadow: '0 2px 12px rgba(180,80,130,0.06)',
      }}
    >
      {/* Product image */}
      <div
        className="w-24 h-24 flex-shrink-0 relative overflow-hidden cursor-pointer"
        onClick={onView}
      >
        {product.url_imagen ? (
          <img
            src={product.url_imagen}
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#e8c5d8,#c8638a)' }}
          >
            <span className="text-white font-bold text-lg font-[Fraunces] italic">
              {product.nombre[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className="text-[8px] uppercase tracking-widest font-bold block mb-0.5"
              style={{ color: '#C8638A' }}
            >
              {product.categoria}
            </span>
            <h4
              className="font-[Fraunces] text-sm font-semibold leading-tight line-clamp-2 cursor-pointer hover:underline"
              style={{ color: '#4A1A38' }}
              onClick={onView}
            >
              {product.nombre}
            </h4>
          </div>
          {/* Remove button */}
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90 mt-0.5"
            style={{ background: 'rgba(200,100,140,0.1)' }}
            title="Quitar de favoritos"
          >
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="font-extrabold text-sm" style={{ color: '#4A1A38' }}>
            ${product.precio?.toFixed(2)}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onView}
              className="p-1.5 rounded-lg cursor-pointer transition-all hover:scale-110 active:scale-90"
              style={{ background: 'rgba(200,100,140,0.12)', color: '#8B3A6B' }}
              title="Ver detalle"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              onClick={onBuy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-all hover:scale-105 active:scale-95 text-white"
              style={{ background: 'linear-gradient(135deg,#211C18,#A6694B)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              title="Apartar por WhatsApp"
            >
              📱 Apartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
