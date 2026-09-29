export default function AdminConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmButtonText = "Confirm",
  isDanger = false,
  isProcessing = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: "0.5rem", fontSize: "0.92rem", lineHeight: 1.5 }}>
          {message}
        </p>

        <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing…" : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
