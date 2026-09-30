import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function ProductCard({ product }) {
  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/product/${product.id}`} className="product-card">
        <div className="product-card-image">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-card-image-fallback">No image</div>
          )}
          {outOfStock && <span className="product-card-badge">Out of stock</span>}
        </div>

        <div className="product-card-body">
          <span className="product-card-category">{product.categoryName}</span>
          <h3 className="product-card-name">{product.name}</h3>
          <div className="product-card-footer">
            <span className="product-card-price">${Number(product.price).toFixed(2)}</span>
            {product.rating > 0 && (
              <span className="product-card-rating" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                <Star size={13} fill="var(--amber)" color="var(--amber)" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
