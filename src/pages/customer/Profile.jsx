import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchUserProfile, updateUserProfile } from "../../services/userProfile";

export default function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    fetchUserProfile(currentUser.uid)
      .then((data) => {
        setProfile(data);
        if (data) {
          setForm({
            name: data.name ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            postalCode: data.postalCode ?? "",
            country: data.country ?? "",
          });
        }
      })
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, [currentUser]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUser || saving) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, form);
      setProfile((prev) => ({ ...prev, ...form }));
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch {
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) {
    return (
      <section className="cart-empty">
        <span className="eyebrow">Profile</span>
        <h1>Please sign in.</h1>
        <Link to="/login" className="btn btn-primary cart-empty-action">Log in</Link>
      </section>
    );
  }

  if (loading) return <div className="placeholder-panel">Loading profile…</div>;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Your Profile</h1>
        </div>
        <Link to="/account" className="text-link">← Back to account</Link>
      </div>

      <div className="profile-layout">
        {/* Avatar / summary card */}
        <aside className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {(profile?.name ?? currentUser.displayName ?? "?").charAt(0).toUpperCase()}
          </div>
          <strong className="profile-card-name">{profile?.name ?? currentUser.displayName}</strong>
          <span className="profile-card-email">{currentUser.email}</span>
          <span className="tag" style={{ marginTop: "0.5rem" }}>{profile?.role ?? "customer"}</span>
          <div className="profile-card-links">
            <Link to="/orders">My Orders</Link>
            <Link to="/wishlist">My Wishlist</Link>
          </div>
        </aside>

        {/* Edit form */}
        <section className="profile-form-section">
          {success && (
            <div className="profile-success" role="status">{success}</div>
          )}
          {error && (
            <div className="form-error" role="alert">{error}</div>
          )}

          {editing ? (
            <form onSubmit={handleSave}>
              <h2>Edit Details</h2>
              <div className="form-grid">
                <label className="form-field">
                  <span>Full name</span>
                  <input name="name" value={form.name} onChange={handleChange} required maxLength={100} autoComplete="name" />
                </label>
                <label className="form-field">
                  <span>Phone number</span>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={30} autoComplete="tel" />
                </label>
                <label className="form-field field-full">
                  <span>Street address</span>
                  <input name="address" value={form.address} onChange={handleChange} maxLength={180} autoComplete="street-address" />
                </label>
                <label className="form-field">
                  <span>City</span>
                  <input name="city" value={form.city} onChange={handleChange} maxLength={80} autoComplete="address-level2" />
                </label>
                <label className="form-field">
                  <span>Postal code</span>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} maxLength={20} autoComplete="postal-code" />
                </label>
                <label className="form-field field-full">
                  <span>Country</span>
                  <input name="country" value={form.country} onChange={handleChange} maxLength={80} autoComplete="country-name" />
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "0.65rem 1.5rem" }} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button type="button" className="btn btn-secondary" style={{ width: "auto", padding: "0.65rem 1.5rem" }} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-detail-header">
                <h2>Personal Information</h2>
                <button className="btn btn-secondary" style={{ width: "auto", padding: "0.5rem 1.1rem" }} onClick={() => setEditing(true)}>
                  Edit
                </button>
              </div>
              <dl className="profile-details">
                <div>
                  <dt>Full name</dt>
                  <dd>{profile?.name || <em className="empty-value">Not set</em>}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{profile?.phone || <em className="empty-value">Not set</em>}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>
                    {profile?.address
                      ? [profile.address, profile.city, profile.postalCode, profile.country]
                          .filter(Boolean)
                          .join(", ")
                      : <em className="empty-value">Not set</em>}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
