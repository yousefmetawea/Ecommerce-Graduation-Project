import { useEffect, useState } from "react";

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSaveRole,
  onSaveStatus,
  isSaving = false,
}) {
  const [role, setRole] = useState(user?.role || "customer");
  const [status, setStatus] = useState(user?.status || "active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setRole(user.role || "customer");
      setStatus(user.status || "active");
      setError("");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    try {
      const promises = [];
      if (role !== user.role) {
        promises.push(onSaveRole(user.id, role));
      }
      if (status !== (user.status || "active")) {
        promises.push(onSaveStatus(user.id, status));
      }

      if (promises.length === 0) {
        onClose();
        return;
      }

      await Promise.all(promises);
      onClose();
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(err?.message || "Failed to update user settings.");
    }
  }

  const createdDate = user.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleString()
    : user.createdAt?.seconds
    ? new Date(user.createdAt.seconds * 1000).toLocaleString()
    : "N/A";

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Manage User Account</h2>
            <p className="order-id-text">UID: {user.id}</p>
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

        <form onSubmit={handleSave}>
          <div className="user-modal-summary">
            <div className="profile-avatar" style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}>
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.name || "No name"}</strong>
              <div className="table-sku">{user.email}</div>
              <div className="table-sku">Registered: {createdDate}</div>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <label className="form-field">
              <span>Account Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">Customer (Shopper)</option>
                <option value="seller">Seller (Merchant)</option>
                <option value="admin">Administrator</option>
              </select>
            </label>

            <label className="form-field">
              <span>Account Status (Soft Delete)</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active (Normal access)</option>
                <option value="suspended">Suspended (Blocked / Soft deleted)</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <div className="form-field field-full">
              <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                Note: Suspending a user immediately flags their account as restricted and preserves their order and review histories intact.
              </span>
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
