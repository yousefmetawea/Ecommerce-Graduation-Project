import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchReviewsForProduct,
  hasUserReviewedProduct,
  submitReview,
  deleteReview,
} from "../services/reviews";

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-picker" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${(hovered || value) >= star ? "active" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          aria-pressed={value === star}
        >
          ★
        </button>
      ))}
      <span className="star-picker-label">
        {value ? `${value} / 5` : "Select a rating"}
      </span>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ProductReviews({ productId }) {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState(null); // id if user already reviewed
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function loadReviews() {
    const data = await fetchReviewsForProduct(productId);
    setReviews(data);
  }

  useEffect(() => {
    setLoading(true);
    loadReviews()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!currentUser) {
      setExistingReviewId(null);
      return;
    }
    hasUserReviewedProduct(currentUser.uid, productId).then((id) => {
      setExistingReviewId(id);
    });
  }, [currentUser, productId, reviews]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser || submitting) return;
    if (!form.rating) {
      setFormError("Please pick a star rating.");
      return;
    }
    if (!form.comment.trim()) {
      setFormError("Please write a short review.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await submitReview({
        userId: currentUser.uid,
        userName: currentUser.displayName ?? currentUser.email ?? "Anonymous",
        productId,
        rating: form.rating,
        comment: form.comment,
      });
      setForm({ rating: 0, comment: "" });
      setFormSuccess("Thanks for your review!");
      await loadReviews();
    } catch (err) {
      setFormError(err.message || "Couldn't submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId) {
    if (!window.confirm("Delete your review?")) return;
    try {
      await deleteReview(reviewId, productId);
      setFormSuccess("");
      await loadReviews();
    } catch {
      alert("Couldn't delete review. Please try again.");
    }
  }

  const avgRating =
    reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="reviews-section">
      <div className="reviews-header">
        <h2>Reviews & Ratings</h2>
        {avgRating && (
          <span className="reviews-avg">
            <span className="reviews-avg-stars">★★★★★</span>
            <strong>{avgRating}</strong>
            <span className="reviews-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </span>
        )}
      </div>

      {/* Write a review */}
      {currentUser && !existingReviewId && (
        <div className="review-form-card">
          <h3>Write a review</h3>
          {formSuccess && <div className="profile-success" role="status">{formSuccess}</div>}
          {formError && <div className="form-error" role="alert">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <StarPicker value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
            <label className="review-comment-label">
              <span>Your review</span>
              <textarea
                className="review-textarea"
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="What did you think of this product?"
                rows={4}
                maxLength={1000}
                required
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "auto", padding: "0.65rem 1.5rem", marginTop: "0.5rem" }}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        </div>
      )}

      {!currentUser && (
        <p className="reviews-login-prompt">
          <a href="/login">Sign in</a> to leave a review.
        </p>
      )}

      {existingReviewId && (
        <p className="profile-success" style={{ marginBottom: "1rem" }}>
          You've already reviewed this product.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <div className="placeholder-panel">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet. Be the first!</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card-header">
                <div>
                  <span className="review-author">{review.userName}</span>
                  <span className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                </div>
                <div className="review-card-right">
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                  {currentUser?.uid === review.userId && (
                    <button
                      className="remove-item"
                      onClick={() => handleDelete(review.id)}
                      title="Delete your review"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
