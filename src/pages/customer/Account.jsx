import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";

export default function Account() {
  const { currentUser, role } = useAuth();
  const { wishlist } = useWishlist();

  if (!currentUser) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Account</span>
        <h1>You're not signed in.</h1>
        <p>Sign in to manage your orders, wishlist, and profile.</p>
        <Link to="/login" className="btn btn-primary cart-empty-action">Log in</Link>
      </section>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1>{currentUser.displayName ?? "Your Account"}</h1>
        </div>
        <span className="tag">{role}</span>
      </div>

      <div className="account-grid">
        <Link to="/orders" className="account-tile">
          <div className="account-tile-icon" aria-hidden="true">📦</div>
          <div>
            <h3>Order History</h3>
            <p>Track and review your past orders.</p>
          </div>
        </Link>

        <Link to="/wishlist" className="account-tile">
          <div className="account-tile-icon" aria-hidden="true">♥</div>
          <div>
            <h3>Wishlist</h3>
            <p>{wishlist.length > 0 ? `${wishlist.length} saved item${wishlist.length !== 1 ? "s" : ""}` : "Save products you love."}</p>
          </div>
        </Link>

        <Link to="/profile" className="account-tile">
          <div className="account-tile-icon" aria-hidden="true">👤</div>
          <div>
            <h3>Profile</h3>
            <p>Manage your name, address, and contact info.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
