const { pool } = require("../config/db");

const createOrganization = async (name, dbClient = pool) => {
  const result = await dbClient.query(
    `INSERT INTO organizations (name)
     VALUES ($1)
     RETURNING id, name, logo_url, address, phone, email, theme_key, created_at, updated_at`,
    [name]
  );

  return result.rows[0];
};

const getOrganizationById = async (organizationId) => {
  const result = await pool.query(
    `SELECT id, name, logo_url, address, phone, email, theme_key, created_at, updated_at
     FROM organizations
     WHERE id = $1
     LIMIT 1`,
    [organizationId]
  );

  return result.rows[0] || null;
};

const updateOrganization = async (organizationId, payload) => {
  const fields = [];
  const values = [];

  if (payload.name !== undefined) {
    values.push(payload.name);
    fields.push(`name = $${values.length}`);
  }

  if (payload.logoUrl !== undefined) {
    values.push(payload.logoUrl);
    fields.push(`logo_url = $${values.length}`);
  }

  if (payload.address !== undefined) {
    values.push(payload.address || null);
    fields.push(`address = $${values.length}`);
  }

  if (payload.phone !== undefined) {
    values.push(payload.phone || null);
    fields.push(`phone = $${values.length}`);
  }

  if (payload.email !== undefined) {
    values.push(payload.email || null);
    fields.push(`email = $${values.length}`);
  }

  if (payload.themeKey !== undefined) {
    values.push(payload.themeKey);
    fields.push(`theme_key = $${values.length}`);
  }

  if (!fields.length) {
    return getOrganizationById(organizationId);
  }

  values.push(organizationId);

  const result = await pool.query(
    `UPDATE organizations
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, name, logo_url, address, phone, email, theme_key, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

module.exports = {
  createOrganization,
  getOrganizationById,
  updateOrganization,
};
