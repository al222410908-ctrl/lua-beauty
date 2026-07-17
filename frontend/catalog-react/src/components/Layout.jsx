import { useState } from 'react';
import { Search, ShoppingCart, User, Sun, Moon, X, Heart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';

function SearchSuggestions({ query, products, onSelect, onClose }) {
  if (!query) return null;

  const matches = (products || []).filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase()) ||
    p.categoria.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (matches.length === 0) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-card)] border border-[var(--color-line)]/50 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-[var(--color-line)]/20 animate-fade-in"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {matches.map(p => (
        <button
          key={p.id}
          onClick={() => {
            onSelect(p);
            onClose();
          }}
          className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[var(--color-terracotta)]/5 dark:hover:bg-[var(--color-terracotta)]/10 transition-colors cursor-pointer"
        >
          {p.url_imagen ? (
            <img src={p.url_imagen} alt={p.nombre} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--color-terracotta)]/15 text-[var(--color-terracotta)] flex items-center justify-center font-bold text-xs font-[Fraunces]">
              {p.nombre[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--color-ink)] truncate">{p.nombre}</p>
            <p className="text-[9px] text-[var(--color-ink-soft)] uppercase tracking-wider">{p.categoria}</p>
          </div>
          <span className="text-xs font-extrabold text-[var(--color-ink)]">
            ${p.precio}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function Layout({ products, onSelectProduct, searchQuery, setSearchQuery, onCartClick, onPhoneLookupClick, onWishlistClick, wishlistCount = 0 }) {
  const { theme, toggleTheme } = useTheme();
  const { cart } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)]/25 backdrop-blur-md bg-[var(--color-bg)]/80 transition-all select-none">
      <div className="max-w-6xl mx-auto px-4 py-3.5 grid grid-cols-2 sm:grid-cols-3 items-center gap-4">
        {/* Brand logo left */}
        <div className="justify-self-start">
          <a href="/" className="text-xl font-bold tracking-wider font-[Fraunces] italic text-[var(--color-ink)] no-underline">
            Lúa Beauty
          </a>
        </div>

        {/* Centered search input capsule */}
        <div className="hidden sm:flex w-full max-w-xs md:max-w-sm relative justify-self-center">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-full border border-[var(--color-line)]/65 bg-[var(--color-card)] text-xs focus:outline-none focus:border-[var(--color-terracotta)] text-[var(--color-ink)] transition-all placeholder:text-[var(--color-ink-soft)]/50 focus:shadow-sm"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-soft)]/70 stroke-[1.5]" />
          
          <SearchSuggestions
            query={searchQuery}
            products={products}
            onSelect={onSelectProduct}
            onClose={() => setSearchQuery('')}
          />
        </div>

        {/* Action icons right */}
        <div className="justify-self-end flex items-center gap-1 sm:gap-2">
          <button onClick={() => setMobileSearchOpen(true)} className="sm:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Buscar">
            <Search className="w-5 h-5 text-[var(--color-ink)] stroke-[1.5]" />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Tema">
            {theme === 'light' ? <Moon className="w-5 h-5 text-[var(--color-ink)] stroke-[1.5]" /> : <Sun className="w-5 h-5 text-[var(--color-ink)] stroke-[1.5]" />}
          </button>

          {/* Wishlist button with badge */}
          <button onClick={onWishlistClick} className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Mis Favoritos">
            <Heart className={`w-5 h-5 stroke-[1.5] transition-colors ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-[var(--color-ink)]'}`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[var(--color-bg)]">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </button>

          <button onClick={onCartClick} className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Carrito">
            <ShoppingCart className="w-5 h-5 text-[var(--color-ink)] stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--color-terracotta)] text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[var(--color-bg)]">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Phone Lookup — ver mis pedidos */}
          <button
            onClick={onPhoneLookupClick}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            title="Mis Pedidos"
          >
            <User className="w-5 h-5 text-[var(--color-ink)] stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-[var(--color-line)]/20 px-4 py-2.5 bg-[var(--color-bg)] animate-fade-in relative z-50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-4 pr-10 py-2 rounded-full border border-[var(--color-line)] bg-[var(--color-card)] text-xs focus:outline-none focus:border-[var(--color-terracotta)] text-[var(--color-ink)]"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-soft)]/70 stroke-[1.5]" />
              
              <SearchSuggestions
                query={searchQuery}
                products={products}
                onSelect={onSelectProduct}
                onClose={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
              />
            </div>
            <button onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }} className="p-2 cursor-pointer transition-colors" title="Cerrar">
              <X className="w-4.5 h-4.5 text-[var(--color-ink-soft)] stroke-[1.5]" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
