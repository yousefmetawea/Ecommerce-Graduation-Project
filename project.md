# Souk E-Commerce — Viva Study Guide (project.md)

> Source of truth: actual codebase + `project-analysis.md` + `firestore.rules`.
> Rule: everything below refers to real files/symbols. Anything not implemented is marked **[NOT IMPLEMENTED]**.
> No secrets in this file — only env var *names*.

---

## 1. Project Overview

**Souk** is a multi-vendor marketplace SPA (single-page application):
- Multiple independent sellers list products; customers browse/buy; admin moderates platform.
- 3 roles: `customer` | `seller` | `admin` stored in `users/{uid}.role`.
- Frontend-only: React + Vite + React Router. Backend-as-a-Service: Firebase Auth + Firestore + Storage. No custom Node/Express server.
- Business logic lives in `src/services/*.js`, UI in `src/pages/*`, `src/components/*`, state in `src/context/*`.
- Key correctness mechanism: Firestore `runTransaction` for checkout (stock decrement) and reviews (rating aggregates).
- Real security = `firestore.rules`. `src/routes/ProtectedRoute.jsx` is UI-only.

Viva one-liner: "React SPA + Firebase BaaS, Context state, service layer, transactional multi-seller checkout, Firestore rules as enforcement."

## 2. Tech Stack + Why

| Tech | Version | Why used |
|---|---|---|
| React + React DOM | ^19.2.8 | Component model, hooks (`useState/useEffect/useMemo/useCallback`), ecosystem |
| Vite | ^8.3.0 | Fast dev HMR, ESM build to `dist/` |
| React Router DOM | ^7.18.4 | Declarative routing + `ProtectedRoute` wrapper |
| Firebase | ^12.19.0 | Auth + Firestore + Storage in one SDK, no backend to host |
| Framer Motion | ^13.4.6 | ChatWidget animations |
| Lucide React | ^1.49.0 | Icons |
| React Hot Toast | ^2.6.1 | `Toaster` in `src/App.jsx:34-59`, feedback on cart/errors |
| React Loading Skeleton | ^3.5.0 | Loading placeholders |
| Oxlint | ^1.81.0 | Lint (`oxlintrc.json`) |
| dotenv | ^18.0.4 | `scripts/seed.mjs` reads `SEED_ADMIN_EMAIL/PASSWORD` |

Why not alternatives: no Next.js (no SSR need, Firebase hosting suffices); no Redux (3 contexts enough, less boilerplate — see §10); no custom backend (Firebase transactions + rules cover MVP; tradeoff = limited secret handling — see §18).

Env names only: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_HF_API_TOKEN`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

## 3. Architecture & Folder Structure

```
ecommerce-app/
  firestore.rules, index.html, vite.config.js, package.json
  scripts/seed.mjs
  functions/               # empty scaffold [NOT IMPLEMENTED - no Cloud Functions]
  src/
    App.jsx / main.jsx / index.css
    firebase/config.js     # auth, db, storage, googleProvider
    routes/ProtectedRoute.jsx
    layouts/MainLayout.jsx # Navbar + <Outlet/> + Footer + ChatWidget
    context/AuthContext.jsx, CartContext.jsx, WishlistContext.jsx
    hooks/useProducts.js
    components/ ProductCard, ProductFilters, Pagination, ProductReviews, ChatWidget
    pages/auth/ Login, Register
    pages/customer/ Home, ProductDetails, Cart, Checkout, CheckoutSuccess, OrderConfirmation, Account, OrderHistory, Wishlist, Profile
    pages/seller/ SellerDashboard + components/ (ProductFormModal, DeleteConfirmModal, SellerOrderDetailsModal)
    pages/admin/ AdminDashboard + components/ (UserEditModal, CategoryModal, AdminProductModal, AdminOrderModal, AdminConfirmModal, PromoCodeModal)
    services/ admin, categories, chatbot, customerOrders, orders, products, promoCodes, reviews, seller, stripe, userProfile, wishlist
