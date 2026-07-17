import { Eye, ShoppingBag, AlertTriangle, Landmark, Check } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0
});

function StatCard({ label, val, color, icon, iconBgClass, extraClass = "" }) {
  return (
    <div className={`clay-card p-4.5 flex items-center justify-between min-h-[90px] select-none ${extraClass}`}>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block mb-1">{label}</span>
        <span className={`text-xl md:text-2xl font-extrabold tracking-tight text-ink font-sans ${color}`}>
          {val}
        </span>
      </div>
      <div className={`w-11 h-11 rounded-xl ${iconBgClass} flex items-center justify-center flex-shrink-0 shadow-md`}>
        {icon}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="clay-card p-4.5 min-h-[90px] animate-pulse flex items-center justify-between">
            <div className="space-y-2 w-1/2">
              <div className="h-3 bg-bg-deep rounded w-2/3" />
              <div className="h-6 bg-bg-deep rounded w-full" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-bg-deep" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="clay-card p-6 h-48 animate-pulse space-y-4">
            <div className="h-4 bg-bg-deep rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-3.5 bg-bg-deep rounded w-full" />
              <div className="h-3.5 bg-bg-deep rounded w-5/6" />
              <div className="h-3.5 bg-bg-deep rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TabResumen({ stats, loadingStats, popular, lowStockProducts }) {
  if (loadingStats) return <LoadingSkeleton />;

  const lowStock = stats?.lowStock || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Productos"
          val={stats?.totalProducts || 0}
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          iconBgClass="bg-gradient-to-br from-pink-400 to-[#C8638A] shadow-pink-500/10"
        />
        <StatCard
          label="Stock Crítico"
          val={lowStock}
          color={lowStock > 0 ? "text-rose-600 font-extrabold" : "text-emerald-600 font-extrabold"}
          icon={lowStock > 0 ? <AlertTriangle className="w-5 h-5 text-white" /> : <Check className="w-5 h-5 text-white" />}
          iconBgClass={lowStock > 0 ? "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/10" : "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/10"}
          extraClass={lowStock > 0 ? "border-rose-200/40" : ""}
        />
        <StatCard
          label="Valor Inventario"
          val={currencyFormatter.format(stats?.totalValue || 0)}
          icon={<Landmark className="w-5 h-5 text-white" />}
          iconBgClass="bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/10"
        />
        <StatCard
          label="Visualizaciones"
          val={stats?.totalViews || 0}
          icon={<Eye className="w-5 h-5 text-white" />}
          iconBgClass="bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-500/10"
        />
      </div>

      {/* Main Graph Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="clay-card p-6 md:col-span-4 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-[#1E293B] dark:text-white uppercase tracking-wider">Tendencia de Visualizaciones</h3>
              <p className="text-[10px] text-ink-soft mt-0.5">Visitas acumuladas en los últimos 7 días</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] px-3 py-1 rounded-full flex items-center gap-1 select-none">
              +12.4% esta semana
            </span>
          </div>
          <div className="h-32 w-full pt-4">
            <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nude)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--nude)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="500" y2="20" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="4" />
              
              <path
                d="M0,90 Q50,75 100,80 T200,60 T300,45 T400,20 T500,10 L500,100 L0,100 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0,90 Q50,75 100,80 T200,60 T300,45 T400,20 T500,10"
                fill="none"
                stroke="var(--terracotta)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="200" cy="60" r="4" fill="var(--terracotta)" stroke="white" strokeWidth="1.5" />
              <circle cx="300" cy="45" r="4" fill="var(--terracotta)" stroke="white" strokeWidth="1.5" />
              <circle cx="400" cy="20" r="4" fill="var(--terracotta)" stroke="white" strokeWidth="1.5" />
              <circle cx="500" cy="10" r="4.5" fill="var(--terracotta)" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-ink-soft select-none font-mono pt-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom (Hoy)</span>
          </div>
        </div>

        {/* Popular Products Sidebar */}
        <div className="clay-card md:col-span-2 p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#1E293B] dark:text-white uppercase tracking-wider">Productos más populares</h3>
          {(!popular || popular.length === 0) ? (
            <p className="text-xs text-ink-soft/80 italic">Aún no hay visitas registradas.</p>
          ) : (
            <ul className="space-y-3">
              {popular.map((p, idx) => (
                <li key={p.id} className="clay-pill flex justify-between items-center text-xs p-3.5 border border-transparent">
                  <span className="font-bold text-[#1E293B] dark:text-white">{idx + 1}. {p.nombre}</span>
                  <span className="text-ink-soft font-extrabold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-ink-soft/75" /> {p.views} visitas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Critical Stock Sidebar */}
        <div className="clay-card md:col-span-2 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1E293B] dark:text-white uppercase tracking-wider mb-4">Productos con stock crítico</h3>
            {(!lowStockProducts || lowStockProducts.length === 0) ? (
              <div className="clay-card p-6 flex flex-col items-center justify-center text-center space-y-4" style={{ background: 'rgba(16, 185, 129, 0.02)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1.5px dashed rgba(16, 185, 129, 0.3)' }}>
                  <svg className="w-8 h-8 text-emerald-600 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-400">¡Inventario Completo!</p>
                  <p className="text-[9.5px] text-ink-soft/80 max-w-[200px] mx-auto mt-1 leading-normal">Todos los productos cuentan con niveles de stock saludables.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {lowStockProducts.map(p => (
                  <li key={p.id} className="clay-pill flex justify-between items-center text-xs p-3.5 border border-transparent">
                    <span className="font-bold text-[#1E293B] dark:text-white">{p.nombre}</span>
                    <span className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full font-extrabold">{p.stock} unidades</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
