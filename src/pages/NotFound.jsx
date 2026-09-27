import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="placeholder-panel">
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
        Back to shop
      </Link>
    </div>
  );
}
