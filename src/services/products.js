import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

// The catalog is small enough for an MVP that we fetch it once and do
// search/filter/pagination client-side (see useProducts). This avoids
// needing Firestore composite indexes for every filter combination.
// If the catalog grows large, swap this for server-side `where()` queries.
export async function fetchAllProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchProductById(id) {
  const snap = await getDoc(doc(db, "products", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
