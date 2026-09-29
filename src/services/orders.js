import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { incrementPromoUsage } from "./promoCodes";

/**
 * Creates one order per seller and decrements every ordered product's stock
 * in the same Firestore transaction. The cart is only a client-side hint:
 * price, seller, and availability are re-read from Firestore before writing.
 *
 * If a promo code was applied, the total discount is proportionally distributed
 * among the seller orders.
 */
export async function placeOrders({
  cartItems,
  buyer,
  shippingAddress,
  userId = null,
  promoCode = null,
}) {
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

  // If promo code is used, load the promo doc ref inside or before transaction
  const promoRef = promoCode?.code ? doc(db, "promoCodes", promoCode.code.toUpperCase().trim()) : null;

  // Allocate IDs outside the transaction callback so retries reuse the same IDs.
  const orderIds = new Map();

  const createdOrders = await runTransaction(db, async (transaction) => {
    // Reads
    const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
    let promoSnapshot = null;
    if (promoRef) {
      promoSnapshot = await transaction.get(promoRef);
    }

    const groups = new Map();
    let calculatedGrandSubtotal = 0;

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
      const lineTotal = item.price * quantity;
      group.subtotal += lineTotal;
      calculatedGrandSubtotal += lineTotal;
    });

    // Validate and calculate real promo discount from server data
    let totalDiscount = 0;
    let promoDataToStore = null;

    if (promoSnapshot && promoSnapshot.exists()) {
      const pData = promoSnapshot.data();
      if (pData.isActive !== false) {
        const minOrder = Number(pData.minOrderAmount || 0);
        if (minOrder <= 0 || calculatedGrandSubtotal >= minOrder) {
          const type = pData.type === "fixed" ? "fixed" : "percentage";
          const val = Number(pData.value || 0);
          if (type === "percentage") {
            totalDiscount = (calculatedGrandSubtotal * val) / 100;
            const maxDisc = Number(pData.maxDiscount);
            if (Number.isFinite(maxDisc) && maxDisc > 0 && totalDiscount > maxDisc) {
              totalDiscount = maxDisc;
            }
          } else {
            totalDiscount = Math.min(calculatedGrandSubtotal, val);
          }
          totalDiscount = Math.max(0, Math.round(totalDiscount * 100) / 100);
          promoDataToStore = {
            code: promoCode.code.toUpperCase().trim(),
            type,
            value: val,
            totalDiscount,
          };
        }
      }
    }

    const groupList = [...groups.values()];
    let remainingDiscountToDistribute = totalDiscount;

    const orders = groupList.map((group, index) => {
      if (!orderIds.has(group.sellerId)) {
        orderIds.set(group.sellerId, doc(collection(db, "orders")).id);
      }

      // Distribute discount proportionally across seller orders
      let sellerDiscount = 0;
      if (totalDiscount > 0 && calculatedGrandSubtotal > 0) {
        if (index === groupList.length - 1) {
          // Last seller gets the remaining cents
          sellerDiscount = Math.min(group.subtotal, Math.max(0, remainingDiscountToDistribute));
        } else {
          sellerDiscount = Math.min(
            group.subtotal,
            Math.round(((group.subtotal / calculatedGrandSubtotal) * totalDiscount) * 100) / 100
          );
          remainingDiscountToDistribute -= sellerDiscount;
        }
      }

      const orderTotal = Math.max(0, Math.round((group.subtotal - sellerDiscount) * 100) / 100);

      const orderDoc = {
        id: orderIds.get(group.sellerId),
        ...group,
        subtotal: group.subtotal,
        discount: sellerDiscount,
        total: orderTotal,
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

      if (promoDataToStore && sellerDiscount > 0) {
        orderDoc.promoCode = {
          ...promoDataToStore,
          discountAmount: sellerDiscount,
        };
      }

      return orderDoc;
    });

    // Writes (all reads occurred before any writes)
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

  // Increment promo code usage count asynchronously if promo was used
  if (promoCode?.code) {
    incrementPromoUsage(promoCode.code);
  }

  return createdOrders;
}
