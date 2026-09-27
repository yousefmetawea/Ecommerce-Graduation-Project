import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function MainLayout() {
  const { currentUser, role, logout } = useAuth();
  const { itemCount } = useCart();
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
                <NavLink to="/cart">Cart{itemCount > 0 ? ` (${itemCount})` : ""}</NavLink>
              </li>

              {currentUser && role === "seller" && (
                <li>
                  <NavLink to="/seller">Seller hub</NavLink>
                </li>
              )}

              {currentUser && role === "admin" && (
                <li>
                  <NavLink to="/admin">Admin</NavLink>
                </li>
              )}

              {currentUser ? (
                <>
                  <li>
                    <span className="navbar-role-tag">{role}</span>
                  </li>
                  <li>
                    <a
                      href="#logout"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
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
    </div>
  );
}
