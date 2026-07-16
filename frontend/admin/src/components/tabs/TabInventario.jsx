import { useState, useCallback, useRef } from 'react';
import { Plus, FileSpreadsheet, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0
});

export default function TabInventario({ products, token, showToast, loadProducts, fetchStats }) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [formProductId, setFormProductId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoria, setCategoria] = useState('rimels');
  const [urlImagen, setUrlImagen] = useState('');
  const [activeState, setActiveState] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productVariants, setProductVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editVariantId, setEditVariantId] = useState('');
  const [variantNombre, setVariantNombre] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [variantExtraPrice, setVariantExtraPrice] = useState('');
  const [variantSortOrder, setVariantSortOrder] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteVariantConfirm, setDeleteVariantConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const loadVariants = useCallback(async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}/variants`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProductVariants(data); return; }
    } catch (_) {}
    setProductVariants([]);
  }, [token]);

  const handleEditProductClick = (prod) => {
    setFormProductId(prod.id);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion || '');
    setPrecio(prod.precio);
    setStock(prod.stock);
    setCategoria(prod.categoria);
    setUrlImagen(prod.url_imagen || '');
    setActiveState(prod.active !== undefined ? prod.active : true);
    setShowProductForm(true);
    loadVariants(prod.id);
  };

  const handleAddProductClick = () => {
    setFormProductId('');
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setStock('');
    setCategoria('rimels');
    setUrlImagen('');
    setActiveState(true);
    setShowProductForm(true);
    setProductVariants([]);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/products/${deleteConfirm}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('No se pudo eliminar el producto');
      showToast('Producto eliminado correctamente', 'success');
      loadProducts();
      fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      const payload = { nombre, descripcion, precio: parseFloat(precio), stock: parseInt(stock, 10), categoria, url_imagen: urlImagen, active: activeState };
      const url = formProductId ? `/api/products/${formProductId}` : '/api/products';
      const method = formProductId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');
      showToast(formProductId ? 'Producto actualizado' : 'Producto creado con éxito', 'success');
      setShowProductForm(false);
      loadProducts();
      fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSubmittingProduct(false); }
  };

  const handleAddVariant = () => {
    setEditVariantId('');
    setVariantNombre('');
    setVariantStock('0');
    setVariantExtraPrice('0');
    setVariantSortOrder('0');
    setShowVariantForm(true);
  };

  const handleEditVariant = (v) => {
    setEditVariantId(v.id);
    setVariantNombre(v.nombre);
    setVariantStock(v.stock);
    setVariantExtraPrice(v.extra_price);
    setVariantSortOrder(v.sort_order);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = async () => {
    if (!deleteVariantConfirm) return;
    try {
      const res = await fetch(`/api/products/${formProductId}/variants/${deleteVariantConfirm}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('Variante eliminada', 'success');
      loadVariants(formProductId);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setDeleteVariantConfirm(null); }
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nombre: variantNombre, stock: parseInt(variantStock, 10) || 0, extra_price: parseFloat(variantExtraPrice) || 0, sort_order: parseInt(variantSortOrder, 10) || 0 };
      const url = editVariantId ? `/api/products/${formProductId}/variants/${editVariantId}` : `/api/products/${formProductId}/variants`;
      const method = editVariantId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar variante');
      showToast(editVariantId ? 'Variante actualizada' : 'Variante creada', 'success');
      setShowVariantForm(false);
      loadVariants(formProductId);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
      setUrlImagen(data.url);
      showToast('Imagen subida correctamente', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setUploadingImage(false); }
  };

  const exportProducts = () => {
    const headers = ['ID', 'Nombre', 'Categoria', 'Precio', 'Stock', 'Views', 'Activo'];
    const rows = products.map(p => [p.id, p.nombre, p.categoria, p.precio, p.stock, p.views, p.active !== 0 ? 'Sí' : 'No']);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `inventario_lua_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center select-none">
        <button onClick={handleAddProductClick} className="px-4 py-2 bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-xs rounded cursor-pointer flex items-center gap-1">
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
        <button onClick={exportProducts} className="px-4 py-2 border border-line hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink font-semibold text-xs rounded cursor-pointer flex items-center gap-1.5 transition-colors">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Inventario</span>
        </button>
      </div>

      <div className="bg-card border border-line/45 rounded-lg overflow-hidden">
        {products.length === 0 ? (
          <p className="text-xs text-ink-soft italic text-center p-8">No hay productos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-bg-deep text-ink-soft uppercase text-[10px] font-bold border-b border-line/30">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Visitas</th>
                  <th className="p-4 text-center">Activo</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/20">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-bg-light/10">
                    <td className="p-4 font-semibold text-ink">{p.nombre}</td>
                    <td className="p-4 uppercase tracking-wider font-semibold text-ink-soft">{p.categoria}</td>
                    <td className="p-4">{currencyFormatter.format(p.precio)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${p.stock <= 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : p.stock < 5 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                        {p.stock} uds
                      </span>
                    </td>
                    <td className="p-4 text-ink-soft font-bold">{p.views}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.active !== 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} title={p.active !== 0 ? 'Activo' : 'Inactivo'} />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEditProductClick(p)} className="p-1 text-terracotta hover:bg-terracotta/10 border border-transparent hover:border-terracotta/20 rounded cursor-pointer" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded cursor-pointer" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteConfirm}
        title="Eliminar Producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteConfirm(null)}
      />

      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-card w-full max-w-lg rounded-lg border border-line overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-line bg-bg-light/40 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink font-display">
                {formProductId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h3>
              <button onClick={() => setShowProductForm(false)} className="p-1 text-ink-soft hover:text-ink cursor-pointer rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Nombre del Producto</label>
                <input type="text" required placeholder="ej. Rímel Volumen Extremo" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Descripción corta</label>
                <textarea placeholder="Fórmula de larga duración..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Precio (MXN)</label>
                  <input type="number" required placeholder="25000" value={precio} onChange={e => setPrecio(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Stock Inicial</label>
                  <input type="number" required placeholder="10" value={stock} onChange={e => setStock(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta cursor-pointer">
                  <option value="rimels">Rímels</option>
                  <option value="bases">Bases</option>
                  <option value="skincare">Skincare</option>
                  <option value="labiales">Labiales</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Imagen del Producto</label>
                <div className="flex gap-2">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                    className="px-4 py-2 rounded border border-line hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                  </button>
                  <input type="url" placeholder="O pega URL..." value={urlImagen} onChange={e => setUrlImagen(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                </div>
                {urlImagen && (
                  <div className="mt-2 relative w-20 h-20 rounded border border-line overflow-hidden bg-bg-light">
                    <img src={urlImagen} alt="Preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>

              {formProductId && (
                <div className="space-y-2 pt-2 border-t border-line/30">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">Variantes</label>
                    <button type="button" onClick={handleAddVariant}
                      className="px-2 py-1 rounded border border-line hover:bg-black/5 text-xs font-semibold text-ink-soft cursor-pointer flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                  {productVariants.length === 0 ? (
                    <p className="text-[10px] text-ink-soft italic">Sin variantes. El producto usará su stock general.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {productVariants.map(v => (
                        <div key={v.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-line/40 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-ink truncate">{v.nombre}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${v.stock <= 0 ? 'bg-rose-50 text-rose-600' : v.stock < 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{v.stock} uds</span>
                            {v.extra_price > 0 && <span className="text-ink-soft">+{currencyFormatter.format(v.extra_price)}</span>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button type="button" onClick={() => handleEditVariant(v)} className="p-1 text-terracotta hover:bg-terracotta/10 rounded cursor-pointer">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => setDeleteVariantConfirm(v.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <ConfirmModal
                open={!!deleteVariantConfirm}
                title="Eliminar Variante"
                message="¿Eliminar esta variante? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                variant="danger"
                onConfirm={handleDeleteVariant}
                onCancel={() => setDeleteVariantConfirm(null)}
              />

              {showVariantForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
                  <div className="bg-card w-full max-w-sm rounded-lg border border-line overflow-hidden">
                    <div className="p-3 border-b border-line flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider">{editVariantId ? 'Editar Variante' : 'Nueva Variante'}</h4>
                      <button type="button" onClick={() => setShowVariantForm(false)} className="p-1 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleVariantSubmit} className="p-4 space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Nombre</label>
                        <input type="text" required value={variantNombre} onChange={e => setVariantNombre(e.target.value)}
                          placeholder="ej. Fair Ivory" className="w-full px-2 py-1.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Stock</label>
                          <input type="number" required value={variantStock} onChange={e => setVariantStock(e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Extra $</label>
                          <input type="number" value={variantExtraPrice} onChange={e => setVariantExtraPrice(e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Orden</label>
                          <input type="number" value={variantSortOrder} onChange={e => setVariantSortOrder(e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-line bg-transparent text-sm focus:outline-none focus:border-terracotta" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowVariantForm(false)}
                          className="flex-1 py-1.5 rounded border border-line text-xs font-semibold cursor-pointer">Cancelar</button>
                        <button type="submit" className="flex-1 py-1.5 rounded bg-terracotta text-white text-xs font-semibold cursor-pointer">
                          {editVariantId ? 'Actualizar' : 'Crear'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">Estado</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={activeState} onChange={e => setActiveState(e.target.checked)}
                    className="w-4 h-4 rounded border-line text-terracotta focus:ring-terracotta cursor-pointer" />
                  <span className="text-xs text-ink font-semibold">{activeState ? 'Activo (visible en catálogo)' : 'Inactivo (oculto del catálogo)'}</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowProductForm(false)}
                  className="flex-1 py-2.5 rounded border border-line hover:bg-black/5 text-ink-soft text-xs font-semibold cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={submittingProduct}
                  className="flex-1 py-2.5 rounded bg-terracotta text-white hover:bg-terracotta/90 text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submittingProduct ? 'Guardando...' : formProductId ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
