import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import BecomeSellerModal from "../seller/components/BecomeSellerModal";

export default function Account() {
  const { currentUser, role } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isBecomeSellerOpen, setIsBecomeSellerOpen] = useState(false);

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

        {role === "seller" || role === "admin" ? (
          <Link to="/seller" className="account-tile" style={{ borderColor: "var(--sage)" }}>
            <div className="account-tile-icon" aria-hidden="true">🏪</div>
            <div>
              <h3>Seller Hub</h3>
              <p>Manage products, inventory, orders, and store settings.</p>
            </div>
          </Link>
        ) : (
          <div
            className="account-tile"
            style={{ cursor: "pointer" }}
            onClick={() => setIsBecomeSellerOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsBecomeSellerOpen(true);
            }}
          >
            <div className="account-tile-icon" aria-hidden="true">🚀</div>
            <div>
              <h3>Become a Seller</h3>
              <p>Open your store and start selling products today.</p>
            </div>
          </div>
        )}
      </div>

      <BecomeSellerModal
        isOpen={isBecomeSellerOpen}
        onClose={() => setIsBecomeSellerOpen(false)}
        userId={currentUser.uid}
        currentName={currentUser.displayName}
        onSuccess={() => {
          navigate("/seller");
          window.location.reload();
        }}
      />
    </div>
  );
}
