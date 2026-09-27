# Souk — Multi-vendor marketplace (graduation project)

React + Firebase (Auth, Firestore, Storage). No custom backend — Firebase
plays that role directly from the frontend.

## What's built so far (Phase 1)

- Project scaffold (Vite + React + React Router)
- Firebase config wiring (`src/firebase/config.js`)
- Auth: register / login / Google sign-in / logout (`src/context/AuthContext.jsx`)
- Role-based route protection (`src/routes/ProtectedRoute.jsx`)
- Firestore Security Rules draft (`firestore.rules`) — the real access control
- Shell pages for each role: Home (customer), Seller hub, Admin terminal
- Base visual identity (colors/type in `src/index.css`)

Everything past this — product listings, cart, orders, reviews — is Phase 2+.

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
  routes/ProtectedRoute.jsx Role-gated route wrapper
  layouts/MainLayout.jsx    Navbar + Footer + <Outlet/>
  pages/
    auth/                   Login, Register
    customer/               Storefront pages (Home now, more in Phase 2)
    seller/                 Seller hub
    admin/                  Admin terminal
  index.css                 Design tokens + base styles
```

## Next up (Phase 2)

Product listings collection, category browsing, search + filters, and
seeding real starter data (e.g. from a temporary public API) into Firestore.
