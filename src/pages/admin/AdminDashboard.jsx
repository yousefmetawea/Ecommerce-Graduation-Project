export default function AdminDashboard() {
  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Executive terminal</h1>
          <p>Platform-wide numbers and moderation tools.</p>
        </div>
        <span className="tag tag-amber">Admin</span>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-label">Gross platform volume</div>
          <div className="stat-value">$0</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Active users</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Pending sellers</div>
          <div className="stat-value">0</div>
        </div>
      </div>

      <div className="placeholder-panel">
        User management, product/category moderation, and orders arrive in Phase 6.
      </div>
    </div>
  );
}
