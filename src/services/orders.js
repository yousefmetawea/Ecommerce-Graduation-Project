import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Creates one order per seller and decrements every ordered product's stock
 * in the same Firestore transaction. The cart is only a client-side hint:
 * price, seller, and availability are re-read from Firestore before writing.
 */
export async function placeOrders({ cartItems, buyer, shippingAddress, userId = null }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const quantities = new Map();
  const cartPrices = new Map();
  cartItems.forEach((item) => {
    const quantity = Math.floor(Number(item.quantity));
    if (!item.id || quantity < 1) throw new Error("Your cart contains an invalid item.");
    const cartPrice = Number(item.price);
    if (!Number.isFinite(cartPrice) || cartPrice < 0) throw new Error("Your cart contains an invalid price.");
    if (cartPrices.has(item.id) && cartPrices.get(item.id) !== cartPrice) {
      throw new Error("Your cart contains conflicting prices for the same item.");
    }
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + quantity);
    cartPrices.set(item.id, cartPrice);
  });
  const lines = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
  const productRefs = lines.map(({ productId }) => doc(db, "products", productId));

  // Allocate IDs outside the transaction callback so retries reuse the same IDs.
  const orderIds = new Map();

  return runTransaction(db, async (transaction) => {
    const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
    const groups = new Map();

    productSnapshots.forEach((snapshot, index) => {
      const { productId, quantity } = lines[index];
      if (!snapshot.exists()) throw new Error("A product in your cart is no longer available.");
      const product = snapshot.data();
      const stock = Number(product.stock);
      if (!Number.isFinite(stock) || stock < quantity) {
        throw new Error(`Only ${Math.max(0, Number.isFinite(stock) ? stock : 0)} unit(s) of ${product.name ?? "this item"} remain in stock.`);
      }
      if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
        throw new Error(`${product.name ?? "A product"} has an invalid price and cannot be ordered.`);
      }
      if (Number(product.price) !== cartPrices.get(productId)) {
        throw new Error(`The price of ${product.name ?? "an item in your cart"} changed. Remove it and add it again to review the current price.`);
      }
      if (!product.sellerId) throw new Error(`${product.name ?? "A product"} has no seller assigned and cannot be ordered.`);

      const item = {
        productId,
        name: product.name ?? "Product",
        price: Number(product.price),
        quantity,
        image: product.images?.[0] ?? "",
      };
      const sellerId = product.sellerId;
      if (!groups.has(sellerId)) {
        groups.set(sellerId, {
          sellerId,
          sellerName: product.sellerName ?? "Independent seller",
          items: [],
          subtotal: 0,
        });
      }
      const group = groups.get(sellerId);
      group.items.push(item);
      group.subtotal += item.price * quantity;
    });

    const orders = [...groups.values()].map((group) => {
      if (!orderIds.has(group.sellerId)) {
        orderIds.set(group.sellerId, doc(collection(db, "orders")).id);
      }
      return {
        id: orderIds.get(group.sellerId),
        ...group,
        total: group.subtotal,
        currency: "USD",
        userId,
        buyer: {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim(),
        },
        shippingAddress: {
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          postalCode: shippingAddress.postalCode.trim(),
          country: shippingAddress.country.trim(),
        },
        paymentMethod: "cash_on_delivery",
        status: "pending",
      };
    });

    // All reads occur before any writes, as required by Firestore transactions.
    productSnapshots.forEach((snapshot, index) => {
      const currentStock = Number(snapshot.data().stock);
      transaction.update(productRefs[index], { stock: currentStock - lines[index].quantity });
    });

    orders.forEach((order) => {
      const { id, ...data } = order;
      transaction.set(doc(db, "orders", id), { ...data, createdAt: serverTimestamp() });
    });

    return orders;
  });
}
