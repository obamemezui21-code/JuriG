import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../utils/permissions";

const PermissionRoute = ({ requiredPermission, fallback = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-screen">Chargement de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = hasPermission(user.permissions, requiredPermission);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="auth-screen">
        <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
          <p style={{ fontSize: 24, marginTop: 0 }}>🔒</p>
          <h2>Accès refusé</h2>
          <p>Vous n'avez pas la permission d'accéder à cette page.</p>
          <a href="/dashboard" className="btn">Retour au tableau de bord</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default PermissionRoute;
