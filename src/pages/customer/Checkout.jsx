import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { placeOrders } from "../../services/orders";

const money = (amount) => `$${Number(amount).toFixed(2)}`;

export default function Checkout() {
  const { currentUser } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: currentUser?.displayName ?? "",
    email: currentUser?.email ?? "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!items.length || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const orders = await placeOrders({
        cartItems: items,
        buyer: { name: form.name, email: form.email, phone: form.phone },
        shippingAddress: {
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        userId: currentUser?.uid ?? null,
      });
      clearCart();
      navigate("/order-confirmation", { replace: true, state: { orders } });
    } catch (checkoutError) {
      setError(checkoutError.message || "We couldn't place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Checkout</span>
        <h1>Your cart is empty.</h1>
        <p>Add a few things to your cart before checking out.</p>
        <Link to="/" className="btn btn-primary cart-empty-action">Explore the shop</Link>
      </section>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">Almost yours</span><h1>Checkout</h1></div>
        <Link to="/cart" className="text-link">Back to cart</Link>
      </div>

      <div className="checkout-page checkout-form-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="checkout-section">
            <span className="section-number">01</span>
            <div className="checkout-section-content">
              <h2>Where should we deliver?</h2>
              <p>Guest checkout is welcome. Your details are only used to fulfill this order.</p>
              <div className="form-grid">
                <label className="form-field"><span>Full name</span><input autoComplete="name" name="name" value={form.name} onChange={updateField} required maxLength={100} /></label>
                <label className="form-field"><span>Email address</span><input autoComplete="email" type="email" name="email" value={form.email} onChange={updateField} required maxLength={254} /></label>
                <label className="form-field"><span>Phone number</span><input autoComplete="tel" type="tel" name="phone" value={form.phone} onChange={updateField} required maxLength={30} /></label>
                <label className="form-field field-full"><span>Street address</span><input autoComplete="street-address" name="address" value={form.address} onChange={updateField} required maxLength={180} /></label>
                <label className="form-field"><span>City</span><input autoComplete="address-level2" name="city" value={form.city} onChange={updateField} required maxLength={80} /></label>
                <label className="form-field"><span>Postal code</span><input autoComplete="postal-code" name="postalCode" value={form.postalCode} onChange={updateField} required maxLength={20} /></label>
                <label className="form-field field-full"><span>Country</span><input autoComplete="country-name" name="country" value={form.country} onChange={updateField} required maxLength={80} /></label>
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <span className="section-number">02</span>
            <div className="checkout-section-content">
              <h2>How would you like to pay?</h2>
              <label className="payment-option payment-option-selected">
                <input type="radio" name="payment" value="cash_on_delivery" checked readOnly />
                <span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
                <span className="payment-check">Selected</span>
              </label>
              <div className="payment-option payment-option-disabled" aria-disabled="true">
                <span className="payment-radio-placeholder" />
                <span><strong>Credit or debit card</strong><small>Secure online payment</small></span>
                <span className="coming-soon">Coming soon</span>
              </div>
              <div className="payment-option payment-option-disabled" aria-disabled="true">
                <span className="payment-radio-placeholder" />
                <span><strong>Digital wallet</strong><small>Pay with your preferred wallet</small></span>
                <span className="coming-soon">Coming soon</span>
              </div>
            </div>
          </section>

          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-primary place-order-button" type="submit" disabled={submitting}>
            {submitting ? "Placing your order…" : `Place order · ${money(subtotal)}`}
          </button>
          <p className="checkout-legal">By placing this order, you confirm that the delivery details are correct.</p>
        </form>

        <aside className="order-summary checkout-summary">
          <span className="eyebrow">Your order</span>
          <h2>{items.length} {items.length === 1 ? "item" : "items"}</h2>
          <div className="checkout-items">
            {items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div className="checkout-item-image">{item.image && <img src={item.image} alt="" />}</div>
                <div><strong>{item.name}</strong><span>{item.quantity} × {money(item.price)}</span></div>
                <strong>{money(item.quantity * item.price)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div className="summary-row"><span>Shipping</span><span>Confirmed by seller</span></div>
          <div className="summary-row summary-total"><span>Items total</span><strong>{money(subtotal)}</strong></div>
          <p className="summary-note">Multi-seller carts are split into separate seller orders. Shipping charges are confirmed by each seller and are not included in this total.</p>
        </aside>
      </div>
    </div>
  );
}
