import { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, RefreshCw, Smartphone, Sparkles, Settings, Sun, Moon, LogOut, Users, Menu, X } from 'lucide-react';

import ShopSettings from './ShopSettings';
import TabResumen from './tabs/TabResumen';
import TabPedidos from './tabs/TabPedidos';
import TabComportamiento from './tabs/TabComportamiento';
import TabBot from './tabs/TabBot';
import TabInventario from './tabs/TabInventario';
import TabGrupos from './tabs/TabGrupos';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0
});

export default function AdminDashboard({ token, products, loadProducts, showToast, currentUser, theme, setTheme, logout }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [botStatus, setBotStatus] = useState(null);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [botLogs, setBotLogs] = useState([]);
  const [conversionStats, setConversionStats] = useState({ views: 0, questions: 0, checkouts: 0, rates: { toQuestions: 0, toCheckouts: 0 } });
  const [loadingConversion, setLoadingConversion] = useState(false);
  const logsEndRef = useRef(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStats(data);
    } catch (_) {}
    finally { setLoadingStats(false); }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { console.warn('fetchOrders error', res.status); return; }
      const data = await res.json();
      setOrders(data);
    } catch (err) { console.warn('fetchOrders exception', err); }
    finally { setLoadingOrders(false); }
  }, [token]);

  const fetchBotStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBotStatus(data);
      if (data && data.logs) setBotLogs(data.logs);
    } catch (_) {}
  }, [token]);

  const fetchBehavior = useCallback(async () => {
    try {
      const res = await fetch('/api/behavior', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBehaviorLogs(data);
    } catch (_) {}
  }, [token]);

  const fetchConversionStats = useCallback(async () => {
    setLoadingConversion(true);
    try {
      const res = await fetch('/api/behavior/conversion', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setConversionStats(data || { views: 0, questions: 0, checkouts: 0, rates: { toQuestions: 0, toCheckouts: 0 } });
    } catch (_) {}
    finally { setLoadingConversion(false); }
  }, [token]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    fetchBotStatus();
    fetchBehavior();
  }, [fetchStats, fetchOrders, fetchBotStatus, fetchBehavior]);

  // WebSocket Live Sync with reconnection backoff
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;
    let attempt = 0;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => { console.log('🔌 WebSocket Admin Conectado.'); attempt = 0; };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'new_order') {
            showToast(`¡Nuevo pedido recibido! ${message.data.id} (${currencyFormatter.format(message.data.total)}) 🛍️`, 'info');
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (_) {}
            fetchStats();
            fetchOrders();
            fetchBehavior();
          } else if (message.type === 'bot_status') {
            setBotStatus(message.data);
            if (message.data.logs) setBotLogs(message.data.logs);
          } else if (message.type === 'bot_log') {
            setBotLogs(prev => { const u = [...prev, message.data]; return u.slice(-100); });
          } else if (message.type === 'new_chat_message') {
            window.dispatchEvent(new CustomEvent('refresh-chats'));
            window.dispatchEvent(new CustomEvent('chat-message', { detail: message.data }));
          }
        } catch (err) { console.error('Error en WebSocket Admin parse:', err); }
      };
      socket.onclose = () => {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        reconnectTimeout = setTimeout(() => { attempt++; connect(); }, delay);
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [fetchStats, fetchOrders, fetchBehavior, showToast]);

  useEffect(() => {
    if (activeTab === 'bot' || activeTab === 'grupos') {
      const timer = setInterval(fetchBotStatus, 5000);
      return () => clearInterval(timer);
    }
  }, [activeTab, fetchBotStatus]);

  useEffect(() => {
    if (activeTab === 'comportamiento') {
      fetchBehavior();
      fetchConversionStats();
    }
  }, [activeTab, fetchBehavior, fetchConversionStats]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botLogs, activeTab]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');
      showToast(`Pedido ${orderId} actualizado a ${newStatus}`, 'success');
      fetchOrders();
      fetchStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleNotifyOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/notify`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al notificar');
      showToast('Aviso de WhatsApp enviado correctamente 💬', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col md:flex-row gap-6 animate-fade-in relative">
      {/* Barra superior móvil */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-line sticky top-0 z-30 shadow-sm shadow-black/[0.02]">
        <div className="flex flex-col">
          <span className="text-lg font-display font-medium text-ink">Lúa Admin</span>
          <span className="text-[9px] text-ink-soft block uppercase tracking-wider font-bold">Consola de Control</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-ink transition-colors cursor-pointer"
          title="Menú"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay translúcido para cerrar el menú en móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45 md:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Menu */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-line p-6 flex flex-col gap-6 transition-transform duration-300 transform overflow-hidden h-screen
        md:translate-x-0 md:sticky md:top-0 md:h-screen md:w-64 md:border-r flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header (Fijo al tope) */}
        <div className="pb-4 border-b border-line/30 flex items-center justify-between flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xl font-display font-medium text-ink block select-none">Lúa Admin</span>
            <span className="text-[10px] text-ink-soft block uppercase tracking-widest mt-1 select-none font-bold">Consola de Control</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-ink transition-colors cursor-pointer"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links (Scrollable middle section) */}
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
          {[
            { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'inventario', label: 'Inventario', icon: <Package className="w-4 h-4" /> },
            { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
            { id: 'bot', label: 'Bot WhatsApp', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'grupos', label: 'Grupos WA', icon: <Users className="w-4 h-4" /> },
            { id: 'comportamiento', label: 'Métricas y Redes', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> }
          ].map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setIsMobileMenuOpen(false);
                  if (t.id === 'pedidos') fetchOrders();
                  if (t.id === 'resumen') fetchStats();
                  if (t.id === 'bot' || t.id === 'grupos') fetchBotStatus();
                }}
                className={`w-full py-1.5 px-2.5 text-xs font-bold tracking-wide flex items-center gap-3.5 cursor-pointer transition-all duration-300 rounded-xl ${
                  isActive
                    ? 'clay-nav-active'
                    : 'text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#A6694B] to-[#C88463] text-white shadow-md shadow-[#A6694B]/20'
                    : 'bg-bg-deep dark:bg-bg-light text-ink-soft'
                }`}>
                  {t.icon}
                </div>
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer (Fijo abajo) */}
        <div className="pt-6 border-t border-line/30 flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Tema</span>
            <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink transition-colors cursor-pointer" title="Cambiar tema">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          {currentUser && (
            <div className="flex items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-line/45 shadow-sm shadow-black/[0.01]">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-ink truncate max-w-[125px]">{currentUser.nombre || currentUser.username}</span>
                <span className="text-[9px] text-ink-soft uppercase tracking-wider font-bold mt-0.5">{currentUser.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6 overflow-hidden bg-bg">
        <section className="py-4 border-b border-line/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-medium text-ink">
              {activeTab === 'resumen' && 'Resumen General'}
              {activeTab === 'inventario' && 'Gestión de Inventario'}
              {activeTab === 'pedidos' && 'Control de Pedidos'}
              {activeTab === 'bot' && 'Asistente de WhatsApp'}
              {activeTab === 'grupos' && 'Envío a Grupos'}
              {activeTab === 'comportamiento' && 'Métricas y Redes'}
              {activeTab === 'configuracion' && 'Configuración de Tienda'}
            </h1>
            <p className="text-[11px] text-ink-soft mt-1">
              {activeTab === 'resumen' && 'Supervisa estadísticas generales de tu tienda Lúa Beauty.'}
              {activeTab === 'inventario' && 'Agrega, edita o elimina productos del catálogo virtual.'}
              {activeTab === 'pedidos' && 'Gestiona estados de entrega y envía avisos automáticos por chat.'}
              {activeTab === 'bot' && 'Vincula tu número de WhatsApp y personaliza las respuestas del bot.'}
              {activeTab === 'grupos' && 'Envía stock de productos o promociones a tus grupos de WhatsApp.'}
              {activeTab === 'comportamiento' && 'Métricas de visualizaciones y generador de posts de Instagram.'}
              {activeTab === 'configuracion' && 'Configura métodos de pago y zonas de entrega para tu tienda.'}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => { fetchStats(); fetchOrders(); fetchBotStatus(); fetchBehavior(); loadProducts(); }}
              className="px-3.5 py-1.5 rounded border border-line hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              <span>Refrescar</span>
            </button>
          </div>
        </section>

        {activeTab === 'resumen' && (
          <TabResumen
            stats={stats}
            loadingStats={loadingStats}
            popular={stats?.popular || []}
            lowStockProducts={stats?.lowStockProducts || []}
          />
        )}

        {activeTab === 'inventario' && (
          <TabInventario
            products={products}
            token={token}
            showToast={showToast}
            loadProducts={loadProducts}
            fetchStats={fetchStats}
          />
        )}

        {activeTab === 'pedidos' && (
          <TabPedidos
            orders={orders}
            loadingOrders={loadingOrders}
            token={token}
            showToast={showToast}
            onUpdateStatus={handleUpdateOrderStatus}
            onNotify={handleNotifyOrder}
          />
        )}

        {activeTab === 'bot' && (
          <TabBot
            token={token}
            showToast={showToast}
            botStatus={botStatus}
            botLogs={botLogs}
            logsEndRef={logsEndRef}
          />
        )}

        {activeTab === 'grupos' && (
          <TabGrupos
            token={token}
            showToast={showToast}
            botStatus={botStatus}
          />
        )}

        {activeTab === 'comportamiento' && (
          <TabComportamiento
            behaviorLogs={behaviorLogs}
            conversionStats={conversionStats}
            loadingConversion={loadingConversion}
            products={products}
            showToast={showToast}
          />
        )}

        {activeTab === 'configuracion' && (
          <ShopSettings token={token} showToast={showToast} />
        )}
      </main>
    </div>
  );
}
