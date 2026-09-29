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
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Normalize a promo code string (uppercase, alphanumeric, trimmed)
 */
export function normalizePromoCode(code) {
  return String(code || "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_-]/g, "");
}

/**
 * Validate a promo code against Firestore rules and the current cart subtotal.
 *
 * @param {string} rawCode - The promo code typed by the user.
 * @param {number} currentSubtotal - The current cart subtotal in USD.
 * @returns {Promise<Object>} The validated promo code object with discountAmount.
 */
export async function validatePromoCode(rawCode, currentSubtotal = 0) {
  const code = normalizePromoCode(rawCode);
  if (!code) {
    throw new Error("Please enter a promo code.");
  }

  const snap = await getDoc(doc(db, "promoCodes", code));
  if (!snap.exists()) {
    throw new Error(`Promo code "${code}" is invalid or does not exist.`);
  }

  const promo = snap.data();

  // Check active status
  if (promo.isActive === false) {
    throw new Error(`Promo code "${code}" is no longer active.`);
  }

  // Check expiry date
  if (promo.expiryDate) {
    let expiryMs = 0;
    if (promo.expiryDate.toDate) {
      expiryMs = promo.expiryDate.toDate().getTime();
    } else if (promo.expiryDate.seconds) {
      expiryMs = promo.expiryDate.seconds * 1000;
    } else if (typeof promo.expiryDate === "string" || typeof promo.expiryDate === "number") {
      expiryMs = new Date(promo.expiryDate).getTime();
    }

    if (expiryMs > 0 && Date.now() > expiryMs) {
      throw new Error(`Promo code "${code}" expired on ${new Date(expiryMs).toLocaleDateString()}.`);
    }
  }

  // Check usage limit
  const timesUsed = Number(promo.timesUsed || 0);
  const usageLimit = Number(promo.usageLimit);
  if (Number.isFinite(usageLimit) && usageLimit > 0 && timesUsed >= usageLimit) {
    throw new Error(`Promo code "${code}" has reached its maximum usage limit.`);
  }

  // Check minimum order subtotal
  const minOrderAmount = Number(promo.minOrderAmount || 0);
  if (minOrderAmount > 0 && currentSubtotal < minOrderAmount) {
    throw new Error(
      `Promo code "${code}" requires a minimum order of $${minOrderAmount.toFixed(2)}. Your current subtotal is $${currentSubtotal.toFixed(2)}.`
    );
  }

  // Calculate discount amount
  const type = promo.type === "fixed" ? "fixed" : "percentage";
  const value = Number(promo.value || 0);
  let discountAmount = 0;

  if (type === "percentage") {
    discountAmount = (currentSubtotal * value) / 100;
    const maxDiscount = Number(promo.maxDiscount);
    if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }
  } else {
    // Fixed discount
    discountAmount = Math.min(currentSubtotal, value);
  }

  // Round to 2 decimals
  discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);

  return {
    code,
    type,
    value,
    discountAmount,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount: Number(promo.maxDiscount) || null,
    description: promo.description || "",
    expiryDate: promo.expiryDate || null,
    usageLimit: promo.usageLimit || null,
    timesUsed,
  };
}

/**
 * Re-calculate discount for an already validated promo code when subtotal changes.
 */
export function calculatePromoDiscount(promo, currentSubtotal = 0) {
  if (!promo) return 0;
  const subtotal = Math.max(0, Number(currentSubtotal) || 0);
  const minOrder = Number(promo.minOrderAmount || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    return 0;
  }

  const type = promo.type === "fixed" ? "fixed" : "percentage";
  const value = Number(promo.value || 0);
  let discount = 0;

  if (type === "percentage") {
    discount = (subtotal * value) / 100;
    const maxDiscount = Number(promo.maxDiscount);
    if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = Math.min(subtotal, value);
  }

  return Math.max(0, Math.round(discount * 100) / 100);
}

