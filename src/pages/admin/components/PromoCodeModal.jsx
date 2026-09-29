import { useEffect, useState } from "react";
import { normalizePromoCode } from "../../../services/promoCodes";

export default function PromoCodeModal({
  promo = null,
  isOpen,
  onClose,
  onSubmit,
  isSaving = false,
}) {
  const isEditing = Boolean(promo);

  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (promo) {
      setCode(promo.code || "");
      setType(promo.type || "percentage");
      setValue(promo.value !== undefined ? String(promo.value) : "");
      setDescription(promo.description || "");
      setMinOrderAmount(promo.minOrderAmount ? String(promo.minOrderAmount) : "");
      setMaxDiscount(promo.maxDiscount ? String(promo.maxDiscount) : "");

      // Format expiry date for input type="date"
      if (promo.expiryDate) {
        let d = null;
        if (promo.expiryDate.toDate) d = promo.expiryDate.toDate();
        else if (promo.expiryDate.seconds) d = new Date(promo.expiryDate.seconds * 1000);
        else d = new Date(promo.expiryDate);
        if (d && !isNaN(d.getTime())) {
          setExpiryDate(d.toISOString().split("T")[0]);
        } else {
          setExpiryDate("");
        }
      } else {
        setExpiryDate("");
      }

      setUsageLimit(promo.usageLimit ? String(promo.usageLimit) : "");
      setIsActive(promo.isActive !== false);
    } else {
      setCode("");
      setType("percentage");
      setValue("");
      setDescription("");
      setMinOrderAmount("");
      setMaxDiscount("");
      setExpiryDate("");
      setUsageLimit("");
      setIsActive(true);
    }
    setError("");
  }, [promo, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanCode = normalizePromoCode(code);
    if (!cleanCode || cleanCode.length < 3) {
      setError("Please enter a valid code of at least 3 characters.");
      return;
    }

    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      setError("Discount value must be greater than 0.");
      return;
    }

    if (type === "percentage" && numValue > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    const payload = {
      code: cleanCode,
      type,
      value: numValue,
      description: description.trim(),
      minOrderAmount: minOrderAmount ? Math.max(0, Number(minOrderAmount)) : 0,
      maxDiscount: maxDiscount ? Math.max(0, Number(maxDiscount)) : null,
      expiryDate: expiryDate ? new Date(expiryDate + "T23:59:59") : null,
      usageLimit: usageLimit ? Math.floor(Number(usageLimit)) : null,
      isActive,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save promo code.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEditing ? `Edit Promo Code "${promo.code}"` : "Create New Promo Code"}</h2>
            <p className="modal-subtitle">
              Set discount rates, minimum orders, and expiration rules.
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
            <label className="form-field">
              <span>Promo Code String *</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                required
                disabled={isEditing}
                maxLength={30}
              />
            </label>

            <label className="form-field">
              <span>Discount Type *</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount ($ USD)</option>
              </select>
            </label>

            <label className="form-field">
              <span>Discount Value *</span>
              <input
                type="number"
                step={type === "percentage" ? "1" : "0.01"}
                min="0.01"
                max={type === "percentage" ? "100" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percentage" ? "15 (for 15%)" : "10.00 (for $10 off)"}
                required
              />
            </label>

            <label className="form-field">
              <span>Min. Order Subtotal ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="e.g. 50.00 (Optional)"
              />
            </label>

            {type === "percentage" && (
              <label className="form-field">
                <span>Max Discount Cap ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="e.g. 30.00 (Optional)"
                />
              </label>
            )}

            <label className="form-field">
              <span>Expiration Date</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Usage Limit (Max Total Uses)</span>
              <input
                type="number"
                step="1"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="e.g. 100 (Optional)"
              />
            </label>

            <label className="form-field field-full">
              <span>Description / Internal Note</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 15% discount for new customers"
                maxLength={100}
              />
            </label>

            <div className="form-field field-full" style={{ marginTop: "0.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: "auto" }}
                />
                <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                  Active (Customers can use this code)
                </span>
              </label>
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
              {isSaving
                ? "Saving…"
                : isEditing
                ? "Save Changes"
                : "Create Promo Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
