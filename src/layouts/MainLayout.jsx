import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  User,
  Store,
  ShieldCheck,
  LogOut,
  Sparkles,
  Shield,
  CreditCard,
  Truck,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ChatWidget from "../components/ChatWidget";

export default function MainLayout() {
  const { currentUser, role, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="app-shell">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            <span className="brand-logo-icon">
              <Sparkles size={18} />
            </span>
            Souk<span>.</span>
          </NavLink>

          <nav>
            <ul className="navbar-links">
              <li>
                <NavLink to="/" end>
                  Shop
                </NavLink>
              </li>

              <li>
                <NavLink to="/cart" className="nav-icon-link">
                  <ShoppingBag size={18} />
                  <span>Cart</span>
                  {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
                </NavLink>
              </li>

              {currentUser && role === "seller" && (
                <li>
                  <NavLink to="/seller" className="nav-icon-link">
                    <Store size={18} />
                    <span>Seller hub</span>
                  </NavLink>
                </li>
              )}

              {currentUser && role === "admin" && (
                <li>
                  <NavLink to="/admin" className="nav-icon-link">
                    <ShieldCheck size={18} />
                    <span>Admin</span>
                  </NavLink>
                </li>
              )}

              {currentUser ? (
                <>
                  <li>
                    <NavLink to="/wishlist" className="nav-icon-link" aria-label="Wishlist">
                      <Heart size={18} />
                      <span>Wishlist</span>
                      {wishlist.length > 0 && (
                        <span className="nav-badge nav-badge-rust">{wishlist.length}</span>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/account" className="nav-account-btn">
                      <User size={16} />
                      <span>Account</span>
                    </NavLink>
                  </li>
                  <li>
                    <span className={`navbar-role-tag role-tag-${role}`}>{role}</span>
                  </li>
                  <li>
                    <button
                      className="nav-logout-btn"
                      onClick={handleLogout}
                      title="Log out"
                      aria-label="Log out"
                    >
                      <LogOut size={16} />
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/login" className="nav-link-login">
                      Log in
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className="btn btn-primary nav-signup-btn">
                      Sign up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer-enhanced">
        <div className="footer-inner">
          <div className="footer-grid">
            {/* Col 1: Brand & Bio */}
            <div className="footer-col footer-col-brand">
              <NavLink to="/" className="navbar-brand footer-brand">
                <Sparkles size={18} /> Souk<span>.</span>
              </NavLink>
              <p className="footer-tagline">
                Everything from sellers you trust. Your modern e-commerce marketplace powered by React &amp; Firebase.
              </p>
              <div className="footer-features">
                <span className="footer-feature-item">
                  <Shield size={14} /> Secure Checkout
                </span>
                <span className="footer-feature-item">
                  <Truck size={14} /> Fast Delivery
                </span>
                <span className="footer-feature-item">
                  <CreditCard size={14} /> Cash &amp; Cards
                </span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li>
                  <NavLink to="/">Browse Shop</NavLink>
                </li>
                <li>
                  <NavLink to="/cart">Cart &amp; Checkout</NavLink>
                </li>
                <li>
                  <NavLink to="/wishlist">Saved Wishlist</NavLink>
                </li>
                <li>
                  <NavLink to="/account">Customer Account</NavLink>
                </li>
              </ul>
            </div>

            {/* Col 3: Portals */}
            <div className="footer-col">
              <h4>Portals</h4>
              <ul>
                {currentUser && role === "seller" && (
                  <li>
                    <NavLink to="/seller">Seller Dashboard</NavLink>
                  </li>
                )}
                {currentUser && role === "admin" && (
                  <li>
                    <NavLink to="/admin">Admin Control Panel</NavLink>
                  </li>
                )}
                {!currentUser && (
                  <>
                    <li>
                      <NavLink to="/login">Seller / Admin Login</NavLink>
                    </li>
                    <li>
                      <NavLink to="/register">Create Account</NavLink>
                    </li>
                  </>
                )}
                <li>
                  <span className="footer-support-link">
                    <HelpCircle size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Chatbot Assistant
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 4: Payment Badges */}
            <div className="footer-col">
              <h4>Payment Methods</h4>
              <p className="footer-payment-note">We support safe and easy payments:</p>
              <div className="footer-payment-badges">
                <span className="payment-badge">💵 Cash on Delivery</span>
                <span className="payment-badge payment-badge-stripe">💳 Stripe Test Cards</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Souk Marketplace — Graduation Project</p>
            <p className="footer-tech-stack">Built with React · Vite · Firebase Firestore · Hugging Face AI</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
