import { placeOrders } from "./orders";

/**
 * Simulates Stripe Test Mode card payment processing without requiring a paid
 * server (Firebase Blaze plan) or exposing secret keys.
 *
 * @param {Object} params
 * @param {Array} params.cartItems
 * @param {Object} params.buyer
 * @param {Object} params.shippingAddress
 * @param {string|null} params.userId
 * @param {Object|null} params.promoCode
 * @param {Object} [params.cardDetails]
 * @returns {Promise<{ success: boolean, orders: Array }>}
 */
export async function processStripeTestPayment({
  cartItems,
  buyer,
  shippingAddress,
  userId,
  promoCode,
  cardDetails = {},
}) {
  // Simulate 1 second payment gateway network latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const cardNumber = (cardDetails.cardNumber || "4242424242424242").replace(/\s+/g, "");

  // Basic validation check for test card
  if (!cardNumber.startsWith("4242")) {
    throw new Error("Invalid test card. Please use Stripe test card number: 4242 4242 4242 4242");
  }

  // Create Firestore orders with Stripe payment status
  const orders = await placeOrders({
    cartItems,
    buyer,
    shippingAddress,
    userId,
    promoCode,
    paymentMethod: "stripe",
    paymentStatus: "paid",
  });

  return { success: true, orders };
}

/**
 * Mock helper for verifying payment session (kept for compatibility).
 */
export async function verifyStripePayment() {
  return { success: false, message: "Use direct test card payment flow." };
}

/**
 * Mock helper for session creation (kept for compatibility).
 */
export async function createStripeSession(params) {
  return processStripeTestPayment(params);
}
