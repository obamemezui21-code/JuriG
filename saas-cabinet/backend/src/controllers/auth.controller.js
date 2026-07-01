﻿const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const { generateToken } = require("../utils/jwt");
const {
  findUserByEmail,
  findUserById,
} = require("../models/user.model");
const { createOrganization } = require("../models/organization.model");
const { seedDefaultServices } = require("../models/service.model");
const { seedDefaultProcedures } = require("../models/procedure.model");

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
  const validPermissions = [
    "viewDashboard",
    "manageClients",
    "manageServices",
    "manageProcedures",
    "manageInvoices",
    "managePayments",
    "manageOrganization",
    "manageUsers",
  ];
  return permissions
    .map((p) => String(p || "").trim())
    .filter((p) => p && validPermissions.includes(p));
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
  };
};

const formatOrganization = (organization) => ({
  id: organization.id,
  name: organization.name,
  logoUrl: organization.logo_url || null,
  address: organization.address || null,
  phone: organization.phone || null,
  email: organization.email || null,
  themeKey: organization.theme_key || "blue",
});

const register = async (req, res, next) => {
  try {
    const { orgName, name, email, password } = req.body;

    if (!orgName || !name || !email || !password) {
      res.status(400).json({ message: "orgName, name, email et password sont obligatoires." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      res.status(409).json({ message: "Un utilisateur avec cet e-mail existe déjà." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dbClient = await pool.connect();

    try {
      await dbClient.query("BEGIN");

      const organization = await createOrganization(orgName.trim(), dbClient);
      await seedDefaultServices(organization.id, dbClient);
      await seedDefaultProcedures(organization.id, dbClient);

      const userResult = await dbClient.query(
        `INSERT INTO users (organization_id, name, email, password, role)
         VALUES ($1, $2, $3, $4, 'admin')
         RETURNING id, organization_id, name, email, role`,
        [organization.id, name.trim(), normalizedEmail, hashedPassword]
      );

      await dbClient.query("COMMIT");

      const user = userResult.rows[0];

      const formattedUser = formatUser(user);
      const token = generateToken({
        id: formattedUser.id,
        organizationId: formattedUser.organizationId,
        role: formattedUser.role,
        permissions: formattedUser.permissions,
      });


      res.status(201).json({
        message: "Cabinet et compte administrateur créés avec succès.",
        token,
        user: formatUser(user),
        organization: formatOrganization(organization),
      });
    } catch (error) {
      await dbClient.query("ROLLBACK");
      throw error;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email et password sont obligatoires." });
      return;
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    if (!user) {
      res.status(401).json({ message: "Identifiants invalides." });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ message: "Identifiants invalides." });
      return;
    }

    await seedDefaultServices(user.organization_id);
    await seedDefaultProcedures(user.organization_id);

    const formattedUser = formatUser(user);
    const token = generateToken({
      id: formattedUser.id,
      organizationId: formattedUser.organizationId,
      role: formattedUser.role,
      permissions: formattedUser.permissions,
    });

    res.json({
      token,
      user: formatUser(user),
      organization: formatOrganization({
        id: user.organization_id,
        name: user.organization_name,
        logo_url: user.logo_url,
        address: user.address,
        phone: user.phone,
        email: user.organization_email,
        theme_key: user.theme_key,
      }),
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    await seedDefaultServices(req.user.organizationId);
    await seedDefaultProcedures(req.user.organizationId);

    const user = await findUserById(req.user.id);

    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable." });
      return;
    }

    res.json({
      user: formatUser(user),
      organization: formatOrganization({
        id: user.organization_id,
        name: user.organization_name,
        logo_url: user.logo_url,
        address: user.address,
        phone: user.phone,
        email: user.organization_email,
        theme_key: user.theme_key,
      }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
};
