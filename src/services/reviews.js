import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Fetch all reviews for a product.
 * Returns array sorted newest first.
 */
export async function fetchReviewsForProduct(productId) {
  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all reviews written by a user.
 */
export async function fetchReviewsByUser(userId) {
  const q = query(
    collection(db, "reviews"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Check whether the user has already reviewed this product.
 */
export async function hasUserReviewedProduct(userId, productId) {
  const q = query(
    collection(db, "reviews"),
    where("userId", "==", userId),
    where("productId", "==", productId)
  );
  const snap = await getDocs(q);
  return !snap.empty ? snap.docs[0].id : null;
}

/**
 * Submit a new review and atomically update the product's aggregate rating.
 * @param {{ userId, userName, productId, rating, comment }} data
 */
export async function submitReview({ userId, userName, productId, rating, comment }) {
  const ratingNum = Number(rating);
  if (ratingNum < 1 || ratingNum > 5) throw new Error("Rating must be between 1 and 5.");

  const productRef = doc(db, "products", productId);

  return runTransaction(db, async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists()) throw new Error("Product not found.");

    const data = productSnap.data();
    const oldCount = Number(data.ratingCount) || 0;
    const oldRating = Number(data.rating) || 0;
    const newCount = oldCount + 1;
    const newRating = (oldRating * oldCount + ratingNum) / newCount;

    // Write review document
    const reviewRef = doc(collection(db, "reviews"));
    tx.set(reviewRef, {
      userId,
      userName,
      productId,
      rating: ratingNum,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });

    // Update product aggregate rating
    tx.update(productRef, {
      rating: Math.round(newRating * 10) / 10,
      ratingCount: newCount,
    });

    return reviewRef.id;
  });
}

/**
 * Delete a review and recalculate the product's aggregate rating.
 */
export async function deleteReview(reviewId, productId) {
  const reviewRef = doc(db, "reviews", reviewId);
  const productRef = doc(db, "products", productId);

  return runTransaction(db, async (tx) => {
    const [reviewSnap, productSnap] = await Promise.all([
      tx.get(reviewRef),
      tx.get(productRef),
    ]);
    if (!reviewSnap.exists()) throw new Error("Review not found.");

    const { rating: deletedRating } = reviewSnap.data();
    const data = productSnap.data();
    const oldCount = Number(data.ratingCount) || 1;
    const oldRating = Number(data.rating) || 0;
    const newCount = Math.max(0, oldCount - 1);
    const newRating =
      newCount === 0 ? 0 : (oldRating * oldCount - deletedRating) / newCount;

    tx.delete(reviewRef);
    tx.update(productRef, {
      rating: newCount === 0 ? 0 : Math.round(newRating * 10) / 10,
      ratingCount: newCount,
    });
  });
}
