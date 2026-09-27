import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../services/wishlist";

const WishlistContext = createContext(null);

/**
 * Provides wishlist state for the logged-in customer.
 * Falls back to an empty in-memory set when the user is logged out.
 */
export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState([]); // array of product IDs

  useEffect(() => {
    if (!currentUser) {
      setWishlist([]);
      return;
    }
    fetchWishlist(currentUser.uid).then(setWishlist).catch(() => setWishlist([]));
  }, [currentUser]);

  async function toggle(productId) {
    if (!currentUser) return;
    const isIn = wishlist.includes(productId);
    // Optimistic update
    setWishlist((prev) =>
      isIn ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    try {
      if (isIn) {
        await removeFromWishlist(currentUser.uid, productId);
      } else {
        await addToWishlist(currentUser.uid, productId);
      }
    } catch {
      // Roll back on failure
      setWishlist((prev) =>
        isIn ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  }

  function isWishlisted(productId) {
    return wishlist.includes(productId);
  }

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside a WishlistProvider");
  return ctx;
}
