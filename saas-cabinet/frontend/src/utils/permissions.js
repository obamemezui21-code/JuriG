export const PERMISSIONS = {
  VIEW_DASHBOARD: "viewDashboard",
  MANAGE_CLIENTS: "manageClients",
  MANAGE_SERVICES: "manageServices",
  MANAGE_PROCEDURES: "manageProcedures",
  MANAGE_INVOICES: "manageInvoices",
  MANAGE_PAYMENTS: "managePayments",
  MANAGE_ORGANIZATION: "manageOrganization",
  MANAGE_USERS: "manageUsers",
  VIEW_LEGAL_TEMPLATES: "viewLegalTemplates",
};

export const hasPermission = (userPermissions, requiredPermission) => {
  if (!Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(userPermissions)) return false;
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
};

export const getPermissionLabel = (permission) => {
  const labels = {
    viewDashboard: "Voir le tableau de bord",
    manageClients: "Gérer les clients",
    manageServices: "Gérer les services",
    manageProcedures: "Gérer les procédures",
    manageInvoices: "Gérer les factures",
    managePayments: "Gérer les paiements",
    manageOrganization: "Gérer le cabinet",
    manageUsers: "Gérer les utilisateurs",
    viewLegalTemplates: "Voir les modèles juridiques",
  };
  return labels[permission] || permission;
};
