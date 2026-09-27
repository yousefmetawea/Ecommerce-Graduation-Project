import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
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
 * Returns true if a product is in the user's wishlist.
 */
export async function isWishlisted(userId, productId) {
  const snap = await getDoc(doc(db, "users", userId, "wishlist", productId));
  return snap.exists();
}

/**
 * Add a product to the wishlist.
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