```

Startup flow (`src/main.jsx` → `src/App.jsx`):
1. `main.jsx` mounts `<StrictMode><App/></>` at `#root`.
2. `App.jsx:30-33` nests `BrowserRouter > AuthProvider > CartProvider > WishlistProvider`.
3. `AuthContext` subscribes `onAuthStateChanged`, fetches `users/{uid}` for `role`; blocks children until `!loading`.
4. `CartContext` hydrates from `localStorage` keys `souk-cart-v1`, `souk-promo-v1`.
5. `WishlistContext` loads `users/{uid}/wishlist` subcollection when logged in.
6. Routes render inside `MainLayout`.

## 4. Routes (real table from `src/App.jsx:60-129`)

Public (inside `MainLayout`): `/` (Home), `/product/:id` (ProductDetails), `/cart`, `/checkout` (guest allowed), `/checkout/success`, `/order-confirmation`, `/login`, `/register`, `/unauthorized`.
Protected via `src/routes/ProtectedRoute.jsx`: `/account`, `/orders`, `/wishlist`, `/profile` allow `["customer","seller","admin"]`; `/seller` allows `["seller"]` only; `/admin` allows `["admin"]` only; `*` → NotFound.
Behavior: unauthenticated → `/login`; wrong role → `/unauthorized`. **UI-only** — direct Firestore calls still gated by `firestore.rules`.

## 5. Authentication (Firebase Auth)

Config: `src/firebase/config.js` exports `auth, db, storage, googleProvider`.
API via `useAuth()` in `src/context/AuthContext.jsx`: `currentUser, role, loading, register(), login(), loginWithGoogle(), logout()`.
- `register`: `createUserWithEmailAndPassword` + create `users/{uid}` doc `{name,email,role:"customer",status:"active",createdAt}`.
- `login`: `signInWithEmailAndPassword`; Firebase error codes mapped to friendly messages.
- `loginWithGoogle`: `signInWithPopup(googleProvider)`; first-time user auto-creates `users/{uid}` as customer/active.
- `logout`: `signOut(auth)`.
- Session: `onAuthStateChanged` listener; role re-fetched each change.

## 6. Roles & Authorization

Role source: `users/{uid}.role`. Loaded in AuthContext.
| Role | Capabilities | Routes |
|---|---|---|
| customer | browse, cart/wishlist, guest checkout, own orders, reviews | public + `/account /orders /wishlist /profile` |
| seller | customer + own products/inventory/orders, store profile (`/seller`) | + `/seller` |
| admin | all: users/products/categories/orders/promos (`/admin`) | + `/admin` |

Promotion: customer self-upgrades via `upgradeToSeller()` in `src/services/seller.js` (sets `role:"seller"` + store fields) — allowed because `firestore.rules:39` permits owner update. Admin promotion is manual Firestore edit per `README.md`. Demotion/suspend via `updateUserRole` / `updateUserStatus` in `src/services/admin.js`. No self-edit guard in Admin UI (can edit own role — risk, see §18).

## 7. Firebase / Firestore Overview

- Auth → identity. Firestore → NoSQL collections below. Storage → product images.
- `functions/src`, `functions/test` empty scaffolds — **[NO Cloud Functions / triggers / scheduled jobs]**.
- No `firestore.indexes.json`, no `storage.rules`, no `firebase.json` in repo.
- No `onSnapshot` realtime listeners found — reads are one-shot `getDocs/getDoc`; cart promo is `localStorage`-only.
- No test deps (`jest/vitest`) found.

## 8. Collections & Data Shapes

