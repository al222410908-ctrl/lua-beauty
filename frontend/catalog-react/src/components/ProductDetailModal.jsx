import { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, MessageCircle, Check } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { fetchApi } from '../lib/api';
import { CONFIG } from '../config';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [fullProduct, setFullProduct] = useState(product);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lua_reviews_' + product.id)) || []; }
    catch { return []; }
  });
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    if (!product.variants) {
      fetchApi(`/api/products/${product.id}`).then(data => {
        setFullProduct(data);
        setSelectedVariant(data.variants?.[0] || null);
      }).catch(() => {});
    } else {
      setFullProduct(product);
      setSelectedVariant(product.variants?.[0] || null);
    }
  }, [product.id]);

  const variants = fullProduct.variants || [];
  const hasVariants = variants.length > 0;
  const currentVariant = hasVariants ? (selectedVariant || variants[0]) : null;
  const currentPrice = currentVariant ? fullProduct.precio + (currentVariant.extra_price || 0) : fullProduct.precio;
  const currentStock = currentVariant ? currentVariant.stock : fullProduct.stock;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewAuthor || !reviewText) return;
    const newReview = { author: reviewAuthor, rating: reviewRating, text: reviewText, date: new Date().toISOString() };
    const updated = [...reviews, newReview];
    setReviews(updated);
    localStorage.setItem('lua_reviews_' + fullProduct.id, JSON.stringify(updated));
    setReviewAuthor('');
    setReviewText('');
    setReviewRating(5);
  };

  const productName = `${fullProduct.nombre}${currentVariant ? ` (${currentVariant.nombre})` : ''}`;
  const whatsappLink = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola! Me interesa apartar el ${productName}. Estoy de acuerdo con el anticipo de $70 MXN para que se realice el pedido con el proveedor. Quedo atenta para coordinar la liquidación y la entrega.`)}`;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAddToCart = () => {
    addToCart(fullProduct, currentVariant);
    const name = currentVariant ? `${fullProduct.nombre} (${currentVariant.nombre})` : fullProduct.nombre;
    showToast(`${name} agregado al carrito`, 'success');
    onClose();
  };  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col"
          style={{
            background: 'linear-gradient(160deg, rgba(255,244,250,0.98) 0%, rgba(255,255,255,1) 60%, rgba(255,248,252,0.98) 100%)',
            border: '1px solid rgba(220,160,190,0.3)',
          }}
        >
          {/* Decorative Top Accent Bar */}
          <div className="h-1.5 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg,#C8638A,#E8A0BF,#C8638A)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)]/40 flex-shrink-0">
            <h3 className="font-[Fraunces] text-base md:text-lg font-semibold" style={{ color: '#4A1A38' }}>
              Detalle del Producto
            </h3>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-90"
              style={{ background: 'rgba(180,100,140,0.12)' }}
              title="Cerrar"
            >
              <X className="w-4.5 h-4.5" style={{ color: '#8B3A6B' }} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Product Image */}
              <div 
                className="aspect-[3/4] rounded-2xl bg-[var(--color-bg-deep)] overflow-hidden shadow-md border"
                style={{ borderColor: 'rgba(210,160,190,0.2)' }}
              >
                {fullProduct.url_imagen ? (
                  <img src={fullProduct.url_imagen} alt={fullProduct.nombre} className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl font-bold font-[Fraunces] italic" style={{ background: 'linear-gradient(135deg,#e8c5d8,#c8638a)', color: '#fff' }}>
                    {fullProduct.nombre[0]}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                {/* Category & Stock Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full border"
                    style={{ background: 'rgba(200,100,140,0.06)', borderColor: 'rgba(200,100,140,0.25)', color: '#C8638A' }}
                  >
                    {fullProduct.categoria}
                  </span>
                  <span 
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      currentStock <= 0 
                        ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                        : currentStock < 5 
                        ? 'bg-amber-50 border border-amber-200 text-amber-700' 
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {currentStock <= 0 ? 'Disponible bajo apartado' : `${currentStock} en stock`}
                  </span>
                </div>

                <h2 className="font-[Fraunces] text-xl md:text-2xl font-bold leading-tight" style={{ color: '#3A1228' }}>
                  {fullProduct.nombre}
                </h2>

                {fullProduct.descripcion && (
                  <p className="text-xs leading-relaxed" style={{ color: '#704060' }}>
                    {fullProduct.descripcion}
                  </p>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold" style={{ color: '#3A1228' }}>
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-[10px]" style={{ color: '#B07090' }}>MXN</span>
                </div>

                {/* Variants Selection */}
                {hasVariants && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#8B3A6B' }}>
                      {fullProduct.categoria === 'bases' ? 'Tono' : fullProduct.categoria === 'labiales' ? 'Tono' : fullProduct.categoria === 'skincare' ? 'Tamaño' : 'Presentación'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map(v => {
                        const isSelected = currentVariant?.id === v.id;
                        const isOut = v.stock <= 0;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'border-[#C8638A] bg-[#C8638A]/10 text-[#6B2A50] font-bold'
                                : 'border-[var(--color-line)]/80 hover:border-[#C8638A] text-[var(--color-ink-soft)] bg-[var(--color-card)]/50'
                            } ${isOut ? 'opacity-80' : ''}`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" style={{ color: '#C8638A' }} />}
                            <span>{v.nombre}</span>
                            {isOut && <span className="text-[8px] opacity-75 font-normal">(Bajo apartado)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 rounded-xl border border-[var(--color-line)] text-xs font-bold uppercase tracking-wider cursor-pointer bg-[var(--color-card)] transition-all hover:bg-rose-50/20 hover:border-[#C8638A] text-[var(--color-ink)] flex items-center justify-center gap-2 active:scale-98"
                  >
                    <ShoppingCart className="w-4 h-4 text-[var(--color-ink-soft)]" />
                    <span>Agregar al Carrito</span>
                  </button>

                  <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 no-underline text-white active:scale-98 transition-all hover:scale-[1.02]"
                    style={{ 
                      background: 'linear-gradient(135deg, #25D366, #128C7E)', 
                      boxShadow: '0 4px 14px rgba(37,211,102,0.3)' 
                    }}
                  >
                    <MessageCircle className="w-4 h-4 text-white fill-white" />
                    <span>Apartar por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t pt-5" style={{ borderColor: 'rgba(210,160,190,0.2)' }}>
              <h4 className="font-[Fraunces] text-sm font-bold mb-3" style={{ color: '#6B2A50' }}>
                Reseñas de Clientes
              </h4>

              {/* Rating Summary Header */}
              <div className="flex items-center gap-2.5 mb-4 p-3 rounded-xl" style={{ background: 'rgba(200,100,140,0.04)' }}>
                <span className="text-xl font-extrabold" style={{ color: '#3A1228' }}>{avgRating}</span>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: '#B07090' }}>
                  ({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Review List */}
              <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-xs italic" style={{ color: '#B07090' }}>
                    Sé la primera en escribir una reseña para este producto.
                  </p>
                ) : (
                  reviews.map((r, i) => (
                    <div 
                      key={i} 
                      className="text-xs p-3.5 rounded-xl space-y-1.5 border"
                      style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(210,160,190,0.15)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: '#4A1A38' }}>{r.author}</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px] opacity-75" style={{ color: '#B07090' }}>
                          {new Date(r.date).toLocaleDateString('es-MX', { dateStyle: 'short' })}
                        </span>
                      </div>
                      <p style={{ color: '#704060' }}>{r.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Write Review Form */}
              <form 
                onSubmit={submitReview} 
                className="p-4 rounded-2xl space-y-3 border"
                style={{ background: 'rgba(200,100,140,0.03)', borderColor: 'rgba(200,100,140,0.15)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#8B3A6B' }}>
                  Deja tu reseña
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide block" style={{ color: '#B07090' }}>
                      Tu nombre
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Ana Pérez" 
                      required 
                      value={reviewAuthor} 
                      onChange={e => setReviewAuthor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        border: '1.5px solid rgba(200,100,140,0.2)',
                        color: '#3A1228',
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide block" style={{ color: '#B07090' }}>
                      Calificación
                    </label>
                    <div className="flex gap-1.5 py-2">
                      {[1,2,3,4,5].map(i => (
                        <button 
                          key={i} 
                          type="button" 
                          onClick={() => setReviewRating(i)}
                          className="p-0.5 cursor-pointer transition-transform hover:scale-120 active:scale-90"
                        >
                          <Star className={`w-5 h-5 ${i <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wide block" style={{ color: '#B07090' }}>
                    Tu opinión
                  </label>
                  <textarea 
                    placeholder="Cuéntanos qué te pareció el producto..." 
                    required 
                    value={reviewText} 
                    onChange={e => setReviewText(e.target.value)} 
                    rows={2.5}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-all resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      border: '1.5px solid rgba(200,100,140,0.2)',
                      color: '#3A1228',
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide text-white cursor-pointer transition-all hover:scale-102 active:scale-95 shadow-sm"
                  style={{ background: 'linear-gradient(135deg,#C8638A,#B0507A)' }}
                >
                  Enviar Reseña
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
