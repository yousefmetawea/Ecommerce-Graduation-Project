import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { verifyStripePayment } from "../../services/stripe";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No payment session ID found.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function processVerification() {
      try {
        const result = await verifyStripePayment(sessionId);
        if (!isMounted) return;

        if (result.success && result.orders) {
          clearCart();
          navigate("/order-confirmation", {
            replace: true,
            state: { orders: result.orders },
          });
        } else {
          setError("Could not verify your Stripe payment. Please try again or contact support.");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to verify payment with Stripe.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    processVerification();

    return () => {
      isMounted = false;
    };
  }, [sessionId, clearCart, navigate]);

  if (loading) {
    return (
      <div className="cart-empty" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div className="spinner" style={{ margin: "0 auto 1.5rem auto" }} />
        <h2>Verifying your payment…</h2>
        <p>Please wait a moment while we confirm your Stripe payment and finalize your order.</p>
      </div>
    );
  }

  return (
    <div className="cart-empty" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <span className="eyebrow" style={{ color: "#ef4444" }}>Payment Verification Issue</span>
      <h1>Something went wrong</h1>
      <p style={{ maxWidth: "480px", margin: "1rem auto 2rem auto" }}>{error}</p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link to="/checkout" className="btn btn-primary">Return to checkout</Link>
        <Link to="/" className="btn btn-secondary">Go to shop</Link>
      </div>
    </div>
  );
}
