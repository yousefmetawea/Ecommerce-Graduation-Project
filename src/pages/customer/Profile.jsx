import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Package,
  Heart,
  Edit3,
  Check,
  X,
  Shield,
} from "lucide-react";
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
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, form);
      setProfile((prev) => ({ ...prev, ...form }));
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch {
      setError("Couldn't save your profile. Please try again.");
      toast.error("Failed to update profile.");
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

  if (loading) {
    return (
      <div>
        <div className="page-heading">
          <Skeleton width={180} height={32} />
        </div>
        <div className="profile-layout">
          <aside className="profile-card">
            <Skeleton circle width={72} height={72} style={{ marginBottom: 12 }} />
            <Skeleton width={120} height={20} style={{ marginBottom: 6 }} />
            <Skeleton width={160} height={14} />
          </aside>
          <section className="profile-form-section">
            <Skeleton height={24} width={200} style={{ marginBottom: 20 }} />
            <Skeleton count={4} height={40} style={{ marginBottom: 12 }} />
          </section>
        </div>
      </div>
    );
  }

  const nameInitial = (profile?.name ?? currentUser.displayName ?? "?").charAt(0).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-badge">
              {nameInitial}
            </div>
            <span className="profile-avatar-icon-overlay">
              <Shield size={14} />
            </span>
          </div>

          <strong className="profile-card-name">{profile?.name || currentUser.displayName || "User"}</strong>
          <span className="profile-card-email">{currentUser.email}</span>

          <span className={`navbar-role-tag role-tag-${profile?.role ?? "customer"}`} style={{ marginTop: "0.5rem" }}>
            {profile?.role ?? "customer"}
          </span>

          <div className="profile-card-links">
            <Link to="/orders" className="profile-link-btn">
              <Package size={16} /> My Orders
            </Link>
            <Link to="/wishlist" className="profile-link-btn">
              <Heart size={16} /> My Wishlist
            </Link>
          </div>
        </aside>

        {/* Edit form */}
        <section className="profile-form-section">
          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>
          )}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="profile-detail-header">
                <h2>Edit Profile Details</h2>
              </div>
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
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "auto", padding: "0.65rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  disabled={saving}
                >
                  <Check size={16} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "auto", padding: "0.65rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  onClick={() => setEditing(false)}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-detail-header">
                <h2>Personal Information</h2>
                <button
                  className="btn btn-secondary"
                  style={{ width: "auto", padding: "0.5rem 1.1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  onClick={() => setEditing(true)}
                >
                  <Edit3 size={15} /> Edit
                </button>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <div className="profile-info-icon"><User size={18} /></div>
                  <div>
                    <span className="profile-info-label">Full Name</span>
                    <strong>{profile?.name || <em className="empty-value">Not set</em>}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon"><Mail size={18} /></div>
                  <div>
                    <span className="profile-info-label">Email Address</span>
                    <strong>{currentUser.email}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon"><Phone size={18} /></div>
                  <div>
                    <span className="profile-info-label">Phone Number</span>
                    <strong>{profile?.phone || <em className="empty-value">Not set</em>}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon"><MapPin size={18} /></div>
                  <div>
                    <span className="profile-info-label">Street Address</span>
                    <strong>{profile?.address || <em className="empty-value">Not set</em>}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon"><Building size={18} /></div>
                  <div>
                    <span className="profile-info-label">City &amp; Zip</span>
                    <strong>
                      {profile?.city || profile?.postalCode
                        ? [profile.city, profile.postalCode].filter(Boolean).join(", ")
                        : <em className="empty-value">Not set</em>}
                    </strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <div className="profile-info-icon"><Globe size={18} /></div>
                  <div>
                    <span className="profile-info-label">Country</span>
                    <strong>{profile?.country || <em className="empty-value">Not set</em>}</strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </motion.div>
  );
}