**`users/{uid}`**: `name,email,role,status(active/suspended/inactive),phone,address,createdAt` + seller fields `storeName,storeBio,businessEmail,city,postalCode,country,updatedAt` + `statusUpdatedAt`. Subcollection `users/{uid}/wishlist/{productId}` (one doc per product).
**`products/{id}`**: `name,description,price,stock,categoryId,categoryName,images[],rating,ratingCount,sellerId,sellerName,createdAt,updatedAt`.
**`categories/{slug}`**: doc ID = slugified name (`slugify` in `src/services/admin.js:18-24`); fields `name,description,image,createdAt`.
**`orders/{id}` — one doc per seller per checkout**: `userId(string|null for guest),sellerId,sellerName,items[{productId,name,price,quantity,image}],buyer{name,email,phone},shippingAddress{address,city,postalCode,country},paymentMethod(cash_on_delivery|stripe|cod),paymentStatus,status(pending/processing/shipped/delivered/cancelled),subtotal,discount,total,currency,promoCode?,createdAt,statusUpdatedAt`.
**`reviews/{id}`**: `userId,userName,productId,rating(1-5),comment,createdAt`.
**`promoCodes/{CODE}`**: doc ID = uppercased code; `code,type(percentage|fixed),value,description,minOrderAmount,maxDiscount,expiryDate(Date|null),usageLimit(int|null),timesUsed,isActive,createdAt,updatedAt,lastUsedAt`.
**Legacy/other**: `carts/{uid}`, `wishlists/{uid}` rules exist but active code uses `localStorage` cart + `users/{uid}/wishlist` subcollection (see `src/services/wishlist.js`).

## 9. Security Rules (`firestore.rules` — real enforcement)

Helpers: `isSignedIn(), myRole(), isOwner(uid), isAdmin(), isSeller()`.
- `users/{uid}`: read all; create if owner; update if owner or admin; delete if admin. `wishlist/{productId}`: owner-only read/write.
- `products/{id}`: read all; create if seller and `sellerId==uid`; update if admin OR owning seller OR stock-only diff OR signed-in + rating-only diff; delete if admin or owning seller.
- `categories`: read all; write admin-only.
- `carts/{uid}`, `wishlists/{uid}`: owner-only.
- `orders/{id}`: read if admin or buyer (`userId==uid`) or involved seller; create requires full schema keys, `items.size()>0`, buyer/shipping sub-keys, `status=="pending"`, payment in list, `total>=0`, `(signed-in + userId==uid) OR (guest + userId==null)`; update only admin or involved seller (so customers cannot self-mark delivered — must ask seller/admin).
- `reviews`: read all; create if `userId==uid`; update/delete if admin or author.
- `promoCodes`: read all (checkout can validate); create/delete admin; update admin OR `timesUsed/lastUsedAt`-only diff (lets checkout increment usage).

## 10. State Management (no Redux)

No Redux. Three contexts:
- `AuthContext` (`src/context/AuthContext.jsx`): `currentUser,role,loading` + auth fns. Children gated on `!loading`.
- `CartContext` (`src/context/CartContext.jsx`): `items,promoCode,addItem,updateQty,removeItem,clearCart,applyPromo`, derived `subtotal,discount,total,itemCount` (discount via `calculatePromoDiscount` in `src/services/promoCodes.js`). Persisted to `souk-cart-v1` / `souk-promo-v1`. Stock-aware capping.
- `WishlistContext` (`src/context/WishlistContext.jsx`): ID set for logged-in user, optimistic toggle with rollback on failure, syncs `users/{uid}/wishlist`.
- `useProducts()` (`src/hooks/useProducts.js`): loads products + categories once, exposes search/category/maxPrice filter + pagination (12/page) + setters. Uses `useMemo/useCallback`, cancelled flag.

## 11. Components / Services / Hooks / Functions

Components: `ProductCard.jsx` (card + add/wishlist), `ProductFilters.jsx` (search/category/price), `Pagination.jsx`, `ProductReviews.jsx` (list + submit/delete), `ChatWidget.jsx` (Framer Motion + `chatbot.js`), `MainLayout.jsx` (Navbar/Footer/Outlet), `ProtectedRoute.jsx`.
Seller modals: `ProductFormModal` (name/price/stock/category/images validation), `DeleteConfirmModal`, `SellerOrderDetailsModal`. Admin modals: `UserEditModal` (role/status only), `CategoryModal` (slug logic), `AdminProductModal` (name/price/stock/category/images), `PromoCodeModal` (all promo fields), `AdminOrderModal` (status select), `AdminConfirmModal` (generic danger confirm).
Services: `products.js` (`fetchProducts,fetchProductById`), `seller.js` (`upgradeToSeller,uploadProductImage,createProduct,updateProduct,deleteProduct,updateOrderStatus,fetchSellerOrders/Products`), `admin.js` (`updateUserRole,updateUserStatus,createCategory,updateCategory,deleteCategory,adminUpdateProduct,adminDeleteProduct,adminUpdateOrderStatus,adminDeleteOrder,slugify`), `orders.js` (`placeOrders` transaction, `fetchOrders*`), `customerOrders.js` (buyer history), `reviews.js` (`submitReview,deleteReview` transactional aggregates), `promoCodes.js` (`validatePromoCode,calculatePromoDiscount,incrementPromoUsage,createPromoCode,normalizePromoCode`), `chatbot.js` (`matchLocalIntent,askAI`, model `Qwen/Qwen2.5-72B-Instruct:novita`), `stripe.js` (`processStripeTestPayment`, `4242…` test check — simulated), `userProfile.js`, `categories.js`, `wishlist.js`, `firebase/config.js`.
Seed: `scripts/seed.mjs` (`npm run seed`) — signs in as `SEED_ADMIN_*`, pulls 100 products from DummyJSON, creates categories (slug IDs), writes products with `sellerId=<admin UID>`.

