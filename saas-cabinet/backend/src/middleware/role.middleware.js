const requireRole = (requiredRole) => (req, res, next) => {
  const userRole = String(req.user?.role || "").toLowerCase();
  const neededRole = String(requiredRole || "").toLowerCase();

  if (!userRole) {
    return res.status(401).json({ message: "Rôle utilisateur introuvable." });
  }

  if (userRole !== neededRole) {
    return res.status(403).json({ message: "Accès refusé. Rôle insuffisant." });
  }

  next();
};

const requirePermission = (permission) => (req, res, next) => {
  const perms = Array.isArray(req.user?.permissions) ? req.user.permissions : [];

  if (!perms.includes(permission)) {
    return res.status(403).json({ message: "Accès refusé. Permission requise." });
  }

  next();
};

const requireAdmin = requireRole("admin");

module.exports = {
  requireRole,
  requireAdmin,
  requirePermission,
};
