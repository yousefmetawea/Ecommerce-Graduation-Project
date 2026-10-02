import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Heart, User, Store, ShieldCheck, Rocket } from "lucide-react";
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
        <span className={`navbar-role-tag role-tag-${role}`}>{role}</span>
      </div>

      <div className="account-grid">
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Link to="/orders" className="account-tile">
            <div className="account-tile-icon-badge icon-badge-amber">
              <Package size={22} />
            </div>
            <div>
              <h3>Order History</h3>
              <p>Track and review your past orders.</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Link to="/wishlist" className="account-tile">
            <div className="account-tile-icon-badge icon-badge-rust">
              <Heart size={22} />
            </div>
            <div>
              <h3>Wishlist</h3>
              <p>{wishlist.length > 0 ? `${wishlist.length} saved item${wishlist.length !== 1 ? "s" : ""}` : "Save products you love."}</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Link to="/profile" className="account-tile">
            <div className="account-tile-icon-badge icon-badge-sage">
              <User size={22} />
            </div>
            <div>
              <h3>Profile</h3>
              <p>Manage your name, address, and contact info.</p>
            </div>
          </Link>
        </motion.div>

        {role === "seller" || role === "admin" ? (
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
            <Link to="/seller" className="account-tile" style={{ borderColor: "var(--sage)" }}>
              <div className="account-tile-icon-badge icon-badge-sage">
                <Store size={22} />
              </div>
              <div>
                <h3>Seller Hub</h3>
                <p>Manage products, inventory, orders, and store settings.</p>
              </div>
            </Link>
          </motion.div>
        ) : null}

        {role === "admin" && (
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
            <Link to="/admin" className="account-tile" style={{ borderColor: "var(--amber)" }}>
              <div className="account-tile-icon-badge icon-badge-amber">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3>Admin Terminal</h3>
                <p>Moderate users, products, categories, and orders.</p>
              </div>
            </Link>
          </motion.div>
        )}

        {role !== "seller" && role !== "admin" && (
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
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
              <div className="account-tile-icon-badge icon-badge-purple">
                <Rocket size={22} />
              </div>
              <div>
                <h3>Become a Seller</h3>
                <p>Open your store and start selling products today.</p>
              </div>
            </div>
          </motion.div>
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
