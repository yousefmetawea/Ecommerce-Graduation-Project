export default function ProductFilters({
  categories,
  searchTerm,
  onSearchChange,
  categoryId,
  onCategoryChange,
  maxPrice,
  onMaxPriceChange,
  resultCount,
}) {
  return (
    <div className="filters-bar">
      <input
        type="search"
        className="filters-search"
        placeholder="Search products…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search products by name"
      />

      <select
        className="filters-select"
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="filters-price">
        <label htmlFor="maxPrice">Under $</label>
        <input
          id="maxPrice"
          type="number"
          min="0"
          placeholder="Any"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
        />
      </div>

      <span className="filters-count">{resultCount} results</span>
    </div>
  );
}
