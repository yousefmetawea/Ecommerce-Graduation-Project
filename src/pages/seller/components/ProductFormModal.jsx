import { useEffect, useState } from "react";
import { fetchCategories } from "../../../services/categories";
import { uploadProductImage } from "../../../services/seller";

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct = null,
  sellerId,
  isSaving = false,
}) {
  const isEditing = Boolean(initialProduct);

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState("");

  // Load existing categories
  useEffect(() => {
    if (!isOpen) return;
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
      })
      .catch(() => {});
  }, [isOpen]);

  // Pre-fill form when editing or clear on open
  useEffect(() => {
    if (!isOpen) return;
    setFormError("");
    setImageUrlInput("");
    setUploading(false);
    setUploadProgress(0);

    if (initialProduct) {
      setName(initialProduct.name || "");
      setDescription(initialProduct.description || "");
      setPrice(initialProduct.price !== undefined ? String(initialProduct.price) : "");
      setStock(initialProduct.stock !== undefined ? String(initialProduct.stock) : "0");
      setSelectedCategory(initialProduct.categoryName || initialProduct.categoryId || "");
      setCustomCategory("");
      setImages(Array.isArray(initialProduct.images) ? [...initialProduct.images] : []);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setSelectedCategory("");
      setCustomCategory("");
      setImages([]);
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  function handleAddImageUrl(e) {
    e?.preventDefault();
    const url = imageUrlInput.trim();
    if (!url) return;
    if (images.includes(url)) {
      setFormError("This image URL is already in the list.");
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput("");
    setFormError("");
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!sellerId) {
      setFormError("Cannot upload image without active seller session.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFormError("");

    try {
      const downloadUrl = await uploadProductImage(file, sellerId, (pct) => {
        setUploadProgress(pct);
      });
      setImages((prev) => [...prev, downloadUrl]);
    } catch (err) {
      console.error("Image upload failed:", err);
      setFormError("Failed to upload image. Please try pasting a direct image URL instead.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleSetPrimaryImage(index) {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please provide a product title.");
      return;
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      setFormError("Please provide a valid price ($0.00 or higher).");
      return;
    }

    const numStock = Math.floor(Number(stock));
    if (!Number.isFinite(numStock) || numStock < 0) {
      setFormError("Please provide a valid inventory stock quantity (0 or higher).");
      return;
    }

    const effectiveCategory =
      selectedCategory === "__custom__"
        ? customCategory.trim()
        : selectedCategory.trim();

    if (!effectiveCategory) {
      setFormError("Please select or enter a category for this product.");
      return;
    }

    const productPayload = {
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      stock: numStock,
      categoryName: effectiveCategory,
      images,
    };

    onSubmit(productPayload);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Edit Product" : "Add New Product"}</h2>
            <p className="modal-subtitle">
              {isEditing
                ? "Update your product details and inventory."
                : "Fill out the information below to list a new item on Souk."}
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

        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="form-grid">
            {/* Product Title */}
            <label className="form-field field-full">
              <span>Product Title *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Handmade Ceramic Vase"
                required
                maxLength={120}
              />
            </label>

            {/* Price */}
            <label className="form-field">
              <span>Price ($ USD) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                required
              />
            </label>

            {/* Stock */}
            <label className="form-field">
              <span>Stock Quantity *</span>
              <input
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                required
              />
            </label>

            {/* Category selection */}
            <label className="form-field field-full">
              <span>Category *</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="__custom__">+ Other / Add new category</option>
              </select>
            </label>

            {selectedCategory === "__custom__" && (
              <label className="form-field field-full">
                <span>New Category Name *</span>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Kitchenware"
                  required
                />
              </label>
            )}

            {/* Description */}
            <label className="form-field field-full">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item, materials, dimensions, and unique features..."
                rows={4}
              />
            </label>

            {/* Images Manager */}
            <div className="form-field field-full">
              <span>Product Images</span>
              <div className="image-input-group">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                  onClick={handleAddImageUrl}
                >
                  Add URL
                </button>
              </div>

              <div className="image-upload-row">
                <label className="upload-file-label">
                  <span>📁 Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <span className="upload-progress-text">
                    Uploading image... {uploadProgress > 0 ? `${uploadProgress}%` : ""}
                  </span>
                )}
              </div>

              {/* Image Previews */}
              {images.length > 0 ? (
                <div className="image-preview-grid">
                  {images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="image-preview-card">
                      <img src={url} alt={`Product preview ${idx + 1}`} />
                      {idx === 0 && <span className="primary-badge">Cover</span>}
                      <div className="image-preview-actions">
                        {idx !== 0 && (
                          <button
                            type="button"
                            title="Make cover image"
                            onClick={() => handleSetPrimaryImage(idx)}
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          className="remove-img-btn"
                          title="Remove image"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="field-hint">
                  Add at least one image URL or upload a photo to display on the storefront.
                </p>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || uploading}
            >
              {isSaving
                ? "Saving Product…"
                : isEditing
                ? "Save Changes"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
