# Souk — Multi-vendor marketplace (graduation project)

React + Firebase (Auth, Firestore, Storage). No custom backend — Firebase
plays that role directly from the frontend.

## What's built so far (Phases 1–3)

- Project scaffold (Vite + React + React Router)
- Firebase config wiring (`src/firebase/config.js`)
- Auth: register / login / Google sign-in / logout (`src/context/AuthContext.jsx`)
- Role-based route protection (`src/routes/ProtectedRoute.jsx`)
- Firestore Security Rules draft (`firestore.rules`) — the real access control
- Base visual identity (colors/type in `src/index.css`)
- Storefront: product grid, search, category + max-price filters, pagination
  (`src/pages/customer/Home.jsx` driven by `src/hooks/useProducts.js`)
- Product details page with image gallery (`src/pages/customer/ProductDetails.jsx`)
- Guest and signed-in cart persisted in browser storage (`src/context/CartContext.jsx`)
- Shipping checkout with Cash on Delivery and multi-seller order splitting
- Atomic order placement and stock decrement (`src/services/orders.js`)
- Receipt-style order confirmation (`src/pages/customer/OrderConfirmation.jsx`)
- Seed script that loads 100 DummyJSON products + their categories
  (`scripts/seed.mjs`, run with `npm run seed`)

Reviews and seller product management remain planned Phase 3+ work.

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
