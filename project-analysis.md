# Project Analysis: Souk E-Commerce App

**Project Title:** Souk — Multi-vendor marketplace (graduation project)  
**Location:** D:\iti-ecommerce-final\ecommerce-app  
**Git Repository:** Yes (present in .git/)  
**Type:** React + Firebase single-page application (Vite)

---

## Table of Contents

1. [Project Purpose and Architecture](#1-project-purpose-and-architecture)
2. [Technology Stack and Justification](#2-technology-stack-and-justification)
3. [Folder/File Structure](#3-folderfile-structure)
4. [Application Startup Flow](#4-application-startup-flow)
5. [Routes and Protected Routes](#5-routes-and-protected-routes)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [Customer / Seller / Admin Roles](#7-customer--seller--admin-roles)
8. [Firebase Authentication](#8-firebase-authentication)
9. [Firestore Collections and Data Structure](#9-firestore-collections-and-data-structure)
10. [Firebase Storage](#10-firebase-storage)
11. [Firestore and Storage Security Rules](#11-firestore-and-storage-security-rules)
12. [Redux/State Management](#12-reduxstate-management)
13. [Important Components and Services](#13-important-components-and-services)
14. [Customer Features](#14-customer-features)
15. [Seller Features](#15-seller-features)
16. [Admin Features](#16-admin-features)
17. [Cart and Checkout Flow](#17-cart-and-checkout-flow)
18. [Order System](#18-order-system)
19. [Product and Inventory System](#19-product-and-inventory-system)
20. [Search/Filtering](#20-searchfiltering)
21. [Forms and Validation](#21-forms-and-validation)
22. [Error Handling](#22-error-handling)
23. [Important Functions and Hooks](#23-important-functions-and-hooks)
24. [Environment Variables (names only, NEVER secrets)](#24-environment-variables-names-only-never-secrets)
25. [Seed Scripts](#25-seed-scripts)
26. [Git/Configuration](#26-gitconfiguration)
27. [Performance Considerations](#27-performance-considerations)
28. [Security Considerations](#28-security-considerations)
29. [Current Weaknesses and Possible Improvements](#29-current-weaknesses-and-possible-improvements)
30. [Complete Customer, Seller, and Admin User Flows](#30-complete-customer-seller-and-admin-user-flows)
31. [Summary: Most Important Things for Viva](#31-summary-most-important-things-for-viva)

---

## 1. Project Purpose and Architecture

### Purpose
Souk is a multi-vendor e-commerce marketplace where multiple independent sellers can list and sell products. It supports three user roles (Customer, Seller, Admin) with role-based access control, allows guest checkout, and includes features like cart, wishlist, reviews, order management, promo codes, and a chatbot for product discovery.

### Architecture
- **Frontend-only SPA**: Built with React and Vite; Firebase (Auth, Firestore, Storage) serves as the backend-as-a-service (BaaS). No custom backend server.
- **Client-side routing**: React Router v7 for navigation with protected routes.
- **Context-based state management**: Auth, Cart, and Wishlist managed via React Context API (no Redux library used).
- **BaaS Architecture**: Firebase Authentication, Firestore (NoSQL database), Firebase Storage. Business logic in service layer (`src/services/`).
- **Transactional operations**: Uses Firestore `runTransaction` for atomic operations (order placement with stock decrement, review submission with rating aggregation).
- **Real-time enforcement**: Security enforced via Firestore Security Rules (client-side route guards are UI-only).

---

## 2. Technology Stack and Justification

| Technology | Version | Purpose | Why Used |
|---|---|---|---|
| React | ^19.2.8 | UI library | Modern component-based architecture, hooks, good ecosystem |
| React DOM | ^19.2.8 | Rendering | Standard for React web apps |
| Vite | ^8.3.0 | Build tool/dev server | Fast HMR, modern ESM-based tooling |
| React Router DOM | ^7.18.4 | Client-side routing | Declarative routing with protected route support |
| Firebase | ^12.19.0 | BaaS | Provides Auth, Firestore, Storage in one SDK - no custom backend needed |
| Framer Motion | ^13.4.6 | Animations | Smooth UI transitions for chat widget |
| Lucide React | ^1.49.0 | Icons | Modern, consistent icon set |
| React Hot Toast | ^2.6.1 | Notifications | User feedback for actions (add to cart, errors etc.) |
| React Loading Skeleton | ^3.5.0 | Loading states | Better UX during data fetching |
| Dotenv | ^18.0.4 | Env vars (dev scripts) | Used in seed script for admin credentials |
| Oxlint | ^1.81.0 | Linter | Fast linting tool |
| @vitejs/plugin-react | ^6.1.1 | Vite React plugin | Enables React/JSX in Vite |

**Environment Variables** (names only, never secrets):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_HF_API_TOKEN (for Hugging Face chatbot)

---

## 3. Folder/File Structure

### Root Level
```
ecommerce-app/
├── .env.example
├── .git/
├── .gitignore
├── .oxlintrc.json
├── firestore.rules
├── index.html
├── package.json / package-lock.json
├── README.md
├── vite.config.js
├── dist/
├── functions/
├── node_modules/
├── public/
├── scripts/
│   └── seed.mjs
└── src/
```

### src/ Structure
```
src/
├── App.jsx
├── main.jsx
├── index.css
├── assets/
├── components/
│   ├── ChatWidget.jsx
│   ├── Pagination.jsx
│   ├── ProductCard.jsx
│   ├── ProductFilters.jsx
│   ├── ProductReviews.jsx
│   └── ProtectedRoute.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── CartContext.jsx
│   └── WishlistContext.jsx
├── firebase/
│   └── config.js
├── hooks/
│   └── useProducts.js
├── layouts/
│   └── MainLayout.jsx
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── customer/
│   │   ├── Account.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── CheckoutSuccess.jsx
│   │   ├── Home.jsx
│   │   ├── OrderConfirmation.jsx
│   │   ├── OrderHistory.jsx
│   │   ├── ProductDetails.jsx
│   │   ├── Profile.jsx
│   │   └── Wishlist.jsx
│   ├── seller/
│   │   ├── SellerDashboard.jsx
│   │   └── components/
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   └── components/
│   ├── Unauthorized.jsx
│   └── NotFound.jsx
├── routes/
│   └── ProtectedRoute.jsx
└── services/
    ├── admin.js
    ├── categories.js
    ├── chatbot.js
    ├── customerOrders.js
    ├── orders.js
    ├── products.js
    ├── promoCodes.js
    ├── reviews.js
    ├── seller.js
    ├── stripe.js
    ├── userProfile.js
    └── wishlist.js
```

---

## 4. Application Startup Flow

1. **Entry point** (`src/main.jsx`): Creates React root, renders `<StrictMode><App /></StrictMode>` at `#root`.
2. **App root** (`src/App.jsx`): Wraps app in BrowserRouter, AuthProvider, CartProvider, WishlistProvider, and includes Toaster.
3. **Auth initialization** (`AuthProvider`): Subscribes to `onAuthStateChanged`, loads user profile from Firestore, sets role and loading state.
4. **Cart initialization** (`CartProvider`): Loads cart from localStorage (`souk-cart-v1`) and promo from (`souk-promo-v1`).
5. **Wishlist initialization** (`WishlistProvider`): Fetches wishlist subcollection for logged-in user.
6. **Routing/layout**: Routes wrapped in MainLayout (Navbar, Footer, Outlet, ChatWidget).
7. **Bootstrap**: Vite serves from index.html, builds to dist/.

---

## 5. Routes and Protected Routes

### Public Routes
- `/` → Home
- `/product/:id` → ProductDetails
- `/cart` → Cart
- `/checkout` → Checkout (guest allowed)
- `/checkout/success` → CheckoutSuccess
- `/order-confirmation` → OrderConfirmation
- `/login` → Login
- `/register` → Register
- `/unauthorized` → Unauthorized

### Protected Routes
**Shared (any authenticated role):** `/account`, `/orders`, `/wishlist`, `/profile`  
**Seller-only:** `/seller`  
**Admin-only:** `/admin`  
**Catch-all:** `*` → NotFound

*Note:* ProtectedRoute is UI-only; real protection is in Firestore Security Rules.

---

## 6. Authentication and Authorization

### Authentication
- Email/Password via `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`
- Google Sign-in via `signInWithPopup` with GoogleAuthProvider
- Session via Firebase Auth listener (`onAuthStateChanged`)
- Logout via `signOut(auth)`

### Authorization
- Roles stored in Firestore `users/{uid}.role`: `"customer"`, `"seller"`, `"admin"`
- Role loaded on auth state change
- Route gating via ProtectedRoute checking allowedRoles
- First-time Google user gets auto-created profile with role "customer", status "active"

---

## 7. Customer / Seller / Admin Roles

| Role | Key Capabilities | Routes |
|---|---|---|
| **Customer** | Browse, cart/wishlist, checkout (guest), orders, reviews, profile | Public + shared protected routes |
| **Seller** | Customer + manage own products/inventory/orders, store profile | `/seller` + customer routes |
| **Admin** | Full platform control: users, products, categories, orders, promo codes | `/admin` + all routes |

---

## 8. Firebase Authentication

**Config:** `src/firebase/config.js` exports `auth`, `db`, `storage`, `googleProvider`.  
**AuthContext API (`useAuth()`):** `currentUser`, `role`, `loading`, `register()`, `login()`, `loginWithGoogle()`, `logout()`.  
Profile stored in Firestore `users/{uid}`; role read from Firestore. Children render only when `!loading`.

---

## 9. Firestore Collections and Data Structure

### `users/{uid}`
- `name`, `email`, `role`, `status` ("active"/"suspended"/"inactive"), `phone`, `address`, `createdAt`
- Seller fields: `storeName`, `storeBio`, `businessEmail`, `city`, `postalCode`, `country`, `updatedAt`
- `statusUpdatedAt`
- Subcollection: `users/{uid}/wishlist/{productId}`

### `products/{productId}`
- `name`, `description`, `price` (number), `stock` (number), `categoryId`, `categoryName`, `images[]`, `rating`, `ratingCount`, `sellerId`, `sellerName`, `createdAt`, `updatedAt`

### `categories/{categoryId}`
- `name` (display name). May include `description`, `imageUrl`, `slug` in admin UI

### `orders/{orderId}` (one per seller per checkout)
- `userId` (string|null), `sellerId`, `sellerName`, `items[]` ({productId,name,price,quantity,image}), `buyer{}`, `shippingAddress{}`, `paymentMethod`, `paymentStatus`, `status` (pending/processing/shipped/delivered/cancelled), `subtotal`, `discount`, `total`, `currency`, `promoCode{}` (optional), `createdAt`, `statusUpdatedAt`

### `reviews/{reviewId}`
- `userId`, `userName`, `productId`, `rating` (1-5), `comment`, `createdAt`

### `promoCodes/{code}`
- `code`, `type` ("percentage"/"fixed"), `value`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `timesUsed`, `expiresAt`, `isActive`, `lastUsedAt`, `createdAt`, `updatedAt`

### Other
- `carts/{uid}`, `wishlists/{uid}` (alternate structures; active wishlist uses users/{uid}/wishlist subcollection)

---

## 10. Firebase Storage

- Exported as `storage` from config
- Seller image uploads via `uploadProductImage()` in `seller.js`
- Path: `products/${sellerId}/${Date.now()}_${cleanFileName}`
- Uses `uploadBytesResumable`, returns download URL
- Filenames sanitized; progress callback supported
- URLs stored in `products.images[]`

*Note:* `storage.rules` not present in repo.

---

## 11. Firestore and Storage Security Rules

**Firestore Rules** (`firestore.rules`):  
Helpers: `isSignedIn()`, `myRole()`, `isOwner(uid)`, `isAdmin()`, `isSeller()`

- `users/{uid}`: read true; create owner; update owner or admin; delete admin. Subcollection `wishlist/{productId}`: owner read/write
- `products/{productId}`: read true; create seller if owns; update admin OR (seller owns) OR (only stock changed) OR (signed in AND only rating/ratingCount changed); delete admin or seller owns
- `categories/{categoryId}`: read true; write admin
- `carts/{uid}`: owner read/write; `wishlists/{uid}`: owner read/write
- `orders/{orderId}`: read admin OR (signed in owner) OR (seller involved); create with strict schema (guest allowed if userId null), status pending; update admin or seller involved
- `reviews/{reviewId}`: read true; create signed in as author; update/delete admin or author
- `promoCodes/{code}`: read true; create/delete admin; update admin OR (only timesUsed/lastUsedAt changed)

**Storage Rules:** Not present in codebase.

---

## 12. Redux/State Management

No Redux. Uses React Context API:
- **AuthContext**: currentUser, role, loading, auth methods
- **CartContext**: items, promoCode, computed (subtotal, discount, total, itemCount), localStorage persistence (`souk-cart-v1`, `souk-promo-v1`)
- **WishlistContext**: wishlist IDs for logged-in user, syncs with Firestore subcollection, optimistic updates with rollback

---

## 13. Important Components and Services

**Components:** ProductCard, ProductFilters, Pagination, ProductReviews, ChatWidget, ProtectedRoute, MainLayout (Navbar/Footer/Outlet/ChatWidget), seller modals (ProductFormModal, DeleteConfirmModal, SellerOrderDetailsModal), admin modals (UserEditModal, CategoryModal, AdminProductModal, AdminOrderModal, AdminConfirmModal, PromoCodeModal)

**Services:** products, seller, admin, orders, customerOrders, reviews, wishlist, promoCodes, chatbot, stripe, categories, userProfile

---

## 14. Customer Features

Storefront (search/category/price filters, pagination), ProductDetails (gallery, ratings, wishlist/cart), persistent cart, wishlist (per-user), checkout (guest + COD/Stripe test + promo), order confirmation/receipt, order history, profile, reviews (one per user per product with aggregated ratings), ChatWidget (local + AI).

---

## 15. Seller Features

Seller dashboard tabs (overview, products, inventory, orders, profile). Store profile management (syncs auth displayName), upgrade to seller, product CRUD, Firebase Storage image upload with progress, inventory with inline edits and badges, order management with status workflow (pending→processing→shipped→delivered/cancelled), store metrics.

---

## 16. Admin Features

Admin dashboard tabs (overview, users, products, categories, promo codes, orders). User management (role/status, soft delete/suspend), product moderation (all sellers), category CRUD (slug auto-generated), global order management, promo code CRUD with limits/expiry/active status.

---

## 17. Cart and Checkout Flow

**Cart:** localStorage-backed, stock-aware, quantity capping, add/update/remove.  
**Checkout:** shipping form, optional promo validation (min order/expiry/limits), payment method (COD/Stripe test).  
**Order placement:** Multi-seller split in single transaction - groups by sellerId, validates prices/stocks server-side, decrements stock, distributes discount proportionally (last group gets remainder), writes order docs. Clears cart, redirects to confirmation.  
**Atomicity:** All writes in one Firestore transaction.

---

## 18. Order System

Statuses: pending → processing → shipped → delivered or cancelled.  
Access: customers see own (userId), sellers see own (sellerId), admins see all.  
Updates: only sellers/admins. Each seller order is separate document; receipt aggregates.  
Fetching: newest-first; fallbacks for missing composite indexes with client sort.

---

## 19. Product and Inventory System

Product: name, desc, price, stock, category, images, rating, ratingCount, sellerId, sellerName, timestamps.  
Inventory: seller/admin CRUD, `updateProductStock()`, stock decremented atomically at checkout (rule allows stock-only updates). Low/out-of-stock indicators.  
Catalog: fetched once (client-side filter/paginate) - MVP approach.

---

## 20. Search/Filtering

**Customer (Home):** name contains (case-insensitive), categoryId match, maxPrice <=, resets to page 1 on change, paginated (12/page).  
**Seller/Admin:** search + role-specific filters (inventory status, order status, stock, role, etc.), all client-side on fetched data.

---

## 21. Forms and Validation

**Client-side:** required fields, email types, price>=0 finite, stock>=0 integer, rating 1-5, comment non-empty (max 1000).  
**Server-side/transactional:** placeOrders re-validates price/stock/existence; reviews validates rating; Firestore rules enforce order schema and constraints.  
**UX:** friendly error messages mapping Firebase codes to readable text.

---

## 22. Error Handling

Try/catch in services/components, console warnings with fallbacks (index missing → client sort), toast + inline errors, optimistic updates with rollback, loading states, route redirects to /unauthorized or /login, graceful degradation (localStorage fallback, chatbot fallbacks).

---

## 23. Important Functions and Hooks

**Hooks:** `useAuth()`, `useCart()`, `useWishlist()`, `useProducts()` (loads products+categories, provides filtered/paginated results + state/setters)  
**Key services:** auth methods (via context), products (fetchAll/fetchById), seller (full CRUD + upload + orders), admin (full CRUD across entities), orders (placeOrders), reviews (CRUD + transactional aggregates), wishlist, promoCodes, chatbot (matchLocalIntent, askAI), stripe, categories

---

## 24. Environment Variables (names only, NEVER secrets)

**Frontend (VITE_*):** VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_STRIPE_PUBLISHABLE_KEY, VITE_HF_API_TOKEN  
**Seed (Node):** SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD

---

## 25. Seed Scripts

`scripts/seed.mjs` (`npm run seed`): Signs in as admin (needs SEED_*), fetches 100 products from DummyJSON, creates unique categories (slug IDs), writes products with sellerId = seed admin UID, sellerName="Demo Seller", createdAt serverTimestamp. Does not clear existing data.

---

## 26. Git/Configuration

Git repo present, .gitignore includes .env, .oxlintrc.json for linting, vite.config.js, package.json defines scripts (dev/build/lint/preview/seed).

---

## 27. Performance Considerations

**Current:** Client-side filtering/pagination (12/page), Promise.all for parallel loads, memoization (useMemo/useCallback), skeleton loaders, cleanup/cancelled flags.  
**Trade-offs:** Efficient for small catalogs; scales poorly if large.  
**Potential:** React.lazy/Suspense, server-side filtering, image lazy loading/optimization, caching (SWR/React Query), infinite scroll.

---

## 28. Security Considerations

**Strengths:** Comprehensive Firestore Security Rules (RBAC + ownership + schema validation + field restrictions), route guards (UI), no secrets in frontend (publishable only), transactional validation, atomic operations, soft delete (status), price/stock re-validated server-side.  
**Gaps:** No `storage.rules` file, HF token is VITE_* (client-exposed) - better proxied via backend for production, Stripe is test/demo (needs backend for real payments), no client-side rate limiting beyond chatbot.

---

## 29. Current Weaknesses and Possible Improvements

**Weaknesses:** Missing storage.rules, no visible firestore.indexes.json, client-heavy filtering, no image lazy/optimization, chatbot token exposed client-side, no real-time listeners, no tests.  
**Improvements:** Add storage.rules + indexes.json, server-side filtering/pagination, code splitting, proxy AI calls, image compression/lazy loading, real-time listeners where useful, stronger validation (Zod), accessibility, logging.

---

## 30. Complete Customer, Seller, and Admin User Flows

### Customer
1. Discover: Home browse/search/filter/paginate → ProductDetails
2. Auth: Register/login (email/password or Google), redirect back
3. Wishlist: toggle (auth required) → view /wishlist, remove
4. Cart: add (stock-validated), view/update/remove (localStorage, guest works)
5. Checkout: shipping, optional promo, payment (COD/Stripe test), submit
6. Order: transaction splits per seller, decrements stock, clears cart → order-confirmation receipt
7. Post: /orders history, status tracking
8. Reviews: one per product if auth, aggregated ratings, can delete own
9. Support: ChatWidget

### Seller
1. Become seller (upgrade from customer) → role becomes seller
2. Access /seller
3. Overview metrics
4. Setup/edit store profile (displayName synced)
5. Product CRUD + Firebase Storage image upload
6. Inventory management (inline updates, badges)
7. Fulfill orders: view, details, status workflow updates

### Admin
1. Admin access: manual role set to "admin" in Firestore (as per README) → /admin
2. Platform oversight
3. User moderation: view/filter, change roles, suspend/activate (soft delete supported)
4. Product moderation: view/edit/delete any
5. Category CRUD
6. Global order management (view/update)
7. Promo code campaigns (CRUD, limits, expiry, toggle)

---

## 31. Summary: Most Important Things for Viva

1. **Architecture:** SPA + Firebase BaaS, Context API for state, service layer abstracts data.
2. **Security:** Firestore Security Rules are the enforcement point (UI guards cosmetic); RBAC + ownership + schema validation + transactional checks.
3. **Multi-vendor:** Per-seller order splitting in a single atomic transaction with stock decrements and proportional discount distribution.
4. **Data integrity:** `runTransaction` for orders and review rating aggregation prevents race conditions.
5. **Key collections:** users, products, orders (split), reviews, categories, promoCodes, users/{uid}/wishlist subcollection.
6. **Auth:** Firebase Auth + role in Firestore users doc; loading gates rendering.
7. **Cart:** Client-side localStorage (guest-friendly), prices re-validated server-side in transaction.
8. **Storage:** Firebase Storage for seller images, URLs in product docs.
9. **Chatbot:** Two-layer (local intent + HF API), bilingual, uses product context.
10. **Pragmatic design:** Client-side filtering for MVP, defensive fallbacks for missing indexes, optimistic updates with rollback, user-friendly error mapping.