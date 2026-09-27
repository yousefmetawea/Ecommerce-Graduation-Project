import { useState } from "react";
import { Link } from "react-router-dom";

export default function AdminOrderModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}) {
  const [selectedStatus, setSelectedStatus] = useState(order?.status || "pending");

  if (!isOpen || !order) return null;

  const createdAtDate = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000)
    : null;

  function handleSaveStatus() {
    if (selectedStatus !== order.status) {
      onUpdateStatus(order.id, selectedStatus);
    }
  }

  const statusColors = {
    pending: "tag-amber",
    processing: "tag-amber",
    shipped: "tag-sage",
    delivered: "tag-sage",
    cancelled: "tag-rust",
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Admin Order Inspector</h2>
            <p className="order-id-text">Order #{order.id}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="seller-order-modal-body">
          {/* Status Bar */}
          <div className="order-status-bar">
            <div>
              <span className="stat-label">Order Status</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                <span className={`tag ${statusColors[order.status] || ""}`}>
                  {order.status}
                </span>
                {createdAtDate && (
                  <span className="order-date-text">
                    Placed {createdAtDate.toLocaleDateString()} at {createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <div className="status-update-control">
              <label htmlFor="admin-order-status" className="stat-label">
                Override Status:
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  id="admin-order-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "auto", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                  disabled={selectedStatus === order.status || isUpdating}
                  onClick={handleSaveStatus}
                >
                  {isUpdating ? "Saving…" : "Save Status"}
                </button>
              </div>
            </div>
          </div>

          <div className="seller-order-info-grid">
            {/* Buyer Details */}
            <div className="order-info-block">
              <h3>Buyer Details</h3>
              <dl className="order-dl">
                <div>
                  <dt>Name</dt>
                  <dd>{order.buyer?.name || "Anonymous / Guest"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{order.buyer?.email || "N/A"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{order.buyer?.phone || "N/A"}</dd>
                </div>
                <div>
                  <dt>User ID</dt>
                  <dd className="table-sku">{order.userId || "Guest Order"}</dd>
                </div>
              </dl>
            </div>

            {/* Seller & Shipping Details */}
            <div className="order-info-block">
              <h3>Seller &amp; Shipping</h3>
              <dl className="order-dl">
                <div>
                  <dt>Merchant / Seller</dt>
                  <dd>
                    <strong>{order.sellerName || "Seller"}</strong>
                    <div className="table-sku">Seller ID: {order.sellerId}</div>
                  </dd>
                </div>
                <div>
                  <dt>Shipping Address</dt>
                  <dd>
                    {[
                      order.shippingAddress?.address,
                      order.shippingAddress?.city,
                      order.shippingAddress?.postalCode,
                      order.shippingAddress?.country,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {order.paymentMethod === "cash_on_delivery"
                      ? "💵 Cash on Delivery (COD)"
                      : order.paymentMethod}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="order-items-block">
            <h3>Ordered Products ({order.items?.length || 0})</h3>
            <div className="order-items-table-wrapper">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`}>
                      <td>
                        <div className="table-product-cell">
                          <div className="table-product-thumb">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <span>No img</span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/product/${item.productId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="table-product-name"
                            >
                              {item.name}
                            </Link>
                            <span className="table-sku">ID: {item.productId}</span>
                          </div>
                        </div>
                      </td>
                      <td>${Number(item.price || 0).toFixed(2)}</td>
                      <td>
                        <span className="quantity-badge">{item.quantity}</span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: "right", fontWeight: 600 }}>
                      Grand Total:
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>
                      ${Number(order.total || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
