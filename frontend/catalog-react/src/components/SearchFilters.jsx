export default function SearchFilters({ sortBy, onChangeSort }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-2 flex justify-end select-none">
      <select
        value={sortBy}
        onChange={e => onChangeSort(e.target.value)}
        className="text-xs px-3 py-1.5 rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-terracotta)] cursor-pointer"
      >
        <option value="default">Ordenar por</option>
        <option value="price-asc">Precio: menor a mayor</option>
        <option value="price-desc">Precio: mayor a menor</option>
        <option value="name">Nombre A-Z</option>
      </select>
    </div>
  );
}
