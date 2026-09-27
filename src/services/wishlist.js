import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Returns the wishlist sub-collection reference for a user.
 */
function wishlistRef(userId) {
  return collection(db, "users", userId, "wishlist");
}

/**
 * Fetch all wishlist item IDs for a user.
 * Returns an array of product IDs.
 */
export async function fetchWishlist(userId) {
  const snap = await getDocs(wishlistRef(userId));
  return snap.docs.map((d) => d.id);
}

/**
 * Add a product to the wishlist.
 * The product id is the doc id, so this is idempotent — hearting the same
 * product twice just re-stamps addedAt.
 */
export async function addToWishlist(userId, productId) {
  await setDoc(doc(db, "users", userId, "wishlist", productId), {
    addedAt: serverTimestamp(),
  });
}

/**
 * Remove a product from the wishlist.
 */
export async function removeFromWishlist(userId, productId) {
  await deleteDoc(doc(db, "users", userId, "wishlist", productId));
}
