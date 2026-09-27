import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { fetchProductById } from "../../services/products";
import ProductReviews from "../../components/ProductReviews";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [cartMessage, setCartMessage] = useState("");
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const { isWishlisted, toggle, error: wishlistError } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchProductById(id)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError("This product doesn't exist or was removed.");
        else setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this product. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="placeholder-panel">Loading product…</div>;

  if (error) {
    return (
      <div className="placeholder-panel">
        <p>{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
          Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = (product.stock ?? 0) <= 0;
  const images = product.images?.length ? product.images : [];
  const wishlisted = currentUser ? isWishlisted(product.id) : false;

  return (
    <div>
      <div className="product-details">
        <div className="product-details-gallery">
          <div className="product-details-main-image">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={product.name} />
            ) : (
              <div className="product-card-image-fallback">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-details-thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  className={`product-details-thumb ${i === activeImage ? "active" : ""}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details-info">
          <span className="tag">{product.categoryName}</span>
          <h1>{product.name}</h1>

          {product.rating > 0 && (
            <p className="product-details-rating">
              ★ {product.rating.toFixed(1)} {product.ratingCount ? `(${product.ratingCount} reviews)` : ""}
            </p>
          )}

          <p className="product-details-price">${Number(product.price).toFixed(2)}</p>

          <p className={`tag ${outOfStock ? "tag-rust" : "tag-sage"}`} style={{ marginBottom: "1.25rem" }}>
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </p>

          <p>{product.description}</p>

          {product.sellerName && (
            <p className="product-details-seller">Sold by {product.sellerName}</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              style={{ flex: "1 1 auto", minWidth: "160px" }}
              disabled={outOfStock}
              onClick={() => {
                addItem(product);
                setCartMessage("Added to your cart.");
              }}
            >
              {outOfStock ? "Unavailable" : "Add to cart"}
            </button>

            {currentUser && (
              <button
                className={`btn ${wishlisted ? "btn-wishlist-active" : "btn-secondary"}`}
                style={{ width: "auto", padding: "0.7rem 1rem" }}
                onClick={() => toggle(product.id)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                {wishlisted ? "♥ Saved" : "♡ Wishlist"}
              </button>
            )}
          </div>
          {cartMessage && (
            <p className="cart-feedback" role="status">
              {cartMessage} <Link to="/cart">View cart</Link>
            </p>
          )}
          {wishlistError && (
            <p className="form-error" role="alert" style={{ marginTop: "0.75rem" }}>
              {wishlistError}
            </p>
          )}
        </div>
      </div>

      {/* Reviews section below the product details grid */}
      <ProductReviews productId={id} />
    </div>
  );
}
