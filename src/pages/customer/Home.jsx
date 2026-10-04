import ProductCard from "../../components/ProductCard";
import Pagination from "../../components/Pagination";
import { useProducts } from "../../hooks/useProducts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Search, Shield, Truck, CreditCard, Store } from "lucide-react";

const TRUST_BADGES = [
  { icon: Shield, label: "Secure Checkout" },
  { icon: Truck, label: "Fast Delivery" },
  { icon: CreditCard, label: "Cash & Cards" },
  { icon: Store, label: "Trusted Sellers" },
];

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

  const hasActiveFilters = searchTerm || categoryId !== "all" || maxPrice;

  function clearFilters() {
    setSearchTerm("");
    setCategoryId("all");
    setMaxPrice("");
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      {/* Hero — the ONLY place for search + categories */}
      <section className="bg-ink text-paper overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-amber-brand mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
          <Store size={14} />
          Souk marketplace
        </p>
        <h1 className="font-display max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">
          Everything, from everyone you trust.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
          Browse listings from independent sellers in one place. Search, filter by category and price, and check out in minutes.
        </p>

        <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg">
          <Search size={18} className="ml-2 shrink-0 text-gray-400" />
          <input
            type="search"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Search products…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            aria-label="Search products by name"
          />
          <span className="bg-paper hidden rounded-xl border px-3 py-1.5 text-xs font-medium whitespace-nowrap text-gray-500 sm:block">
            {resultCount} results
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategoryId("all");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              categoryId === "all"
                ? "bg-amber-brand text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            All
          </button>
          {categories.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryId(c.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                categoryId === c.id
                  ? "bg-amber-brand text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
          >
            <span className="bg-paper flex h-8 w-8 items-center justify-center rounded-full border">
              <Icon size={15} className="text-amber-brand" />
            </span>
            {label}
          </div>
        ))}
      </section>

      {/* Filter toolbar: full category dropdown + max price (pills in hero are quick filters) */}
      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
        <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-500">
          Category
        </label>
        <select
          id="categoryFilter"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-brand"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="hidden h-6 w-px bg-black/10 sm:block" aria-hidden="true" />

        <label htmlFor="maxPrice" className="text-sm font-medium text-gray-500">
          Max price $
        </label>
        <input
          id="maxPrice"
          type="number"
          min="0"
          placeholder="Any"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          className="w-28 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-brand"
        />
        <div className="ml-auto flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs font-medium text-gray-400">{resultCount} results</span>
        </div>
      </section>

      {/* Content states */}
      {loading && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
              <Skeleton height={180} borderRadius={12} style={{ marginBottom: 12 }} />
              <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
              <Skeleton height={20} style={{ marginBottom: 12 }} />
              <Skeleton width={60} height={18} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && resultCount === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">
            {totalCount === 0 ? "No products yet" : "No products match your filters"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {totalCount === 0
              ? "Run `npm run seed` to load the starter catalog."
              : "Try a different search term or category."}
          </p>
          {hasActiveFilters && totalCount > 0 && (
            <button
              onClick={clearFilters}
              className="bg-ink mt-4 rounded-full px-5 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