## 12. Customer Features (files)

Browse `Home.jsx` (filters + 12/page), `ProductDetails.jsx` (gallery, rating, qty, add/wishlist), `ProductReviews.jsx` (one review per user per product; delete own). Cart `Cart.jsx` (guest works, qty caps). Wishlist `Wishlist.jsx` (auth required, subcollection). Checkout `Checkout.jsx` (shipping form + promo + COD/Stripe-test). Receipt `OrderConfirmation.jsx`, history `OrderHistory.jsx`, `Account.jsx`/`Profile.jsx` (edit name/phone/address). `ChatWidget.jsx` help.

## 13. Seller Features (`src/pages/seller/SellerDashboard.jsx`)

Tabs via `activeTab`: `overview|products|inventory|orders|profile`.
- Overview: revenue/orders/products/low-stock counts, recent orders.
- Products: CRUD via `seller.js`; image upload `uploadProductImage` → `products/{sellerId}/{Date.now()}_{cleanName}` with `uploadBytesResumable` progress; URL pushed to `images[]`. Validation: name required, price finite ≥0, stock int ≥0.
- Inventory: inline stock edit, badges; low-stock rule `stock>0 && stock<=5`, out = 0.
- Orders: list own `sellerId` orders; status workflow `pending→processing→shipped→delivered` (+`cancelled`); `updateOrderStatus` in `seller.js`; details in `SellerOrderDetailsModal`.
- Profile: store fields; syncs Auth `displayName`; `upgradeToSeller` entry point for customers.
- UX: `successMsg` toast 4s, `error role=alert`, `AdminConfirmModal`-style confirms, empty states ("No … matched"), loading placeholder (no skeleton lib here despite dep).

## 14. Admin Features (`src/pages/admin/AdminDashboard.jsx`)

Tabs: `overview|users|products|categories|promos|orders` (6).
- Users: search + role/status filter; `UserEditModal` edits only `role(customer/seller/admin)` + `status(active/suspended/inactive)`; save does `Promise.all` of changed fields; suspend preserves history (note text). Soft-delete = status change. No self-edit block.
- Products: all sellers; `AdminProductModal` edits `name,description,price,stock,categoryName,images[]`; View links `/product/{id}`.
- Categories: `CategoryModal`; slug = doc ID, auto from name via `slugify`, disabled on edit; `createCategory` throws `Category with identifier "x" already exists.` on duplicate; update only name/desc/image.
- Promos: `PromoCodeModal`; code = doc ID (uppercased, disabled on edit, min len 3); `type percentage|fixed` (default percentage), `value>0` (≤100 if %), `minOrderAmount≥0`, `maxDiscount` (%, null ok), `expiryDate→23:59:59` or null, `usageLimit int` or null, `isActive` default true, `timesUsed` 0. Service `createPromoCode` re-validates + existence check.
- Orders: status dropdown + `AdminOrderModal` (same 5 statuses, validated in `adminUpdateOrderStatus`); delete via `adminDeleteOrder` ("Delete corrupted / test order").
- Feedback: global `error` + `flashSuccess` (4s `✓`), per-modal errors, `AdminConfirmModal {isOpen,title,message,confirmButtonText,isDanger,onConfirm}`.

