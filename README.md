# Souk — Multi-vendor marketplace (graduation project)

React + Firebase (Auth, Firestore, Storage). No custom backend — Firebase
plays that role directly from the frontend.

## What's built so far (Phases 1–6)

- Project scaffold (Vite + React + React Router)
- Firebase config wiring (`src/firebase/config.js`)
- Auth: register / login / Google sign-in / logout (`src/context/AuthContext.jsx`)
- Role-based route protection (`src/routes/ProtectedRoute.jsx`)
- Firestore Security Rules (`firestore.rules`) & Composite Indexes (`firestore.indexes.json`)
- Storefront: product grid, search, category + max-price filters, pagination
- Product details page with image gallery and customer reviews & star ratings
- Customer wishlist and persistent cart
- Checkout with Cash on Delivery and multi-seller atomic order splitting
- Order history with order tracking
- **Phase 5 — Seller Panel**:
  - **Seller Registration & Profile**: Store name, bio, business phone, email, and warehouse address.
  - **Product Management**: Full CRUD to add, edit, and delete products with multi-image support (direct URLs + Firebase Storage upload).
  - **Inventory Management**: Real-time stock control, inline increment/decrement with instant save, and visual health badges (In Stock, Low Stock, Out of Stock).
  - **Order Management**: View all incoming store orders with buyer details, destination addresses, line items breakdown, and status workflow transitions (`pending` → `processing` → `shipped` → `delivered` / `cancelled`).
  - **Store Overview & Metrics**: Live revenue calculation, order fulfillment counts, and stock alert indicators.
- **Phase 6 — Admin Panel (Executive Terminal)**:
  - **User Management & Soft Delete**: Full user directory with role moderation (`customer`, `seller`, `admin`) and one-click soft delete / account suspension (`active` vs `suspended`).
  - **Product Moderation**: Marketplace-wide catalog inspection, editing, and removal of spam listings.
  - **Category Management**: Full CRUD for categories with custom slugs, descriptions, image banners, and live product counts.
  - **Orders Management**: Global order tracker across all buyers and sellers with line-item inspection and status override.
- **Promo Codes & Discount Engine**:
  - **Cart & Checkout Integration**: Real-time validation, automatic discount calculation (Percentage `%` or Fixed `$`), minimum order rules, and max discount caps.
  - **Proportional Order Splitting**: Discount is distributed proportionally across multi-seller split orders and recorded on receipts and order histories.
  - **Admin Promo Campaign Manager**: Full CRUD in Admin Panel to launch discount codes with expiration dates, usage limits, and live status controls.

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
2. In the project, enable:
   - **Authentication** → Sign-in method → turn on **Email/Password** and **Google**
   - **Firestore Database** → create database (start in production mode)
   - **Storage** (for product images, used from Phase 2 onward)
3. In Project Settings → General → "Your apps", add a **Web app** and copy
   the config values.
4. Copy `.env.example` to `.env` and paste those values in:
   ```
   cp .env.example .env
   ```
5. In the Firebase Console, go to Firestore → Rules, and paste the contents
   of `firestore.rules` in this repo, then Publish. Without this, every
   read/write is blocked by default.
6. Install dependencies and run:
   ```
   npm install
   npm run dev
   ```

## Creating your first admin account

There's no signup option for "admin" on purpose — anyone could pick it
otherwise. Register normally as a customer, then in the Firebase Console go
to Firestore → `users` → your document → change `role` to `"admin"`.

## Project structure

```
src/
  firebase/config.js        Firebase init (Auth, Firestore, Storage)
  context/AuthContext.jsx   register/login/logout + current role
  context/CartContext.jsx   localStorage-backed guest and signed-in cart
  routes/ProtectedRoute.jsx Role-gated route wrapper
  layouts/MainLayout.jsx    Navbar + Footer + <Outlet/>
  services/                 Firestore reads and transactional order placement
  hooks/useProducts.js      Catalog fetch + client-side search/filter/page
  components/               ProductCard, ProductFilters, Pagination
  pages/
    auth/                   Login, Register
    customer/               Storefront, cart, checkout, order confirmation
    seller/                 Seller hub
    admin/                  Admin terminal
  index.css                 Design tokens + base styles
scripts/seed.mjs            One-off catalog seeder (npm run seed)
```

## Loading the starter catalog

With Firestore rules published and an admin account's credentials in `.env`:

```
npm run seed
```

This writes ~100 DummyJSON products plus their categories. Re-running it adds
another 100 documents with fresh IDs — it does not clear what's already there.

## Next up

Reviews, seller product CRUD, and seller-side order status updates.
