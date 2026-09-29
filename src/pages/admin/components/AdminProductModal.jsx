import { useEffect, useState } from "react";

export default function AdminProductModal({
  product,
  categories = [],
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price !== undefined ? String(product.price) : "");
      setStock(product.stock !== undefined ? String(product.stock) : "0");
      setCategoryName(product.categoryName || "");
      setImages(Array.isArray(product.images) ? [...product.images] : []);
    }
    setImageUrlInput("");
    setError("");
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  function handleAddImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (images.includes(url)) {
      setError("Image URL already added.");
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput("");
    setError("");
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      setError("Valid price is required.");
      return;
    }

    const numStock = Math.floor(Number(stock));
    if (!Number.isFinite(numStock) || numStock < 0) {
      setError("Valid stock quantity is required.");
      return;
    }

    try {
      await onSave(product.id, {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        stock: numStock,
        categoryName: categoryName.trim() || "General",
        images,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update product.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Moderate Product</h2>
            <p className="order-id-text">
              ID: {product.id} · Seller: {product.sellerName || product.sellerId || "Unknown"}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field field-full">
              <span>Product Title *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>Price ($ USD) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>Stock Quantity *</span>
              <input
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </label>

            <label className="form-field field-full">
              <span>Category</span>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field field-full">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>

            <div className="form-field field-full">
              <span>Product Images</span>
              <div className="image-input-group">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "auto" }}
                  onClick={handleAddImageUrl}
                >
                  Add
                </button>
              </div>

              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="image-preview-card">
                      <img src={url} alt={`Preview ${idx + 1}`} />
                      <div className="image-preview-actions">
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
