import { Heart, Eye, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

export default function ProductCard({ product, isWishlisted, onToggleWishlist, onSelect, onDirectPurchase }) {
  const { addToCart, cart } = useCart();
  const { showToast } = useToast();
  const hasVariants = product.variants && product.variants.length > 0;
  const inCart = cart.find(i => i.productId === product.id);
  const catColors = {
    rimels: 'from-stone-700 to-stone-900',
    bases: 'from-[#ebd4be] to-[#b59276]',
    skincare: 'from-[#eef1e4] to-[#b9c6a3]',
    labiales: 'from-rose-400 to-red-800',
  };

  return (
    <article className="premium-card bg-[var(--color-card)] border border-[var(--color-line)]/35 rounded-xl overflow-hidden group animate-fade-in-up flex flex-col">
      {/* 70% Product Image Box */}
      <div 
        className="relative aspect-[3/4] bg-[var(--color-bg-deep)] overflow-hidden cursor-pointer" 
        onClick={() => onSelect(product)}
      >
        {product.url_imagen ? (
          <img
            src={product.url_imagen}
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${catColors[product.categoria] || 'from-gray-300 to-gray-400'} flex items-center justify-center`}>
            <span className="text-white/90 text-3xl font-bold font-[Fraunces] italic">{product.nombre[0]}</span>
          </div>
        )}

        {/* Hover image detail overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur-md text-[9px] uppercase font-bold tracking-widest text-[#211C18] px-3 py-1.5 rounded-full border border-[var(--color-line)]/40 shadow-sm transition-transform duration-300 translate-y-3 group-hover:translate-y-0">
            Vista Rápida
          </span>
        </div>

        {/* Top Badges */}
        {hasVariants && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[8px] font-extrabold uppercase tracking-wider text-[#211C18] px-2 py-0.5 rounded-md border border-[var(--color-line)]/45 shadow-sm select-none">
            +{product.variants.length} tonos
          </span>
        )}
        {product.stock < 5 && product.stock > 0 && !hasVariants && (
          <span className="absolute top-3 left-3 bg-[#A6694B] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm select-none">
            Últimas {product.stock}
          </span>
        )}
        {product.stock === 0 && !hasVariants && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm select-none">
            Agotado
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/95 hover:bg-white cursor-pointer transition-all shadow-sm active:scale-90"
        >
          <Heart className={`w-3.5 h-3.5 stroke-[1.5] ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Info details */}
      <div className="p-4 flex flex-col flex-1 gap-2 bg-[var(--color-card)]">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
          <span className="text-[var(--color-terracotta)] tracking-[0.2em]">
            {product.categoria}
          </span>
          <span className={`${product.stock > 0 ? 'text-[var(--color-ink-soft)]' : 'text-rose-600'} font-sans normal-case`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          </span>
        </div>
        <h3 
          className="font-[Fraunces] text-sm font-semibold text-[var(--color-ink)] leading-snug cursor-pointer hover:text-[var(--color-terracotta)] transition-colors line-clamp-1"
          onClick={() => onSelect(product)}
        >
          {product.nombre}
        </h3>
        {product.descripcion && (
          <p className="text-[10.5px] text-[var(--color-ink-soft)] line-clamp-2 leading-relaxed min-h-[32px]">
            {product.descripcion}
          </p>
        )}

        <div className="mt-auto pt-2.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-[var(--color-ink)]">{formatPrice(product.precio)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(product); }}
              className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-ink-soft)] hover:text-[var(--color-terracotta)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              Detalles
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Agregar al Carrito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasVariants) {
                  onSelect(product);
                } else {
                  addToCart(product);
                  showToast(`${product.nombre} agregado al carrito 🛒`, 'success');
                }
              }}
              className="w-full h-10 rounded-xl bg-[var(--color-terracotta)] text-white hover:opacity-95 flex items-center justify-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest cursor-pointer shadow-sm transition-all duration-300 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
              <span>Agregar al Carrito</span>
            </button>

            {/* Pedir por WhatsApp Premium Action CTA */}
            <button
              onClick={(e) => { e.stopPropagation(); onDirectPurchase(product); }}
              className="w-full h-10 rounded-xl bg-[#211C18] text-white dark:bg-[#FAF6EF] dark:text-[#211C18] hover:bg-[#A6694B] dark:hover:bg-[#A6694B] dark:hover:text-white flex items-center justify-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest cursor-pointer shadow-sm transition-all duration-300 active:scale-95"
            >
              <span>📱 Apartar por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
