import { useEffect, useState } from "react";
import { slugify } from "../../../services/admin";

export default function CategoryModal({
  category = null,
  isOpen,
  onClose,
  onSubmit,
  isSaving = false,
}) {
  const isEditing = Boolean(category);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSlug(category.id || category.slug || "");
      setDescription(category.description || "");
      setImage(category.image || "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setImage("");
    }
    setError("");
  }, [category, isOpen]);

  if (!isOpen) return null;

  function handleNameChange(e) {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        image: image.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save category.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Edit Category" : "Add New Category"}</h2>
            <p className="modal-subtitle">
              Categories help organize products across the entire marketplace.
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
              <span>Category Name *</span>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Home & Kitchen"
                required
                maxLength={60}
              />
            </label>

            <label className="form-field field-full">
              <span>Category Identifier / Slug {isEditing && "(Read-only)"}</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="e.g. home-kitchen"
                disabled={isEditing}
                required
              />
            </label>

            <label className="form-field field-full">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of items in this category..."
                rows={3}
              />
            </label>

            <label className="form-field field-full">
              <span>Icon or Banner Image URL</span>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </label>
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
              {isSaving
                ? "Saving…"
                : isEditing
                ? "Save Changes"
                : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
