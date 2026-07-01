const { pool } = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.*, o.name as organization_name, o.logo_url, o.address, o.phone, o.email as organization_email, o.theme_key
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT u.*, o.name as organization_name, o.logo_url, o.address, o.phone, o.email as organization_email, o.theme_key
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0];
};

const listUsers = async (organizationId) => {
  const result = await pool.query(
    `SELECT id, organization_id, name, email, role, permissions, created_at, updated_at
     FROM users
     WHERE organization_id = $1
     ORDER BY name ASC`,
    [organizationId]
  );
  return result.rows;
};

const createUser = async ({ organizationId, name, email, password, role = "member", permissions = [] }) => {
  const result = await pool.query(
    `INSERT INTO users (organization_id, name, email, password, role, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, organization_id, name, email, role, permissions, created_at, updated_at`,
    [organizationId, name, email, password, role, JSON.stringify(permissions)]
  );
  return result.rows[0];
};

const updateUser = async (organizationId, userId, values = {}) => {
  const allowed = ["name", "role", "password", "permissions"];
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  Object.entries(values).forEach(([key, value]) => {
    if (!allowed.includes(key) || value === undefined) return;

    const paramValue = key === "permissions" ? JSON.stringify(value || []) : value;

    setClauses.push(`${key} = $${paramIndex}`);
    params.push(paramValue);
    paramIndex += 1;
  });

  if (setClauses.length === 0) {
    return null;
  }

  params.push(organizationId);
  params.push(userId);

  const query = `UPDATE users SET ${setClauses.join(", ")} , updated_at = NOW() WHERE organization_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING id, organization_id, name, email, role, permissions, created_at, updated_at`;
  const result = await pool.query(query, params);
  return result.rows[0];
};

const deleteUser = async (organizationId, userId) => {
  const result = await pool.query(
    `DELETE FROM users WHERE organization_id = $1 AND id = $2 RETURNING id`,
    [organizationId, userId]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};