## 15. Cart / Checkout / Payment

Cart (`CartContext`): array of `{productId,name,price,image,sellerId,qty,stock}` in `souk-cart-v1`; `addItem` caps by stock; promo in `souk-promo-v1` (localStorage only — not a Firestore doc).
Checkout (`src/pages/customer/Checkout.jsx`): shipping inputs, promo input → `validatePromoCode` (checks `isActive, expiry, minOrderAmount, usageLimit vs timesUsed`), method radio COD vs Stripe-test, submit → `placeOrders` (`src/services/orders.js`).
`placeOrders` transaction: group cart by `sellerId`; for each group: re-read product docs, verify existence/price/stock; compute proportional discount (last group gets remainder to avoid rounding loss); decrement `stock`; `incrementPromoUsage`-compatible update (`timesUsed/lastUsedAt` — allowed by rules); write one order doc per seller with `status:"pending"`. All in single `runTransaction` — all-or-nothing. Then clear cart, navigate to `/order-confirmation` (receipt aggregates groups) or `/checkout/success` (legacy Stripe path).
Payment: COD = real flow; Stripe = **simulated** (`src/services/stripe.js: processStripeTestPayment`, accepts `4242…` test card) — **[NO real charge, NO backend PaymentIntent]**. `CheckoutSuccess.jsx / verifyStripePayment` is legacy.

## 16. Order & Inventory Systems

Order lifecycle: `pending → processing → shipped → delivered`, or `cancelled` anytime. Only seller-involved or admin can update (rules + `seller.js:updateOrderStatus` + `admin.js:adminUpdateOrderStatus`); buyer read-only tracking in `OrderHistory.jsx`.
Inventory: `stock` decremented only inside checkout transaction; `updateProductStock` for manual edits; rules allow buyer stock-only decrement + signed-in rating-only update. Low-stock UI `≤5`, out `0`. Catalog fetch is full `getDocs` + client filter — fine for ~100 seed items, not for 10k (see §18).

## 17. Search / Filtering

- Home (`useProducts.js` + `ProductFilters.jsx`): name `includes` case-insensitive + `categoryId` exact + `price<=maxPrice`; resets to page 1; `Pagination.jsx` 12/page. All client-side after one fetch.
- Seller/Admin dashboards: same pattern — fetch own/all docs then client search + status/stock/role filters.
- Chatbot (`src/services/chatbot.js`): layer 1 `matchLocalIntent` (regex/keywords, bilingual EN/AR, price/category queries over loaded products); layer 2 `askAI` → HuggingFace `Qwen/Qwen2.5-72B-Instruct:novita` with product context; fallback messages on failure. Token is `VITE_HF_API_TOKEN` (client-exposed — proxy in prod).

## 18. Error / Validation / Security / Performance

Validation: required attrs + email types; product `price finite ≥0, stock int ≥0`; review `rating 1-5, comment 1-1000`; promo rules above; order schema enforced twice (client transaction + `firestore.rules` keys/types). Firebase codes mapped to friendly text.
Errors: try/catch + `console.warn` + fallback (missing index → client sort; chatbot → local/fallback); `toast.error/success`; inline `form-error`; optimistic wishlist rollback; route redirects.
Security strengths: RBAC + ownership + schema + field-diff rules; price/stock re-validated in transaction (cart prices untrusted); no secrets in repo (publishable key only). Gaps: no `storage.rules` file; `VITE_HF_API_TOKEN` exposed; Stripe simulated; `upgradeToSeller` self-promote by design (owner-update allows `role` change — tighten if abused); admin can edit self with no guard; no rate limiting; no tests.
Performance: `Promise.all` parallel loads, `useMemo/useCallback`, skeletons; costs: full-collection reads + client filter/paginate; no `React.lazy`, no image optimization/lazy, no query cursors.

## 19. Weaknesses & Improvements (honest viva answers)

