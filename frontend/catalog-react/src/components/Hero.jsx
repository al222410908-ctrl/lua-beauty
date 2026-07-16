export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-10 pb-8 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
        {/* Left Column: Editorial Text */}
        <div className="space-y-4 text-left">
          <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[var(--color-terracotta)] block">
            LÚA BEAUTY • COSMÉTICA ORGÁNICA
          </span>
          <h1 className="font-[Fraunces] text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--color-ink)] leading-[1.15]">
            Belleza que <br />
            nace de lo natural.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-md">
            Productos formulados éticamente con activos botánicos orgánicos, libres de crueldad. Diseñados para proteger tu piel y resaltar tu luminosidad natural en cada aplicación.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[var(--color-ink-soft)] font-medium">
            <span className="flex items-center gap-1">🌱 100% Orgánico</span>
            <span>•</span>
            <span className="flex items-center gap-1">🐰 Cruelty-Free</span>
            <span>•</span>
            <span className="flex items-center gap-1">✨ Hecho en México</span>
          </div>
        </div>

        {/* Right Column: Overlapping Collage */}
        <div className="relative h-64 md:h-80 w-full flex items-center justify-center select-none">
          {/* Main back card */}
          <div className="absolute w-[55%] h-[80%] left-[8%] top-[5%] rounded-2xl overflow-hidden shadow-md transform -rotate-2 border border-[var(--color-line)]/30 bg-[var(--color-bg-deep)]">
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400"
              alt="Cosméticos orgánicos Lúa"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {/* Overlapping front card */}
          <div className="absolute w-[48%] h-[72%] right-[8%] bottom-[5%] rounded-2xl overflow-hidden shadow-lg transform rotate-3 border-2 border-white z-10 bg-[var(--color-bg-deep)]">
            <img
              src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400"
              alt="Cuidado de la piel natural"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
