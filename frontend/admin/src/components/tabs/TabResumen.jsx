import { Eye, ShoppingBag, AlertTriangle, Landmark, Check } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", maximumFractionDigits: 0
});

function StatCard({ label, val, color, icon, iconBgClass, extraClass = "" }) {
  return (
    <div className={`clay-card p-6 relative overflow-hidden flex flex-col justify-between min-h-[125px] select-none ${extraClass}`}>
      <div className="flex justify-between items-start">
        <span className={`text-2xl md:text-3xl font-extrabold tracking-tight text-[#1E293B] dark:text-white font-sans ${color}`}>
          {val}
        </span>
        <div className={`p-3 rounded-full ${iconBgClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <span className="text-[10px] font-bold text-ink-soft uppercase tracking-widest block">{label}</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="clay-card p-6 min-h-[125px] animate-pulse">
            <div className="flex justify-between items-start">
              <div className="h-8 bg-bg-deep rounded w-1/2" />
              <div className="w-10 h-10 rounded-full bg-bg-deep" />
            </div>
            <div className="h-3.5 bg-bg-deep rounded w-2/3 mt-4" />
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
          icon={<ShoppingBag className="w-5 h-5 text-[#C8638A]" />}
          iconBgClass="bg-[rgba(200,99,138,0.08)] border border-[rgba(200,99,138,0.15)]"
        />
        <StatCard
          label="Stock Crítico"
          val={lowStock}
          color={lowStock > 0 ? "text-rose-600 font-extrabold" : "text-emerald-600 font-extrabold"}
          icon={lowStock > 0 ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <Check className="w-5 h-5 text-emerald-600" />}
          iconBgClass={lowStock > 0 ? "bg-[rgba(225,29,72,0.08)] border border-[rgba(225,29,72,0.15)]" : "bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)]"}
          extraClass={lowStock > 0 ? "bg-[rgba(225,29,72,0.02)] border-rose-200/40" : ""}
        />
        <StatCard
          label="Valor Inventario"
          val={currencyFormatter.format(stats?.totalValue || 0)}
          icon={<Landmark className="w-5 h-5 text-[#D97706]" />}
          iconBgClass="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]"
        />
        <StatCard
          label="Visualizaciones"
          val={stats?.totalViews || 0}
          icon={<Eye className="w-5 h-5 text-[#0284C7]" />}
          iconBgClass="bg-[rgba(14,165,233,0.08)] border border-[rgba(14,165,233,0.15)]"
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
