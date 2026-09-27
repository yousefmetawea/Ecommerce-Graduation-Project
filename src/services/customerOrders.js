import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Fetch all orders that belong to a specific customer (by userId).
 * Orders are sorted newest-first.
 */
export async function fetchOrdersByUser(userId) {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch a single order by its ID.
 */
export async function fetchOrderById(orderId) {
  const snap = await getDoc(doc(db, "orders", orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export { placeOrders } from "./orders";
