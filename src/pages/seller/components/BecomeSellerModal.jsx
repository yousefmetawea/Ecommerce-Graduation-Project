import { useState } from "react";
import { upgradeToSeller } from "../../../services/seller";

export default function BecomeSellerModal({
  isOpen,
  onClose,
  userId,
  currentName,
  onSuccess,
}) {
  const [storeName, setStoreName] = useState(currentName || "");
  const [storeBio, setStoreBio] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || saving) return;
    setError("");

    if (!storeName.trim()) {
      setError("Please enter your Store / Business Name.");
      return;
    }

    setSaving(true);
    try {
      await upgradeToSeller(userId, {
        storeName: storeName.trim(),
        storeBio: storeBio.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to activate seller account:", err);
      setError("Failed to activate seller account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Become a Seller on Souk</h2>
            <p className="modal-subtitle">
              Start listing your unique products and reach customers across the country.
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
              <span>Store Name *</span>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Artisan Crafts Studio"
                required
                maxLength={80}
              />
            </label>

            <label className="form-field field-full">
              <span>Store Bio / Tagline</span>
              <textarea
                value={storeBio}
                onChange={(e) => setStoreBio(e.target.value)}
                placeholder="Tell buyers what makes your store and products special..."
                rows={3}
              />
            </label>

            <label className="form-field">
              <span>Contact Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </label>

            <label className="form-field">
              <span>City</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cairo"
              />
            </label>

            <label className="form-field field-full">
              <span>Street Address</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Market Street"
              />
            </label>

            <label className="form-field field-full">
              <span>Country</span>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Egypt"
              />
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Activating Store…" : "Open My Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
