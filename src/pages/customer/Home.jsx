import ProductCard from "../../components/ProductCard";
import ProductFilters from "../../components/ProductFilters";
import Pagination from "../../components/Pagination";
import { useProducts } from "../../hooks/useProducts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Home() {
  const {
    loading,
    error,
    categories,
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    maxPrice,
    setMaxPrice,
    page,
    setPage,
    totalPages,
    totalCount,
    resultCount,
    products,
  } = useProducts();

  return (
    <div>
      <h1>Everything, from everyone you trust.</h1>
      <p>Browse listings from independent sellers in one place.</p>

      <ProductFilters
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        resultCount={resultCount}
      />

      {loading && (
        <div className="product-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="product-card" style={{ height: 320, padding: 12 }}>
              <Skeleton height={180} borderRadius={6} style={{ marginBottom: 12 }} />
              <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
              <Skeleton height={20} style={{ marginBottom: 12 }} />
              <Skeleton width={60} height={18} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <div className="form-error">{error}</div>}

      {!loading && !error && resultCount === 0 && (
        <div className="placeholder-panel">
          {totalCount === 0
            ? "No products yet. Run `npm run seed` to load the starter catalog."
            : "No products match your filters."}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}


      {!loading && !error && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
