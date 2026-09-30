import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Heart, ShoppingBag, Star } from "lucide-react";
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

  if (loading) {
    return (
      <div className="product-details">
        <div className="product-details-gallery">
          <Skeleton height={380} borderRadius={8} />
        </div>
        <div className="product-details-info">
          <Skeleton width={100} height={24} style={{ marginBottom: 12 }} />
          <Skeleton height={36} style={{ marginBottom: 12 }} />
          <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
          <Skeleton height={80} style={{ marginBottom: 24 }} />
          <Skeleton height={48} width={200} />
        </div>
      </div>
    );
  }

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

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = () => {
    toggle(product.id);
    if (wishlisted) {
      toast("Removed from wishlist", { icon: "💔" });
    } else {
      toast.success("Added to wishlist!");
    }
  };

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
            <p className="product-details-rating" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <Star size={16} fill="var(--amber)" color="var(--amber)" />
              {product.rating.toFixed(1)} {product.ratingCount ? `(${product.ratingCount} reviews)` : ""}
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
              style={{ flex: "1 1 auto", minWidth: "160px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              disabled={outOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={18} />
              {outOfStock ? "Unavailable" : "Add to cart"}
            </button>

            {currentUser && (
              <button
                className={`btn ${wishlisted ? "btn-wishlist-active" : "btn-secondary"}`}
                style={{ width: "auto", padding: "0.7rem 1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                onClick={handleToggleWishlist}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={18} fill={wishlisted ? "var(--rust)" : "none"} color={wishlisted ? "var(--rust)" : "currentColor"} />
                {wishlisted ? "Saved" : "Wishlist"}
              </button>
            )}
          </div>

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

