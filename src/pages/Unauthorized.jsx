import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="placeholder-panel">
      <h2>You don't have access to this page</h2>
      <p>This area is restricted to a different account role.</p>
      <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
        Back to shop
      </Link>
    </div>
  );
}
