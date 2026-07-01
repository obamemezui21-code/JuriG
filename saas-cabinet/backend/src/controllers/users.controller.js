const bcrypt = require("bcrypt");
const { findUserByEmail, listUsers, createUser, updateUser, deleteUser } = require("../models/user.model");

const AVAILABLE_PERMISSIONS = [
  "viewDashboard",
  "manageClients",
  "manageServices",
  "manageProcedures",
  "manageInvoices",
  "managePayments",
  "manageOrganization",
  "manageUsers",
];

const getDefaultPermissions = (role) => {
  const base = [
    "viewDashboard",
    "manageClients",
    "manageServices",
    "manageProcedures",
    "manageInvoices",
    "managePayments",
    "manageOrganization",
  ];

  if (String(role).toLowerCase() === "admin") {
    return [...base, "manageUsers"];
  }

  return base;
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return permissions
    .map((p) => String(p || "").trim())
    .filter((p) => p && AVAILABLE_PERMISSIONS.includes(p));
};

const formatUser = (user) => {
  const rawPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  const permissions = rawPermissions.length > 0 ? normalizePermissions(rawPermissions) : getDefaultPermissions(user.role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions,
    organizationId: user.organization_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

const listOrganizationUsers = async (req, res, next) => {
  try {
    const users = await listUsers(req.user.organizationId);
    res.json({ users: users.map(formatUser) });
  } catch (error) {
    next(error);
  }
};

const generateRandomPassword = (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const createNewUser = async (req, res, next) => {
  try {
    const { name, email, role = "member", password } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: "Le nom et l'e-mail sont obligatoires." });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      res.status(409).json({ message: "Un utilisateur avec cet e-mail existe déjà." });
      return;
    }

    const resolvedRole = String(role || "member").trim().toLowerCase();
    const finalRole = resolvedRole || "member";

    const rawPassword = password ? String(password) : generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const requestedPermissions = normalizePermissions(req.body.permissions);
    const permissions = requestedPermissions.length
      ? requestedPermissions
      : getDefaultPermissions(finalRole);

    const user = await createUser({
      organizationId: req.user.organizationId,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: finalRole,
      permissions,
    });

    res.status(201).json({
      message: "Utilisateur ajouté avec succès.",
      user: formatUser(user),
      initialPassword: rawPassword,
    });
  } catch (error) {
    next(error);
  }
};

const updateExistingUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      res.status(400).json({ message: "ID utilisateur invalide." });
      return;
    }

    if (userId === req.user.id && req.body.role && req.body.role !== req.user.role) {
      res.status(400).json({ message: "Vous ne pouvez pas modifier votre propre rôle." });
      return;
    }

    const values = {};
    if (req.body.name !== undefined) values.name = String(req.body.name).trim();
    if (req.body.role !== undefined) values.role = String(req.body.role).trim().toLowerCase();
    if (req.body.password !== undefined) values.password = await bcrypt.hash(String(req.body.password), 10);

    if (req.body.permissions !== undefined) {
      const requestedPermissions = normalizePermissions(req.body.permissions);
      // Prevent removing manageUsers from yourself
      if (userId === req.user.id && !requestedPermissions.includes("manageUsers") && req.user.role === "admin") {
        requestedPermissions.push("manageUsers");
      }
      values.permissions = requestedPermissions;
    }

    const user = await updateUser(req.user.organizationId, userId, values);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    res.json({ message: "Utilisateur mis à jour avec succès.", user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

const deleteExistingUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      res.status(400).json({ message: "ID utilisateur invalide." });
      return;
    }

    if (userId === req.user.id) {
      res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
      return;
    }

    const user = await deleteUser(req.user.organizationId, userId);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    res.json({ message: "Utilisateur supprimé avec succès.", user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrganizationUsers,
  createNewUser,
  updateExistingUser,
  deleteExistingUser,
};
