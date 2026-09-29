import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/customer/Home";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import CheckoutSuccess from "./pages/customer/CheckoutSuccess";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SellerDashboard from "./pages/seller/SellerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Phase 4 — Customer Extras
import Account from "./pages/customer/Account";
import OrderHistory from "./pages/customer/OrderHistory";
import Wishlist from "./pages/customer/Wishlist";
import Profile from "./pages/customer/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public - anyone can browse the storefront and auth pages */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Customer account pages — require login */}
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute allowedRoles={["customer", "seller", "admin"]}>
                      <Account />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={["customer", "seller", "admin"]}>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute allowedRoles={["customer", "seller", "admin"]}>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={["customer", "seller", "admin"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Seller-only */}
                <Route
                  path="/seller"
                  element={
                    <ProtectedRoute allowedRoles={["seller"]}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin-only */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