1. Missing `storage.rules` → add least-privilege (seller-only write to own prefix, size/type checks).
2. No `firestore.indexes.json` → export composite indexes (orders by seller+createdAt etc.).
3. Client-side filtering/pagination → move to `where/orderBy/limit + startAfter` cursors when catalog grows.
4. No realtime (`onSnapshot`) → add for seller orders / order tracking.
5. AI token client-side → proxy via Cloud Function / backend.
6. Stripe test-only → real PaymentIntents + webhooks via backend.
7. Owner-update rule permits self `role` change → restrict `role/status` to admin-only write (Cloud Function for upgrade approvals).
8. No tests / empty `functions/` → add Vitest + minimal triggers (e.g., `timesUsed` via function instead of client diff rule).
9. A11y/i18n gaps, image compression + `loading="lazy"`, Zod validation, structured logging.

## 20. Full Role Scenarios (click-by-click)

**Customer/guest**: `/` browse/filter → `/product/:id` read reviews → add cart (guest OK, localStorage) → `/cart` qty → `/checkout` address + promo + COD → `placeOrders` splits per seller → `/order-confirmation` receipt → `/orders` track → review once → `/wishlist` (login needed) → `/profile` edit.
**Seller**: register/login → upgrade to seller → `/seller` → profile (storeName…) → products Add (upload image w/ progress) → inventory adjust (low ≤5) → orders: open details → `pending→processing→shipped→delivered` → overview revenue.
**Admin**: Firestore sets `role:"admin"` → `/admin` → overview → users search/filter → edit role/status (suspend preserves history) → products View/Edit/Delete any → categories add (slug auto, duplicate error) → promos create (`SAVE20`, %/fixed, limits) → orders update/cancel/delete test orders.

## 21. Viva Cheat Sheet (30 seconds each)

- Arch: SPA + BaaS, Context, services, transactions, rules = enforcement.
- Routes: `App.jsx:60-129`, `ProtectedRoute` UI-only.
- Auth: `AuthContext` + `config.js`; role in `users/{uid}`.
- Data: per-seller order split; wishlist subcollection; promo ID = CODE; category ID = slug.
- Checkout: group-by-seller transaction, re-validate, decrement, proportional discount, multi-write atomic.
- Reviews: transaction aggregates `rating/ratingCount`.
- Rules: stock-only + rating-only diffs, promo `timesUsed`-only diff, guest-create iff `userId==null`.
- Cart: localStorage, untrusted prices re-checked.
- Stripe: simulated. Functions: empty. Realtime: none. Tests: none.

---

## 22. Likely Viva Q&A (45 — project-specific, with why/how/what-if)

