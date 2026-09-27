import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "souk-cart-v1";
const CartContext = createContext(null);

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.id === "string" && Number(item.quantity) > 0)
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart remains usable in memory if browser storage is unavailable.
    }
  }, [items]);

  function addItem(product, quantity = 1) {
    const stock = Math.max(0, Number(product.stock) || 0);
    const amount = Math.max(1, Math.floor(Number(quantity) || 1));
    if (stock < 1) return false;

    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      const nextQuantity = Math.min(stock, (existing?.quantity ?? 0) + amount);
      const snapshot = {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.images?.[0] ?? "",
        sellerId: product.sellerId ?? "",
        sellerName: product.sellerName ?? "Independent seller",
        stock,
      };
      return existing
        ? current.map((item) => (item.id === product.id ? { ...item, ...snapshot, quantity: nextQuantity } : item))
        : [...current, { ...snapshot, quantity: Math.min(stock, amount) }];
    });
    return true;
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.id !== productId));
  }

  function updateQuantity(productId, quantity) {
    const amount = Math.floor(Number(quantity));
    if (amount <= 0) {
      removeItem(productId);
      return;
    }
    setItems((current) => current.map((item) =>
      item.id === productId
        ? { ...item, quantity: Math.min(amount, Math.max(1, Number(item.stock) || amount)) }
        : item,
    ));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
