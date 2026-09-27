import { Link, useLocation } from "react-router-dom";

const money = (amount) => `$${Number(amount).toFixed(2)}`;

export default function OrderConfirmation() {
  const { state } = useLocation();
  const orders = state?.orders ?? [];

  if (!orders.length) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Order receipt</span>
        <h1>No recent receipt found.</h1>
        <p>Order confirmations are shown immediately after checkout in this browser session.</p>
        <Link to="/" className="btn btn-primary cart-empty-action">Back to the shop</Link>
      </section>
    );
  }

  const firstOrder = orders[0];
  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <article className="receipt">
      <div className="receipt-topline"><span>Souk marketplace</span><span>ORDER RECEIPT</span></div>
      <div className="receipt-success-mark" aria-hidden="true">✓</div>
      <p className="eyebrow receipt-eyebrow">Order received</p>
      <h1>Thank you, {firstOrder.buyer.name.split(" ")[0]}.</h1>
      <p className="receipt-intro">Your order is in. Each seller will prepare their part of your delivery.</p>
      <div className="receipt-meta">
        <div><span>Placed for</span><strong>{firstOrder.buyer.name}</strong></div>
        <div><span>Payment</span><strong>Cash on delivery</strong></div>
        <div><span>Deliver to</span><strong>{firstOrder.shippingAddress.address}, {firstOrder.shippingAddress.city}</strong></div>
      </div>

      {orders.map((order, index) => (
        <section className="receipt-order" key={order.id}>
          <div className="receipt-order-heading">
            <div><span>Seller order {String(index + 1).padStart(2, "0")}</span><strong>{order.sellerName}</strong></div>
            <span className="tag tag-amber">Pending</span>
          </div>
          {order.items.map((item) => (
            <div className="receipt-line" key={item.productId}>
              <span>{item.name} <small>× {item.quantity}</small></span>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="receipt-seller-total"><span>Seller subtotal</span><strong>{money(order.total)}</strong></div>
          <p className="receipt-order-id">Order reference: {order.id}</p>
        </section>
      ))}

      <div className="receipt-total"><span>Items total · shipping extra</span><strong>{money(grandTotal)}</strong></div>
      <p className="receipt-email-note">A confirmation for {firstOrder.buyer.email} is shown here. Keep this page for your order references.</p>
      <Link to="/" className="btn btn-primary receipt-home">Continue exploring</Link>
      <div className="receipt-bottomline">Thank you for supporting independent sellers.</div>
    </article>
  );
}
