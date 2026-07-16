import { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShoppingBag, 
  TrendingUp, 
  User, 
  MapPin, 
  CreditCard, 
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0
});

const ORDER_STATUSES = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

const STATUS_CONFIG = {
  pendiente: {
    color: 'bg-amber-100/70 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    label: 'Pendiente'
  },
  confirmado: {
    color: 'bg-blue-100/70 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    label: 'Confirmado'
  },
  preparando: {
    color: 'bg-indigo-100/70 text-indigo-800 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
    label: 'Preparando'
  },
  enviado: {
    color: 'bg-purple-100/70 text-purple-800 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50',
    label: 'Enviado'
  },
  entregado: {
    color: 'bg-emerald-100/70 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    label: 'Entregado'
  },
  cancelado: {
    color: 'bg-rose-100/70 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
    label: 'Cancelado'
  }
};

const PAYMENT_METHOD_LABELS = {
  transferencia: 'Transferencia Bancaria',
  efectivo: 'Pago en Efectivo',
  tarjeta: 'Pago con Tarjeta'
};

export default function TabPedidos({ orders = [], loadingOrders = false, token, showToast, onUpdateStatus, onNotify }) {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const perPage = 10;
  const ordersList = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  // Calculo de Estadísticas
  const stats = useMemo(() => {
    const total = ordersList.length;
    const ingresos = ordersList
      .filter(o => o && o.status !== 'cancelado')
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
    const pendientes = ordersList.filter(o => o && ['pendiente', 'confirmado', 'preparando'].includes(o.status)).length;
    const entregados = ordersList.filter(o => o && o.status === 'entregado').length;

    return { total, ingresos, pendientes, entregados };
  }, [ordersList]);

  // Filtrado de Pedidos
  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      if (!o) return false;

      // Filtro de Estado
      if (statusFilter === 'pendientes' && !['pendiente', 'confirmado', 'preparando'].includes(o.status)) return false;
      if (statusFilter === 'en_camino' && o.status !== 'enviado') return false;
      if (statusFilter === 'entregados' && o.status !== 'entregado') return false;
      if (statusFilter === 'cancelados' && o.status !== 'cancelado') return false;

      // Filtro de Búsqueda (ID, Nombre, Teléfono)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const idMatch = (o.id || '').toLowerCase().includes(query);
        const nameMatch = (o.user_nombre || '').toLowerCase().includes(query);
        const phoneMatch = (o.user_telefono || '').includes(query);
        return idMatch || nameMatch || phoneMatch;
      }

      return true;
    });
  }, [ordersList, statusFilter, searchQuery]);

  // Paginación
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / perPage)), [filteredOrders.length]);
  
  const paginatedOrders = useMemo(() => {
    const currentPage = page >= totalPages ? 0 : page;
    return filteredOrders.slice(currentPage * perPage, (currentPage + 1) * perPage);
  }, [filteredOrders, page, totalPages]);

  // Reset de página cuando cambian los filtros
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchQuery]);

  const toggleExpandOrder = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const exportOrders = () => {
    const headers = ['Pedido_ID', 'Cliente', 'Teléfono', 'Productos', 'Subtotal', 'Descuento', 'Cupón', 'Envío', 'Total', 'Método Pago', 'Estado', 'Fecha'];
    const rows = ordersList.map(o => {
      const itemsList = (o.items || []).map(it => `${it.nombre} (x${it.quantity})`).join('; ');
      return [
        o.id,
        o.user_nombre || 'Cliente Anónimo',
        o.user_telefono || 'N/A',
        itemsList,
        o.subtotal,
        o.discount,
        o.coupon || 'Ninguno',
        o.delivery_zone || 'Centro',
        o.total,
        o.payment_method || 'transferencia',
        o.status,
        o.created_at || o.date
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `pedidos_lua_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV exportado correctamente 📊', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-line/45 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-terracotta/10 text-terracotta rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Total Pedidos</p>
            <p className="text-xl font-semibold text-ink mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-card border border-line/45 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Ingresos Netos</p>
            <p className="text-xl font-semibold text-ink mt-0.5">{currencyFormatter.format(stats.ingresos)}</p>
          </div>
        </div>

        <div className="bg-card border border-line/45 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Pendientes / Activos</p>
            <p className="text-xl font-semibold text-ink mt-0.5">{stats.pendientes}</p>
          </div>
        </div>

        <div className="bg-card border border-line/45 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Pedidos Entregados</p>
            <p className="text-xl font-semibold text-ink mt-0.5">{stats.entregados}</p>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-card border border-line/45 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-ink-soft absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por ID, nombre de cliente o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-line bg-transparent text-xs focus:outline-none focus:border-terracotta text-ink"
            />
          </div>

          {/* Botón de Exportar */}
          <button 
            onClick={exportOrders}
            className="px-4 py-2.5 border border-line hover:bg-black/5 dark:hover:bg-white/5 text-ink hover:text-terracotta font-semibold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Pestañas de Filtro de Estado */}
        <div className="flex border-b border-line overflow-x-auto scrollbar-none gap-2 pt-2">
          {[
            { id: 'todos', label: 'Todos los Pedidos' },
            { id: 'pendientes', label: 'Pendientes / Activos' },
            { id: 'en_camino', label: 'En Camino' },
            { id: 'entregados', label: 'Entregados' },
            { id: 'cancelados', label: 'Cancelados' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all whitespace-nowrap ${
                statusFilter === filter.id 
                  ? 'border-terracotta text-terracotta font-bold' 
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Pedidos */}
      <div className="space-y-3">
        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-card border border-line/45 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card border border-line/45 rounded-xl p-12 text-center">
            <AlertCircle className="w-10 h-10 text-ink-soft mx-auto opacity-55 mb-3" />
            <p className="text-xs text-ink-soft italic">No se encontraron pedidos con los filtros aplicados.</p>
          </div>
        ) : (
          paginatedOrders.map(order => {
            if (!order) return null;
            const isExpanded = expandedOrderId === order.id;
            const config = STATUS_CONFIG[order.status] || { color: 'bg-line text-ink-soft', label: order.status };
            const cleanPhone = (order.user_telefono || '').replace(/\D/g, '');
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div 
                key={order.id}
                className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                  isExpanded ? 'border-terracotta/40 ring-1 ring-terracotta/10' : 'border-line/45 hover:border-line'
                }`}
              >
                {/* Cabecera del Pedido */}
                <div 
                  onClick={() => toggleExpandOrder(order.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-bg-light/20 transition-colors select-none"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-ink bg-line/40 px-2.5 py-1 rounded">
                      {order.id}
                    </span>
                    <span className="text-xs font-semibold text-ink">
                      {order.user_nombre || 'Cliente Anónimo'}
                    </span>
                    <span className="text-[10px] text-ink-soft">
                      {new Date(order.created_at || order.date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">
                        {currencyFormatter.format(order.total || 0)}
                      </span>
                      {items.length > 0 && (
                        <span className="text-[10px] text-ink-soft bg-line/25 px-2 py-0.5 rounded-full font-semibold">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* Estado Badge / Cambiador */}
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase cursor-pointer focus:outline-none ${config.color}`}
                      >
                        {ORDER_STATUSES.map(st => (
                          <option key={st} value={st} className="bg-card text-ink uppercase text-[10px]">
                            {STATUS_CONFIG[st]?.label || st}
                          </option>
                        ))}
                      </select>

                      {/* Notificar por WhatsApp */}
                      <button
                        onClick={() => onNotify(order.id)}
                        className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors border border-emerald-200 cursor-pointer"
                        title="Enviar actualización por WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Icono Expandir */}
                      <button 
                        onClick={() => toggleExpandOrder(order.id)}
                        className="p-1 text-ink-soft hover:text-ink cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalles Expandidos */}
                {isExpanded && (
                  <div className="border-t border-line/30 bg-bg-light/30 p-5 space-y-5 animate-fade-in text-left">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Columna 1: Información del Cliente */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-ink-soft">
                          <User className="w-4 h-4 text-terracotta" />
                          <h4 className="text-[10px] uppercase font-bold tracking-wider">Información del Cliente</h4>
                        </div>
                        <div className="bg-card border border-line/30 p-3.5 rounded-lg space-y-1">
                          <p className="text-xs font-semibold text-ink">{order.user_nombre || 'Cliente Anónimo'}</p>
                          {order.user_telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                              <span>+{order.user_telefono}</span>
                              <a 
                                href={`https://wa.me/${cleanPhone}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5"
                                title="Abrir chat en WhatsApp"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {order.user_direccion && (
                            <div className="flex items-start gap-1.5 text-xs text-ink-soft pt-1.5 border-t border-line/30 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-terracotta flex-shrink-0 mt-0.5" />
                              <span>{order.user_direccion}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-ink-soft mt-1">
                            <span className="font-bold">Zona de Entrega:</span>
                            <span className="bg-line/40 px-2 py-0.5 rounded text-ink font-semibold">{order.delivery_zone || 'Centro'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Productos y Totales */}
                      <div className="space-y-3 lg:col-span-2">
                        <div className="flex items-center gap-2 text-ink-soft">
                          <ShoppingBag className="w-4 h-4 text-terracotta" />
                          <h4 className="text-[10px] uppercase font-bold tracking-wider">Productos en este pedido</h4>
                        </div>
                        <div className="bg-card border border-line/30 rounded-lg overflow-hidden">
                          <div className="divide-y divide-line/30">
                            {items.map((item, idx) => {
                              if (!item) return null;
                              return (
                                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                                  <div>
                                    <p className="font-semibold text-ink">
                                      {item.nombre}
                                    </p>
                                    {item.variantName && (
                                      <p className="text-[9px] text-ink-soft font-bold uppercase mt-0.5">
                                        Variante: {item.variantName}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-ink font-semibold">
                                      {item.quantity} x {currencyFormatter.format(item.precio || 0)}
                                    </p>
                                    <p className="text-[10px] text-ink-soft font-medium">
                                      {currencyFormatter.format((item.precio || 0) * item.quantity)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desglose de Precios */}
                          <div className="bg-bg-light/40 p-3.5 border-t border-line/30 space-y-1.5 text-xs text-right">
                            <div className="flex justify-between text-ink-soft">
                              <span>Subtotal</span>
                              <span>{currencyFormatter.format(order.subtotal || order.total || 0)}</span>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Descuento {order.coupon ? `(${order.coupon})` : ''}</span>
                                <span>-{currencyFormatter.format(order.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-ink border-t border-line/20 pt-1.5 text-sm">
                              <span>Total</span>
                              <span>{currencyFormatter.format(order.total || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detalles de Pago */}
                        <div className="flex flex-wrap gap-4 items-center bg-card border border-line/30 p-3 rounded-lg text-xs">
                          <div className="flex items-center gap-1.5 text-ink-soft">
                            <CreditCard className="w-4 h-4 text-terracotta" />
                            <span>Método de Pago:</span>
                          </div>
                          <span className="font-semibold text-ink bg-line/20 px-2.5 py-0.5 rounded">
                            {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline de Historial del Pedido */}
                    {order.history && Array.isArray(order.history) && order.history.length > 0 && (
                      <div className="border-t border-line/20 pt-4 space-y-2">
                        <div className="flex items-center gap-2 text-ink-soft">
                          <Clock className="w-4 h-4 text-terracotta" />
                          <h4 className="text-[10px] uppercase font-bold tracking-wider">Línea de Tiempo de Estados</h4>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2 pl-2">
                          {order.history.map((hist, idx) => {
                            if (!hist) return null;
                            const formattedDate = hist.date ? new Date(hist.date).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
                            return (
                              <div key={idx} className="flex items-center gap-2 text-[10px]">
                                <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                                <div className="text-left">
                                  <span className="font-bold text-ink uppercase">{STATUS_CONFIG[hist.status]?.label || hist.status}</span>
                                  <span className="text-ink-soft ml-1.5 font-semibold">
                                    ({formattedDate})
                                  </span>
                                </div>
                                {idx < order.history.length - 1 && (
                                  <span className="text-ink-soft font-bold mx-1">→</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginador */}
      {filteredOrders.length > perPage && (
        <div className="flex items-center justify-between border-t border-line/30 pt-4">
          <span className="text-[10px] text-ink-soft font-semibold">
            Mostrando {page * perPage + 1}–{Math.min((page + 1) * perPage, filteredOrders.length)} de {filteredOrders.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-line bg-card hover:bg-bg-light disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-ink" />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-line bg-card hover:bg-bg-light disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-ink" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
