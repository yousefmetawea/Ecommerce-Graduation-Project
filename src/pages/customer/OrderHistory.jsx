import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchOrdersByUser } from "../../services/customerOrders";

const money = (n) => `$${Number(n).toFixed(2)}`;

const STATUS_CLASSES = {
  pending: "tag-amber",
  processing: "tag-amber",
  shipped: "tag",
  delivered: "tag-sage",
  cancelled: "tag-rust",
};

function statusLabel(status) {
  return status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
    : "Unknown";
}

function formatDate(ts) {
  if (!ts) return "—";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function OrderHistory() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    fetchOrdersByUser(currentUser.uid)
      .then(setOrders)
      .catch(() => setError("Couldn't load your orders. Please try again."))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) return <div className="placeholder-panel">Loading your orders…</div>;
  if (error) return <div className="placeholder-panel">{error}</div>;

  if (!orders.length) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Order History</span>
        <h1>No orders yet.</h1>
        <p>Your placed orders will show up here once you've checked out.</p>
        <Link to="/" className="btn btn-primary cart-empty-action">Start shopping</Link>
      </section>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Order History</h1>
        </div>
        <Link to="/account" className="text-link">← Back to account</Link>
      </div>

      <div className="order-history-list">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          const statusClass = STATUS_CLASSES[order.status] ?? "tag";
          return (
            <article key={order.id} className="order-card">
              <div
                className="order-card-header"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setExpanded(isOpen ? null : order.id)}
                aria-expanded={isOpen}
              >
                <div className="order-card-meta">
                  <div>
                    <span className="order-meta-label">Order placed</span>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="order-meta-label">Seller</span>
                    <strong>{order.sellerName}</strong>
                  </div>
                  <div>
                    <span className="order-meta-label">Total</span>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                <div className="order-card-right">
                  <span className={`tag ${statusClass}`}>{statusLabel(order.status)}</span>
                  <span className="order-toggle-icon">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div className="order-card-body">
                  {/* Order tracking progress */}
                  <OrderTracker status={order.status} />

                  <div className="order-items">
                    {order.items.map((item) => (
                      <div className="order-item" key={item.productId}>
                        <div className="order-item-img">
                          {item.image
                            ? <img src={item.image} alt={item.name} />
                            : <span>No img</span>}
                        </div>
                        <div className="order-item-details">
                          <Link to={`/product/${item.productId}`} className="order-item-name">
                            {item.name}
                          </Link>
                          <span className="order-item-qty">Qty: {item.quantity}</span>
                        </div>
                        <strong className="order-item-price">{money(item.price * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-detail-meta">
                    <div>
                      <span className="order-meta-label">Ship to</span>
                      <span>{order.shippingAddress?.address}, {order.shippingAddress?.city}</span>
                    </div>
                    <div>
                      <span className="order-meta-label">Payment</span>
                      <span>
                        {order.paymentMethod === "stripe" ? "Credit / Debit Card (Stripe Test Demo)" : "Cash on delivery"}
                        {order.paymentStatus === "paid" ? " (Paid)" : " (Pending)"}
                      </span>
                    </div>
                    <div>
                      <span className="order-meta-label">Order ID</span>
                      <span className="order-id-text">{order.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

const STEPS = ["pending", "processing", "shipped", "delivered"];
const STEP_LABELS = {
  pending: "Order Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

function OrderTracker({ status }) {
  const cancelled = status === "cancelled";
  const currentIndex = STEPS.indexOf(status);

  if (cancelled) {
    return (
      <div className="order-tracker">
        <div className="order-tracker-cancelled">
          <span className="tag tag-rust">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracker">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className={`tracker-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
            <div className="tracker-dot">{done && !active ? "✓" : i + 1}</div>
            <span className="tracker-label">{STEP_LABELS[step]}</span>
            {i < STEPS.length - 1 && (
              <div className={`tracker-line ${i < currentIndex ? "done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
