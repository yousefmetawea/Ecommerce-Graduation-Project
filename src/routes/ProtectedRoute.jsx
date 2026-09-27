import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Usage: <ProtectedRoute allowedRoles={["seller"]}><SellerDashboard /></ProtectedRoute>
// Leave allowedRoles empty to just require "logged in, any role".
//
// Reminder: this only hides pages in the UI. The real protection has to
// live in Firestore Security Rules, since anyone can edit the React code
// running in their own browser.
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, role } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
