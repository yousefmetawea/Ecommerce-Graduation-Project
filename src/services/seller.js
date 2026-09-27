import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { db, storage, auth } from "../firebase/config";

/**
 * Fetch all products belonging to a specific seller.
 */
export async function fetchSellerProducts(sellerId) {
  if (!sellerId) return [];
  try {
    const q = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // If composite index is missing or building, fallback to client-side sorting
    console.warn("Falling back to un-ordered query for seller products:", err?.message);
    const q = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return items.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Helper to slugify category names.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create a new product as a seller.
 */
export async function createSellerProduct(sellerId, sellerName, data) {
  if (!sellerId) throw new Error("Seller ID is required.");
  if (!data.name || !data.name.trim()) throw new Error("Product name is required.");
  
  const price = Number(data.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Please enter a valid product price.");
  }

  const stock = Math.floor(Number(data.stock));
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Please enter a valid stock quantity (0 or more).");
  }

  const categoryName = (data.categoryName || data.category || "General").trim();
  const categoryId = data.categoryId || slugify(categoryName);

  const images = Array.isArray(data.images)
    ? data.images.map((img) => (typeof img === "string" ? img.trim() : "")).filter(Boolean)
    : [];

  const newProductRef = doc(collection(db, "products"));

  const productPayload = {
    name: data.name.trim(),
    description: (data.description || "").trim(),
    price,
    stock,
    categoryId,
    categoryName,
    images: images.length > 0 ? images : [],
    rating: 0,
    ratingCount: 0,
    sellerId,
    sellerName: sellerName || "Store Seller",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newProductRef, productPayload);
  return { id: newProductRef.id, ...productPayload };
}

/**
 * Update an existing product.
 */
export async function updateSellerProduct(productId, updates) {
  if (!productId) throw new Error("Product ID is required.");
  
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

  if (updates.sellerName !== undefined) {
    sanitized.sellerName = updates.sellerName.trim();
  }

  await updateDoc(doc(db, "products", productId), sanitized);
}

/**
 * Quick stock update.
 */
export async function updateProductStock(productId, newStock) {
  const stock = Math.max(0, Math.floor(Number(newStock)));
  if (!Number.isFinite(stock)) throw new Error("Invalid stock count.");
  await updateDoc(doc(db, "products", productId), {
    stock,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a product.
 */
export async function deleteSellerProduct(productId) {
  if (!productId) throw new Error("Product ID is required.");
  await deleteDoc(doc(db, "products", productId));
}

/**
 * Fetch all orders belonging to a seller.
 */
export async function fetchSellerOrders(sellerId) {
  if (!sellerId) return [];
  try {
    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Falling back to un-ordered query for seller orders:", err?.message);
    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", sellerId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return items.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Update order status by seller.
 * Allowed statuses: "pending", "processing", "shipped", "delivered", "cancelled"
 */
export async function updateOrderStatus(orderId, newStatus) {
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  await updateDoc(doc(db, "orders", orderId), {
    status: newStatus,
    statusUpdatedAt: serverTimestamp(),
  });
}

/**
 * Fetch full seller profile details.
 */
export async function fetchSellerProfile(sellerId) {
  if (!sellerId) return null;
  const snap = await getDoc(doc(db, "users", sellerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update seller store & profile details.
 */
export async function updateSellerProfile(sellerId, updates) {
  const allowed = [
    "storeName",
    "storeBio",
    "name",
    "phone",
    "businessEmail",
    "address",
    "city",
    "postalCode",
    "country",
  ];
  const sanitized = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      sanitized[key] = String(updates[key] ?? "").trim();
    }
  }

  await updateDoc(doc(db, "users", sellerId), sanitized);

  // Sync auth display name if name or storeName is provided
  const preferredName = sanitized.storeName || sanitized.name;
  if (preferredName && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: preferredName });
  }
}

/**
 * Upgrade user to seller role.
 */
export async function upgradeToSeller(userId, storeData = {}) {
  const storeName = (storeData.storeName || auth.currentUser?.displayName || "My Store").trim();
  const sanitized = {
    role: "seller",
    storeName,
    storeBio: (storeData.storeBio || "").trim(),
    phone: (storeData.phone || "").trim(),
    address: (storeData.address || "").trim(),
    city: (storeData.city || "").trim(),
    country: (storeData.country || "").trim(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "users", userId), sanitized);
  if (auth.currentUser && storeName) {
    await updateProfile(auth.currentUser, { displayName: storeName });
  }
}

/**
 * Upload a product image to Firebase Storage with progress callback.
 */
export async function uploadProductImage(file, sellerId, onProgress = null) {
  if (!file) throw new Error("No file selected.");
  if (!sellerId) throw new Error("Seller ID is required for image upload.");

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `products/${sellerId}/${Date.now()}_${cleanFileName}`;
  const fileRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}
