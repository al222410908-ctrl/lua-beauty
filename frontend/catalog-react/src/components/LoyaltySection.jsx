import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';

export default function LoyaltySection() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchApi('/api/users/loyalty').then(setLoyalty).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8 text-center border-t border-[var(--color-line)]/30">
        <div className="max-w-sm mx-auto">
          <h3 className="font-[Fraunces] text-lg font-semibold mb-2">Programa de Lealtad</h3>
          <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
            Por cada 3 compras que realices, ¡te damos un <strong className="text-[var(--color-terracotta)]">10% de descuento automático</strong> en tu siguiente pedido!
          </p>
        </div>
      </section>
    );
  }

  const totalOrders = loyalty?.totalOrders || 0;
  const earnedRewards = loyalty?.earnedRewards || Math.floor(totalOrders / 3);
  const usedRewards = loyalty?.usedRewards || 0;
  const remainingRewards = Math.max(0, earnedRewards - usedRewards);
  const currentCyclePurchases = loyalty?.currentCyclePurchases ?? (totalOrders % 3);
  const progress = (currentCyclePurchases / 3) * 100;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 border-t border-[var(--color-line)]/30">
      <div className="max-w-sm mx-auto text-center">
        <h3 className="font-[Fraunces] text-lg font-semibold mb-2">Programa de Lealtad</h3>
        <p className="text-xs text-[var(--color-ink-soft)] mb-4">
          Por cada 3 compras, obtén un <strong className="text-[var(--color-terracotta)]">10% de descuento</strong>.
        </p>
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span>Progreso</span>
          <span className="text-[var(--color-terracotta)]">{currentCyclePurchases} / 3 compras</span>
        </div>
        <div className="w-full h-2.5 bg-[var(--color-nude-pale)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-terracotta)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {remainingRewards > 0 ? (
          <p className="text-xs mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-2 rounded text-emerald-800 dark:text-emerald-300 font-semibold">
            🎉 ¡Tienes <strong>{remainingRewards}</strong> descuento{remainingRewards > 1 ? 's' : ''} disponible{remainingRewards > 1 ? 's' : ''}!
          </p>
        ) : (
          <p className="text-[10px] mt-2 text-[var(--color-ink-soft)] italic">
            Faltan {3 - currentCyclePurchases} compra{3 - currentCyclePurchases !== 1 ? 's' : ''} para tu próximo descuento.
          </p>
        )}
      </div>
    </section>
  );
}
