import { getPermissionLabel } from "../utils/permissions";

const PermissionGuard = ({ hasPermission, permission, children, fallback = null }) => {
  if (hasPermission) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div className="card" style={{ textAlign: "center", opacity: 0.6 }}>
      <p style={{ marginTop: 0 }}>🔒 Accès refusé</p>
      <p>Vous n'avez pas la permission: <strong>{getPermissionLabel(permission)}</strong></p>
    </div>
  );
};

export default PermissionGuard;
