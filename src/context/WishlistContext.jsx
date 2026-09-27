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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setWishlist([]);
      setError("");
      return;
    }
    let cancelled = false;
    fetchWishlist(currentUser.uid)
      .then((ids) => {
        if (!cancelled) setWishlist(ids);
      })
      .catch((err) => {
        if (cancelled) return;
        setWishlist([]);
        setError(friendlyError(err, "load your wishlist"));
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  async function toggle(productId) {
    if (!currentUser) return;
    const isIn = wishlist.includes(productId);
    // Optimistic update
    setWishlist((prev) =>
      isIn ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    setError("");
    try {
      if (isIn) {
        await removeFromWishlist(currentUser.uid, productId);
      } else {
        await addToWishlist(currentUser.uid, productId);
      }
    } catch (err) {
      // Roll back so the UI never shows a save that didn't persist.
      setWishlist((prev) =>
        isIn ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      // A silent rollback looks like the app is just ignoring you, so say why.
      setError(friendlyError(err, isIn ? "remove that item" : "save that item"));
    }
  }

  function isWishlisted(productId) {
    return wishlist.includes(productId);
  }

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, error }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside a WishlistProvider");
  return ctx;
}

// Firestore throws codes like "permission-denied" — spell out the one cause
// that's actually fixable here, because a bare code gives no clue what to do.
function friendlyError(err, action) {
  const code = err?.code ?? "";
  if (code.includes("permission-denied")) {
    return `Couldn't ${action}: permission denied by Firestore rules. Make sure the rules in firestore.rules are published in the Firebase console.`;
  }
  if (code.includes("unavailable")) {
    return `Couldn't ${action}: you appear to be offline.`;
  }
  return `Couldn't ${action}. Please try again.`;
}
