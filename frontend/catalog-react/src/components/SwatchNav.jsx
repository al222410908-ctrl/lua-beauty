import { CATEGORY_STYLE } from '../config';

const MOCK_CATEGORIES = [
  { id: 'paletas', label: 'Paletas', color: 'radial-gradient(circle at 32% 30%, #ebd4be, #b59276 70%)' },
  { id: 'brochas', label: 'Brochas', color: 'radial-gradient(circle at 32% 30%, #cdcbc7, #9b9894 70%)' },
  { id: 'fragancias', label: 'Fragancias', color: 'radial-gradient(circle at 32% 30%, #fdfcfb, #e5cfb3 70%)' },
  { id: 'solar', label: 'Solar', color: 'radial-gradient(circle at 32% 30%, #fffaea, #d4af37 70%)' },
];

export default function SwatchNav({ categories, active, onChange }) {
  return (
    <nav className="max-w-6xl mx-auto px-4 pb-6 overflow-x-auto select-none no-scrollbar">
      <div className="flex gap-2.5 justify-start md:justify-center min-w-max py-1">
        {/* 'Todos' Pill */}
        <button
          onClick={() => onChange('todos')}
          className={`px-4.5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-300 border cursor-pointer ${
            active === 'todos'
              ? 'bg-[#211C18] text-white border-[#211C18] shadow-sm'
              : 'bg-[var(--color-card)] text-[var(--color-ink-soft)] border-[var(--color-line)]/55 hover:border-[var(--color-terracotta)]'
          }`}
        >
          Todos
        </button>

        {/* Real categories from DB */}
        {categories.map(cat => {
          const style = CATEGORY_STYLE[cat] || CATEGORY_STYLE._default;
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-300 border cursor-pointer ${
                isActive
                  ? 'bg-[#211C18] text-white border-[#211C18] shadow-sm'
                  : 'bg-[var(--color-card)] text-[var(--color-ink-soft)] border-[var(--color-line)]/55 hover:border-[var(--color-terracotta)]'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full border border-black/5" 
                style={{ background: style.color }} 
              />
              {style.label}
            </button>
          );
        })}

        {/* Mock categories for shop abundance */}
        {MOCK_CATEGORIES.map(cat => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-300 border cursor-pointer opacity-75 hover:opacity-100 ${
                isActive
                  ? 'bg-[#211C18] text-white border-[#211C18] shadow-sm'
                  : 'bg-[var(--color-card)] text-[var(--color-ink-soft)] border-[var(--color-line)]/55 hover:border-[var(--color-terracotta)]'
              }`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full border border-black/5" 
                style={{ background: cat.color }} 
              />
              {cat.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
