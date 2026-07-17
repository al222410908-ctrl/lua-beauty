import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="premium-card bg-[var(--color-card)] border border-[var(--color-line)]/30 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[3/4] shimmer-bg animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-12 shimmer-bg animate-shimmer rounded" />
        <div className="h-4.5 w-3/4 shimmer-bg animate-shimmer rounded" />
        <div className="h-3.5 w-full shimmer-bg animate-shimmer rounded" />
        <div className="pt-2 flex justify-between items-center">
          <div className="h-5 w-16 shimmer-bg animate-shimmer rounded" />
          <div className="h-3 w-12 shimmer-bg animate-shimmer rounded" />
        </div>
        <div className="h-10 w-full shimmer-bg animate-shimmer rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, wishlist, onToggleWishlist, onSelectProduct, onDirectPurchase }) {
  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16 text-center select-none animate-fade-in">
        <p className="text-sm text-[var(--color-ink-soft)] italic">No encontramos productos en esta categoría por el momento. ✨</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            isWishlisted={wishlist.includes(p.id)}
            onToggleWishlist={onToggleWishlist}
            onSelect={onSelectProduct}
            onDirectPurchase={onDirectPurchase}
          />
        ))}
      </div>
    </section>
  );
}
