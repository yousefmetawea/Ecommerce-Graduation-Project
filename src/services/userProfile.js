import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase/config";

/**
 * Fetch the full Firestore user document for a given uid.
 */
export async function fetchUserProfile(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update the user's profile in Firestore and Firebase Auth displayName.
 * Only the fields passed in `updates` are changed.
 */
export async function updateUserProfile(userId, updates) {
  const allowed = ["name", "phone", "address", "city", "postalCode", "country"];
  const sanitized = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      sanitized[key] = String(updates[key] ?? "").trim();
    }
  }
  if (Object.keys(sanitized).length === 0) return;

  await updateDoc(doc(db, "users", userId), sanitized);

  // Keep Firebase Auth displayName in sync with the Firestore name field.
  if (sanitized.name && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: sanitized.name });
  }
}
