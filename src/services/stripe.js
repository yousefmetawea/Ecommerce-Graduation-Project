import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../firebase/config";

const functions = getFunctions(app);

/**
 * Initiates Stripe Checkout by calling the server-side Firebase Cloud Function.
 *
 * @param {Object} params
 * @param {Array} params.cartItems
 * @param {Object} params.buyer
 * @param {Object} params.shippingAddress
 * @param {string|null} params.userId
 * @param {Object|null} params.promoCode
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function createStripeSession({ cartItems, buyer, shippingAddress, userId, promoCode }) {
  const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${window.location.origin}/checkout?canceled=true`;

  const createSessionFn = httpsCallable(functions, "createStripeCheckoutSession");

  const response = await createSessionFn({
    cartItems,
    buyer,
    shippingAddress,
    userId,
    promoCode,
    successUrl,
    cancelUrl,
  });

  if (!response.data || !response.data.url) {
    throw new Error("Failed to create Stripe Checkout session. Please check server configuration.");
  }

  return response.data;
}

/**
 * Verifies a Stripe Checkout payment after user is redirected back to success URL.
 *
 * @param {string} sessionId - Stripe Checkout Session ID
 * @returns {Promise<{ success: boolean, orders: Array }>}
 */
export async function verifyStripePayment(sessionId) {
  if (!sessionId) {
    throw new Error("Missing session ID for Stripe payment verification.");
  }

  const verifyPaymentFn = httpsCallable(functions, "verifyStripePayment");
  const response = await verifyPaymentFn({ sessionId });

  if (!response.data || !response.data.success) {
    throw new Error("Payment verification failed or returned incomplete status.");
  }

  return response.data;
}
