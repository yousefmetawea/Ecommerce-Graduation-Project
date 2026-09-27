import { useAuth } from "../../context/AuthContext";

export default function SellerDashboard() {
  const { currentUser } = useAuth();

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Seller hub</h1>
          <p>Welcome back, {currentUser?.displayName || currentUser?.email}.</p>
        </div>
        <span className="tag tag-sage">Active seller</span>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-label">Products listed</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Open orders</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Earnings this month</div>
          <div className="stat-value">$0</div>
        </div>
      </div>

      <div className="placeholder-panel">
        Product management + order queue arrive in Phase 5.
      </div>
    </div>
  );
}