1. **Why Firebase instead of Express+Mongo?** No server to host/auth-scale for MVP; Auth+Firestore+Storage in one SDK; transactions cover checkout atomicity. Tradeoff: secrets (Stripe/HF) can't stay secret → need backend for prod payments/AI proxy.
2. **How does multi-seller checkout work?** `src/services/orders.js:placeOrders` groups cart by `sellerId`, `runTransaction` re-reads each product, validates price/stock, decrements stock, splits discount proportionally, writes one `orders` doc per seller atomically.
3. **What if two buyers buy last item concurrently?** Both transactions re-read stock; second fails on insufficient stock (transaction retry/abort) → user gets error, no oversell. That's why decrement is inside transaction, not two separate writes.
4. **Why split orders per seller instead of one order?** Ownership + fulfillment: `firestore.rules:83-85` reads by `sellerId`; seller dashboard queries own docs; each seller updates own status independently.
5. **Why is cart in localStorage, not Firestore?** Guest checkout required; `souk-cart-v1`/`souk-promo-v1` work logged-out. Cost: prices untrusted → re-validated in `placeOrders`. Alternative (Firestore `carts/{uid}`) needs login + rules exist but unused.
6. **What happens if cart price is tampered?** Ignored — transaction uses Firestore `price`, not cart price; mismatch throws. Correct by design.
7. **Why `ProtectedRoute` is not security?** It only hides JSX (`src/routes/ProtectedRoute.jsx`). Direct SDK/REST calls bypass it; `firestore.rules` denies (e.g., non-seller `products` create, customer `orders` update). Demo: logged-in customer `updateDoc(orders/x,{status})` → permission-denied.
8. **Explain `products` update rule disjunction.** `firestore.rules:56-59`: admin OR owning seller OR stock-only diff (checkout buyer) OR signed-in rating-only diff (review). Lets buyers decrement stock / update aggregates without full write.
9. **Why allow public read on products/categories/reviews/promos?** Storefront + checkout validation need unauthenticated reads; writes still gated. Promo readability is intentional.
10. **How are review averages kept correct?** `src/services/reviews.js:submitReview/deleteReview` run transaction: write review + recompute `rating/ratingCount` on product. Rating-only diff rule permits it. One review per user per product enforced by query check.
11. **Why transaction for reviews, not two writes?** Concurrent reviews would clobber average (lost update). Transaction retries on contention.
12. **How do promo codes work end-to-end?** `PromoCodeModal` creates `promoCodes/{CODE}`; `Checkout.jsx` calls `validatePromoCode` (active/expiry/min/limit); `CartContext` computes `calculatePromoDiscount`; `placeOrders` re-validates + `timesUsed/lastUsedAt`-only increment (allowed by `firestore.rules:117-118`).
13. **Percentage vs fixed, caps?** `type` in `promoCodes.js`; `%` checks `value<=100`; `maxDiscount` caps % promos; `minOrderAmount` floor; `usageLimit` vs `timesUsed`; `expiryDate` end-of-day. All validated in modal + service.
14. **What if promo expires mid-checkout?** Re-validation in transaction fails → checkout aborts with message; no discount applied. Correct (no TOCTOU).
15. **COD vs Stripe here?** COD is real pending-order flow. Stripe is `processStripeTestPayment` simulation (`4242…`); **[NO real charge]**. Prod needs backend PaymentIntent + webhook → `paymentStatus`.
16. **Why separate `CheckoutSuccess` and `OrderConfirmation`?** Success = legacy Stripe-test landing; Confirmation = real receipt aggregating per-seller docs. If asked, admit legacy duplication.
17. **Order statuses and who changes them?** `pending→processing→shipped→delivered` + `cancelled`; only involved seller (`seller.js:updateOrderStatus`) or admin (`admin.js:adminUpdateOrderStatus`); buyer read-only. Enforced by `firestore.rules:100-101`.
18. **Why can guests create orders?** `firestore.rules:98-99`: `userId==null` when signed-out + strict schema + `status=="pending"`. Required for guest checkout.
19. **Seller dashboard tabs and data?** `SellerDashboard.jsx:activeTab` — overview (revenue/orders), products (CRUD), inventory (inline stock, low `≤5`), orders (workflow), profile (store fields + displayName sync).
20. **How are product images uploaded?** `seller.js:uploadProductImage` → `products/{sellerId}/{ts}_{clean}` via `uploadBytesResumable`, progress cb, `getDownloadURL` → `images[]`. Filenames sanitized. Missing: `storage.rules` file.
21. **Category slug system?** Doc ID = `slugify(name)` (`admin.js:18-24`); auto on add, manual edit sanitized, disabled on edit; `createCategory` `getDoc` check throws `already exists.` — prevents silent overwrite.
22. **Admin user edit — fields and risks?** `UserEditModal.jsx:11-13,92-106`: only `role` + `status`; `Promise.all` of changed; no self-edit guard — admin can demote/suspend self (admit as bug, fix by `selectedUser.id!==currentUser.uid` check + rule tightening).
23. **Suspend vs delete?** Suspend (`status:"suspended"`) preserves histories (modal note); delete restricted (`users` delete admin-only, rarely used). Prefer status.
24. **Why Context not Redux?** 3 domains (auth/cart/wishlist) with simple update patterns; Context + `useMemo` suffices; Redux adds boilerplate. Would switch at larger scale / frequent cross-updates (RTK + RTK Query).
25. **What does `useProducts` do?** `src/hooks/useProducts.js`: one `getDocs` for products+categories, client filter (name/category/price), page reset, 12/page slice. Simple MVP; scales poorly (see Q33).
26. **Wishlist storage design?** `users/{uid}/wishlist/{productId}` one-doc-per-product → `setDoc/deleteDoc` toggle, owner-only rules (`firestore.rules:45-47`). Optimistic UI with rollback in `WishlistContext`.
27. **Chatbot two layers?** `chatbot.js:matchLocalIntent` (local regex, bilingual, product-context answers, instant/offline) → `askAI` (HF `Qwen2.5-72B`) with product subset; fallbacks on token/network failure. Token exposed → proxy in prod.
28. **Seed script?** `scripts/seed.mjs`: signs in `SEED_ADMIN_*`, fetches DummyJSON 100, creates slug categories, writes products `sellerId=<admin UID>`. Doesn't clear data (duplicates on re-run).
29. **Why no realtime listeners?** Only one-shot reads; simpler + cheaper. Downside: seller must refresh for new orders. Improvement: `onSnapshot` on seller orders + buyer order tracking.
30. **Empty `functions/` — problem?** Yes if claiming backend automation. Currently no triggers; promo increment relies on client diff rule. Prod: move to Function (authoritative `timesUsed`, role upgrades, Stripe webhooks).
31. **Missing `storage.rules` impact?** Repo has no file; deploy defaults may over/under-permit. Fix: seller-owned prefix write, public read, `request.resource.size/contentType` checks.
32. **Missing `firestore.indexes.json`?** Queries with `where+orderBy` need composite indexes; code has client-sort fallbacks (`console.warn` + sort). Export file for deterministic deploys.
33. **Performance bottleneck?** Full-collection `getDocs` + client filter/paginate. O(n) read/transfer. Fix: `where/orderBy/limit/startAfter`, `React.lazy`, image lazy/compress, SWR cache.
34. **How is discount split across sellers without losing cents?** Proportional per group, last group gets remainder (`totalDiscount - sum(others)`). Prevents rounding leak.
35. **Why `timesUsed` diff-rule instead of admin-only?** Lets legitimate checkout increment without making buyer admin. Narrow `hasAny(['timesUsed','lastUsedAt'])` — but client could spoof increment; Function is stricter fix.
36. **Self-upgrade to seller — security hole?** By design `upgradeToSeller` + owner-update rule allows `role:"seller"`. Any customer can become seller. If marketplace wants approval, restrict `role` to admin-only + approval queue Function.
37. **No tests — how to defend?** Admit: manual testing + transactional safety + rules. Next: Vitest for `calculatePromoDiscount/slugify/validatePromoCode` + rules emulator tests + `placeOrders` contention test.
38. **Biggest integrity risks?** Oversell (solved by transaction), price spoof (solved by re-read), rating skew (solved by transaction), promo overuse (partially — client increment race; Function better).
39. **If catalog grows to 50k products?** Current breaks (read all). Migrate Home to server queries + cursors, debounce search, index `categoryId+price+createdAt`, CDN images.
40. **What would you improve with 2 more weeks?** `storage.rules` + `indexes.json`, server pagination, `onSnapshot` seller orders, AI/Stripe via Functions, Zod + tests, self-edit guard + `role`-only-admin rule, lazy images + code-split, a11y pass.
41. **Roles vs statuses?** `role` = capability (customer/seller/admin); `status` = account state (active/suspended/inactive). Orthogonal: suspended seller keeps docs but (should) lose write via rule/app check — currently app-level only, note as gap.
42. **Why per-modal errors + global toast?** Per-modal (`UserEditModal.error` etc.) keeps context; global `flashSuccess/error` confirms cross-tab actions. `AdminConfirmModal` for destructive ops.
43. **How to prove rules work in viva?** Open Console: as customer try `updateDoc(doc(db,"products",otherSellerId),{price:1})` → denied; as guest `getDocs(products)` → allowed; checkout with edited localStorage price → charged Firestore price. Cite `firestore.rules:52-62,86-99`.
44. **Why Firestore over RTDB?** Rich queries (`where/orderBy`), transactions, granular rules with `diff().affectedKeys()`, collection model fits products/orders/reviews.
45. **One-sentence defense?** "Multi-vendor SPA where per-seller atomic checkout + RBAC rules guarantee inventory and authorization correctness without a custom backend — with explicit, fixable MVP tradeoffs (simulated Stripe, client filtering, missing storage rules)."

---

*End of viva guide. Practice: for every claim above, open the cited file:line and read the code aloud.*
