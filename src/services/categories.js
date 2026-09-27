import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

// Categories are a small, rarely-changing list, so we just fetch them all.
export async function fetchCategories() {
  const q = query(collection(db, "categories"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
