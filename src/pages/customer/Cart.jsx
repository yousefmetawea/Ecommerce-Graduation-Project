import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const money = (amount) => `$${Number(amount).toFixed(2)}`;

export default function Cart() {
  const {
    items,
    itemCount,
    subtotal,
    promoCode,
    discount,
    total,
    removeItem,
    updateQuantity,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  async function handleApplyPromo(e) {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    if (!promoInput.trim()) return;

    setApplyingPromo(true);
    try {
      const res = await applyPromo(promoInput);
      setPromoSuccess(`Promo code "${res.code}" applied!`);
      setPromoInput("");
    } catch (err) {
      setPromoError(err?.message || "Invalid promo code.");
    } finally {
      setApplyingPromo(false);
    }
  }

  function handleRemovePromo() {
    removePromo();
    setPromoSuccess("");
    setPromoError("");
  }

  if (items.length === 0) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Your bag</span>
        <h1>Your cart is taking a breather.</h1>
        <p>Find something good from an independent seller and it will show up here.</p>
        <Link to="/" className="btn btn-primary cart-empty-action">Explore the shop</Link>
      </section>
    );
  }

  return (
    <div className="checkout-page">
      <div>
        <div className="page-heading">
          <div>
            <span className="eyebrow">Your bag · {itemCount} {itemCount === 1 ? "item" : "items"}</span>
            <h1>Shopping cart</h1>
          </div>
          <Link to="/" className="text-link">Continue shopping</Link>
        </div>

        <div className="cart-list">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <div className="cart-item-image">
                {item.image ? <img src={item.image} alt={item.name} /> : <span>No image</span>}
              </div>
              <div className="cart-item-details">
                <span className="cart-seller">{item.sellerName}</span>
                <h2>{item.name}</h2>
                <span className="cart-unit-price">{money(item.price)} each</span>
                <div className="cart-item-controls">
                  <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  <button type="button" className="remove-item" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
              <strong className="cart-line-total">{money(item.price * item.quantity)}</strong>
            </article>
          ))}
        </div>
      </div>

      <aside className="order-summary">
        <span className="eyebrow">Summary</span>
        <h2>Order total</h2>

        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>

        {/* Promo Code section */}
        <div className="promo-box">
          {promoCode ? (
            <div className="promo-applied-badge">
              <div>
                <span className="promo-tag-name">🏷️ {promoCode.code}</span>
                <span className="promo-tag-desc">
                  {promoCode.type === "percentage" ? `${promoCode.value}% OFF` : `${money(promoCode.value)} OFF`}
                </span>
              </div>
              <button
                type="button"
                className="promo-remove-btn"
                onClick={handleRemovePromo}
                title="Remove promo code"
                aria-label="Remove promo code"
              >
                ✕
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyPromo} className="promo-form">
              <div className="promo-input-wrap">
                <input
                  type="text"
                  placeholder="Promo or discount code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={applyingPromo}
                />
                <button
                  type="submit"
                  className="btn btn-secondary promo-apply-btn"
                  disabled={!promoInput.trim() || applyingPromo}
                >
                  {applyingPromo ? "…" : "Apply"}
                </button>
              </div>
            </form>
          )}

          {promoSuccess && <div className="promo-msg-success">{promoSuccess}</div>}
          {promoError && <div className="promo-msg-error">{promoError}</div>}
        </div>

        {discount > 0 && (
          <div className="summary-row summary-discount">
            <span>Discount ({promoCode?.code})</span>
            <strong>-{money(discount)}</strong>
          </div>
        )}

        <div className="summary-row">
          <span>Shipping</span>
          <span>Calculated by seller</span>
        </div>

        <div className="summary-row summary-total">
          <span>Items total</span>
          <strong>{money(total)}</strong>
        </div>

        <p className="summary-note">
          Orders from different sellers are placed separately. Shipping charges are confirmed by each seller and are not included yet.
        </p>

        <Link to="/checkout" className="btn btn-primary">
          Continue to checkout
        </Link>
        <div className="secure-note">No account required · Cash on delivery</div>
      </aside>
    </div>
  );
}
