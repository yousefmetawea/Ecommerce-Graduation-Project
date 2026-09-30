import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Store, ShieldCheck, LogOut } from "lucide-react";
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
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            Souk<span>.</span>
          </NavLink>

          <nav>
            <ul className="navbar-links">
              <li>
                <NavLink to="/">Shop</NavLink>
              </li>
              <li>
                <NavLink to="/cart" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <ShoppingBag size={16} />
                  Cart{itemCount > 0 ? ` (${itemCount})` : ""}
                </NavLink>
              </li>

              {currentUser && role === "seller" && (
                <li>
                  <NavLink to="/seller" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Store size={16} />
                    Seller hub
                  </NavLink>
                </li>
              )}

              {currentUser && role === "admin" && (
                <li>
                  <NavLink to="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={16} />
                    Admin
                  </NavLink>
                </li>
              )}

              {currentUser ? (
                <>
                  <li>
                    <NavLink to="/wishlist" aria-label="Wishlist" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                      <Heart size={16} />
                      {wishlist.length > 0 ? ` (${wishlist.length})` : ""}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/account" className="navbar-account-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <User size={16} />
                      Account
                    </NavLink>
                  </li>
                  <li>
                    <span className="navbar-role-tag">{role}</span>
                  </li>
                  <li>
                    <a
                      href="#logout"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      <LogOut size={15} />
                      Log out
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/login">Log in</NavLink>
                  </li>
                  <li>
                    <NavLink to="/register" className="btn btn-primary" style={{ padding: "0.4rem 1rem", width: "auto" }}>
                      Sign up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="footer">Souk — graduation project · built with React &amp; Firebase</footer>

      <ChatWidget />
    </div>
  );
}


