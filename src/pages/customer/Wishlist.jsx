import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { fetchAllProducts } from "../../services/products";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function Wishlist() {
  const { currentUser } = useAuth();
  const { wishlist, toggle } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlist.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    // Fetch all and filter — works for an MVP-scale catalog
    fetchAllProducts()
      .then((all) => {
        setProducts(all.filter((p) => wishlist.includes(p.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [wishlist]);

  if (!currentUser) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Wishlist</span>
        <h1>Sign in to see your wishlist.</h1>
        <p>Save products you love and come back to them anytime.</p>
        <Link to="/login" className="btn btn-primary cart-empty-action">Log in</Link>
      </section>
    );
  }

  if (loading) return <div className="placeholder-panel">Loading your wishlist…</div>;

  if (!wishlist.length) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Wishlist</span>
        <h1>Nothing saved yet.</h1>
        <p>Heart a product on the shop or product page to save it here.</p>
        <Link to="/" className="btn btn-primary cart-empty-action">Browse the shop</Link>
      </section>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Wishlist ({wishlist.length})</h1>
        </div>
        <Link to="/account" className="text-link">← Back to account</Link>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card" style={{ position: "relative" }}>
            <Link to={`/product/${product.id}`} className="product-card-link-overlay" aria-label={product.name}>
              <div className="product-card-image">
                {product.images?.[0]
                  ? <img src={product.images[0]} alt={product.name} />
                  : <div className="product-card-image-fallback">No image</div>}
                {(product.stock ?? 0) <= 0 && (
                  <span className="product-card-badge">Out of stock</span>
                )}
              </div>
            </Link>
            <div className="product-card-body">
              <span className="product-card-category">{product.categoryName}</span>
              <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h3 className="product-card-name">{product.name}</h3>
              </Link>
              <div className="product-card-footer">
                <span className="product-card-price">{money(product.price)}</span>
                {product.rating > 0 && (
                  <span className="product-card-rating">★ {Number(product.rating).toFixed(1)}</span>
                )}
              </div>
              <button
                className="btn btn-secondary wishlist-remove-btn"
                onClick={() => toggle(product.id)}
                aria-label={`Remove ${product.name} from wishlist`}
              >
                ♥ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
