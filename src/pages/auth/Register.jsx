import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Admin accounts aren't self-service — they're promoted manually in
// Firestore (or by an existing admin), never chosen at signup.
export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("customer");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password needs to be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, role: accountType });
      navigate(accountType === "seller" ? "/seller" : "/", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card">
      <h1>Create your account</h1>
      <p>Shop the marketplace, or register as a seller to list your own products.</p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Full name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="form-field">
          <label htmlFor="accountType">Account type</label>
          <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="customer">Customer — I want to shop</option>
            <option value="seller">Seller — I want to sell products</option>
          </select>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="divider-or">or</div>

      <button className="btn btn-secondary" type="button" onClick={handleGoogle} disabled={submitting}>
        Continue with Google
      </button>

      <p className="form-footnote">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

function friendlyAuthError(err) {
  const code = err?.code ?? "";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("weak-password")) return "Choose a stronger password (at least 6 characters).";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  return "Something went wrong. Please try again.";
}
