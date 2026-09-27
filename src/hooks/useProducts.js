import { useEffect, useMemo, useState } from "react";
import { fetchAllProducts } from "../services/products";
import { fetchCategories } from "../services/categories";

const PAGE_SIZE = 12;

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [productList, categoryList] = await Promise.all([
          fetchAllProducts(),
          fetchCategories(),
        ]);
        if (!cancelled) {
          setProducts(productList);
          setCategories(categoryList);
        }
      } catch (err) {
        if (!cancelled) setError("Couldn't load products. Check your Firestore setup and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset to page 1 whenever a filter changes, so results don't land
  // on an empty page after narrowing the list.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryId, maxPrice]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesTerm = !term || p.name?.toLowerCase().includes(term);
      const matchesCategory = categoryId === "all" || p.categoryId === categoryId;
      const matchesPrice = !maxPrice || p.price <= Number(maxPrice);
      return matchesTerm && matchesCategory && matchesPrice;
    });
  }, [products, searchTerm, categoryId, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
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
    totalCount: products.length,
    resultCount: filtered.length,
    products: pageItems,
  };
}
