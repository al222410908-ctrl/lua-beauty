import { useState } from 'react';
import { Sparkles, Copy } from 'lucide-react';

export default function TabComportamiento({ behaviorLogs, conversionStats, loadingConversion, products, showToast }) {
  const [selectedInstaProduct, setSelectedInstaProduct] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');

  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 0
  });

  const handleGenerateInstagram = () => {
    const prod = products.find(p => p.id === selectedInstaProduct);
    if (!prod) return;
    const desc = prod.descripcion || '';
    const formattedPrice = currencyFormatter.format(prod.precio);
    const caption = `✨ R E V E L A  T U  B E L L E Z A ✨\n\n¿Buscas el producto perfecto para tu rutina? Te presentamos: *${prod.nombre}* 💖\n\n${desc}\n\n🛍️ Adquiérelo ahora por solo *${formattedPrice}* escribiéndonos directamente al link de nuestra biografía.\n\n#LuaBeauty #MaquillajeOrganico #CosmeticaNatural #Skincareroutine #BellezaNatural #CrueltyFree #${prod.categoria}`;
    setGeneratedCaption(caption);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      <div className="bg-card border border-line/45 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Auditoría de Comportamiento</h3>
        <p className="text-[11px] text-ink-soft leading-relaxed">Registro histórico de las interacciones, clics, e ingresos a vistas por parte de los clientes en tiempo real.</p>
        <div className="border-t border-line/20 pt-3 max-h-[350px] overflow-y-auto pr-1">
          {behaviorLogs.length === 0 ? (
            <p className="text-xs text-ink-soft italic text-center py-8">Sin registros de auditoría aún.</p>
          ) : (
            <ul className="space-y-2.5">
              {behaviorLogs.map(log => (
                <li key={log.id} className="text-xs flex justify-between items-start gap-4 pb-2 border-b border-line/10 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <span className="font-bold text-terracotta">{log.action}</span>
                    {log.detail && <span className="text-[11px] text-ink-soft block truncate max-w-xs sm:max-w-sm">Detalle: {log.detail}</span>}
                  </div>
                  <span className="text-[10px] text-ink-soft font-medium flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('es-MX')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-card border border-line/45 rounded-lg p-5 space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider font-display">Embudo de Ventas WhatsApp</h3>
          <p className="text-[11px] text-ink-soft leading-relaxed text-left">Monitorea la conversión del catálogo desde la visualización hasta el envío a WhatsApp.</p>
        </div>
        {loadingConversion ? (
          <div className="space-y-4 py-6 animate-pulse">
            <div className="h-8 bg-bg-deep rounded" />
            <div className="h-8 bg-bg-deep rounded" />
            <div className="h-8 bg-bg-deep rounded" />
          </div>
        ) : (
          <div className="space-y-4 py-2 flex-1 flex flex-col justify-center text-left">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-ink">1. Vistas de Catálogo</span>
                <span className="text-ink-soft font-mono">{conversionStats.views} vistas</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-nude h-full rounded-full duration-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-ink">2. Consultas Directas</span>
                <span className="text-ink-soft font-mono">{conversionStats.questions} clics ({conversionStats.rates.toQuestions}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full duration-500" style={{ width: `${Math.min(100, Math.max(5, conversionStats.rates.toQuestions))}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-ink">3. Compras Envíadas</span>
                <span className="text-ink-soft font-mono">{conversionStats.checkouts} pedidos ({conversionStats.rates.toCheckouts}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full duration-500" style={{ width: `${Math.min(100, Math.max(5, conversionStats.rates.toCheckouts))}%` }} />
              </div>
            </div>
          </div>
        )}
        <div className="bg-bg-light/40 border border-line/20 p-2.5 rounded text-[10px] text-ink-soft leading-relaxed text-center italic">
          ⭐ Tasa de conversión de compra: <strong>{conversionStats.rates.toCheckouts}%</strong> de visitas concretadas.
        </div>
      </div>

      <div className="bg-card border border-line/45 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-terracotta" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Generador de Copy Instagram</h3>
        </div>
        <p className="text-xs text-ink-soft">Selecciona un producto para crear una descripción de venta automatizada con hashtags listos para pegar en Instagram.</p>
        <div className="space-y-3 pt-2">
          <select
            value={selectedInstaProduct}
            onChange={e => setSelectedInstaProduct(e.target.value)}
            className="w-full px-3 py-2 rounded border border-line bg-transparent text-xs focus:outline-none focus:border-terracotta cursor-pointer"
          >
            <option value="">Selecciona un producto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button
            onClick={handleGenerateInstagram}
            disabled={!selectedInstaProduct}
            className={`w-full py-2 bg-ink text-white font-semibold text-xs rounded cursor-pointer ${!selectedInstaProduct ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink/90'}`}
          >
            Generar caption + hashtags
          </button>
          {generatedCaption && (
            <div className="space-y-2 pt-2">
              <pre className="w-full max-h-[180px] p-3 rounded border border-line bg-bg-light/40 overflow-y-auto text-[10px] text-ink-soft whitespace-pre-wrap font-sans leading-relaxed">
                {generatedCaption}
              </pre>
              <button
                onClick={() => { navigator.clipboard.writeText(generatedCaption); showToast('Caption copiado al portapapeles! 📋', 'success'); }}
                className="w-full py-2 border border-line hover:bg-black/5 text-ink-soft hover:text-ink font-semibold text-xs rounded cursor-pointer flex items-center justify-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto generado</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