/**
 * Increment timesUsed on promo code after successful order checkout.
 */
export async function incrementPromoUsage(code) {
  const clean = normalizePromoCode(code);
  if (!clean) return;
  try {
    await updateDoc(doc(db, "promoCodes", clean), {
      timesUsed: increment(1),
      lastUsedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not increment promo code timesUsed:", err?.message);
  }
}

/* ---------------- ADMIN MANAGEMENT CRUD ---------------- */

/**
 * Fetch all promo codes (Admin)
 */
export async function fetchAllPromoCodes() {
  try {
    const q = query(collection(db, "promoCodes"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ code: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, "promoCodes"));
    const codes = snap.docs.map((d) => ({ code: d.id, ...d.data() }));
    return codes.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
      return timeB - timeA;
    });
  }
}

/**
 * Create a new promo code (Admin)
 */
export async function createPromoCode(data) {
  const code = normalizePromoCode(data.code);
  if (!code) throw new Error("Promo code string is required.");
  if (code.length < 3) throw new Error("Promo code must be at least 3 characters.");

  const existing = await getDoc(doc(db, "promoCodes", code));
  if (existing.exists()) {
    throw new Error(`Promo code "${code}" already exists.`);
  }

  const type = data.type === "fixed" ? "fixed" : "percentage";
  const value = Number(data.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Promo discount value must be greater than 0.");
  }
  if (type === "percentage" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  const payload = {
    code,
    type,
    value,
    description: (data.description || "").trim(),
    minOrderAmount: Math.max(0, Number(data.minOrderAmount) || 0),
    maxDiscount: Number(data.maxDiscount) > 0 ? Number(data.maxDiscount) : null,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    usageLimit: Number(data.usageLimit) > 0 ? Math.floor(Number(data.usageLimit)) : null,
    timesUsed: 0,
    isActive: data.isActive !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "promoCodes", code), payload);
  return payload;
}

/**
 * Update an existing promo code (Admin)
 */
export async function updatePromoCode(code, updates) {
  const cleanCode = normalizePromoCode(code);
  if (!cleanCode) throw new Error("Promo code is required.");

  const sanitized = { updatedAt: serverTimestamp() };

  if (updates.type !== undefined) sanitized.type = updates.type === "fixed" ? "fixed" : "percentage";
  if (updates.value !== undefined) {
    const val = Number(updates.value);
    if (!Number.isFinite(val) || val <= 0) throw new Error("Invalid discount value.");
    if (sanitized.type === "percentage" && val > 100) throw new Error("Percentage cannot exceed 100%.");
    sanitized.value = val;
  }
  if (updates.description !== undefined) sanitized.description = updates.description.trim();
  if (updates.minOrderAmount !== undefined) sanitized.minOrderAmount = Math.max(0, Number(updates.minOrderAmount) || 0);
  if (updates.maxDiscount !== undefined) sanitized.maxDiscount = Number(updates.maxDiscount) > 0 ? Number(updates.maxDiscount) : null;
  if (updates.expiryDate !== undefined) sanitized.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : null;
  if (updates.usageLimit !== undefined) sanitized.usageLimit = Number(updates.usageLimit) > 0 ? Math.floor(Number(updates.usageLimit)) : null;
  if (updates.isActive !== undefined) sanitized.isActive = Boolean(updates.isActive);

  await updateDoc(doc(db, "promoCodes", cleanCode), sanitized);
}

/**
 * Toggle promo code active/inactive status (Admin)
 */
export async function togglePromoCodeStatus(code, isActive) {
  const cleanCode = normalizePromoCode(code);
  await updateDoc(doc(db, "promoCodes", cleanCode), {
    isActive: Boolean(isActive),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete promo code (Admin)
 */
export async function deletePromoCode(code) {
  const cleanCode = normalizePromoCode(code);
  await deleteDoc(doc(db, "promoCodes", cleanCode));
}
