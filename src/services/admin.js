import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Slugify string helper
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------------- USER MANAGEMENT ---------------- */

/**
 * Fetch all users from Firestore.
 */
export async function fetchAllUsers() {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // Fallback without ordering in case index or field missing on old docs
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return users.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Update user role (e.g. "customer", "seller", "admin")
 */
export async function updateUserRole(userId, newRole) {
  const validRoles = ["customer", "seller", "admin"];
  if (!validRoles.includes(newRole)) throw new Error("Invalid role specified.");

  await updateDoc(doc(db, "users", userId), {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft Delete / Toggle User Status (e.g. "active", "suspended", "inactive")
 */
export async function updateUserStatus(userId, newStatus) {
  const validStatuses = ["active", "suspended", "inactive"];
  if (!validStatuses.includes(newStatus)) throw new Error("Invalid status specified.");

  await updateDoc(doc(db, "users", userId), {
    status: newStatus,
    statusUpdatedAt: serverTimestamp(),
  });
}

/**
 * Hard delete user document
 */
export async function deleteUserDoc(userId) {
  await deleteDoc(doc(db, "users", userId));
}

/* ---------------- PRODUCT MANAGEMENT ---------------- */

/**
 * Fetch all products in marketplace.
 */
export async function fetchAllAdminProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, "products"));
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return products.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Admin update product details
 */
export async function adminUpdateProduct(productId, updates) {
  const sanitized = { updatedAt: serverTimestamp() };

  if (updates.name !== undefined) sanitized.name = updates.name.trim();
  if (updates.description !== undefined) sanitized.description = updates.description.trim();

  if (updates.price !== undefined) {
    const price = Number(updates.price);
    if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price.");
    sanitized.price = price;
  }

  if (updates.stock !== undefined) {
    const stock = Math.floor(Number(updates.stock));
    if (!Number.isFinite(stock) || stock < 0) throw new Error("Invalid stock.");
    sanitized.stock = stock;
  }

  if (updates.categoryName !== undefined) {
    sanitized.categoryName = updates.categoryName.trim();
    sanitized.categoryId = updates.categoryId || slugify(sanitized.categoryName);
  }

  if (updates.images !== undefined) {
    sanitized.images = Array.isArray(updates.images)
      ? updates.images.map((img) => (typeof img === "string" ? img.trim() : "")).filter(Boolean)
      : [];
  }

  await updateDoc(doc(db, "products", productId), sanitized);
}

/**
 * Admin delete product
 */
export async function adminDeleteProduct(productId) {
  await deleteDoc(doc(db, "products", productId));
}

/* ---------------- CATEGORY MANAGEMENT ---------------- */

/**
 * Fetch all categories
 */
export async function fetchAllCategories() {
  const q = query(collection(db, "categories"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create a new category
 */
export async function createCategory(data) {
  if (!data.name || !data.name.trim()) throw new Error("Category name is required.");
  const id = data.slug ? slugify(data.slug) : slugify(data.name);

  // Check if exists
  const existing = await getDoc(doc(db, "categories", id));
  if (existing.exists()) {
    throw new Error(`Category with identifier "${id}" already exists.`);
  }

  const categoryDoc = {
    name: data.name.trim(),
    description: (data.description || "").trim(),
    image: (data.image || "").trim(),
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "categories", id), categoryDoc);
  return { id, ...categoryDoc };
}

/**
 * Update a category
 */
export async function updateCategory(categoryId, updates) {
  const sanitized = {};
  if (updates.name !== undefined) sanitized.name = updates.name.trim();
  if (updates.description !== undefined) sanitized.description = updates.description.trim();
  if (updates.image !== undefined) sanitized.image = updates.image.trim();

  await updateDoc(doc(db, "categories", categoryId), sanitized);
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId) {
  await deleteDoc(doc(db, "categories", categoryId));
}

/* ---------------- ORDER MANAGEMENT ---------------- */

/**
 * Fetch all platform orders across all sellers and buyers
 */
export async function fetchAllAdminOrders() {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, "orders"));
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Admin update order status
 */
export async function adminUpdateOrderStatus(orderId, newStatus) {
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  await updateDoc(doc(db, "orders", orderId), {
    status: newStatus,
    adminStatusUpdatedAt: serverTimestamp(),
  });
}

/**
 * Admin delete order
 */
export async function adminDeleteOrder(orderId) {
  await deleteDoc(doc(db, "orders", orderId));
}
