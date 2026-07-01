const { pool } = require("../config/db");

const DEFAULT_SERVICES = [
  "Consultation juridique",
  "Creation entreprise",
  "Contentieux",
  "Probleme d'acte de naissance",
  "Certificat de nationalite",
  "Garde juridique",
  "Delegation de l'autorite parentale",
  "Curatelle",
  "Tutelle",
  "Jugement d'homologation",
  "Jugement suppletif d'acte de deces",
  "Regularisation fonciere",
  "Carte de sejour",
  "Autorisation d'entree et sortie",
  "Passeport",
  "Immatriculation CNSS et CNAMGS",
  "Cotisations sociales",
  "Declaration fiscale",
  "Creation des associations",
  "Redaction des actes sous-seing prive",
  "Redaction des contrats",
];

const normalizeServiceName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const listServices = async (organizationId, options = {}) => {
  const search = String(options.search || "").trim();
  const includeInactive = options.includeInactive === true;
  const values = [organizationId];

  let query = `
    SELECT id, organization_id, name, category, description, dossier_elements, procedure_steps, base_price, is_active, created_at, updated_at
    FROM legal_services
    WHERE organization_id = $1
  `;

  if (!includeInactive) {
    query += " AND is_active = TRUE";
  }

  if (search) {
    values.push(`%${search}%`);
    query += ` AND (name ILIKE $${values.length} OR COALESCE(category, '') ILIKE $${values.length})`;
  }

  query += " ORDER BY name ASC";

  const result = await pool.query(query, values);
  return result.rows;
};

const getServiceById = async (organizationId, serviceId) => {
  const result = await pool.query(
    `SELECT id, organization_id, name, category, description, dossier_elements, procedure_steps, base_price, is_active, created_at, updated_at
     FROM legal_services
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, serviceId]
  );

  return result.rows[0] || null;
};

const createService = async ({
  organizationId,
  name,
  category,
  description,
  dossierElements,
  procedureSteps,
  basePrice,
}) => {
  const result = await pool.query(
    `INSERT INTO legal_services (organization_id, name, category, description, dossier_elements, procedure_steps, base_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, organization_id, name, category, description, dossier_elements, procedure_steps, base_price, is_active, created_at, updated_at`,
    [
      organizationId,
      name,
      category || null,
      description || null,
      dossierElements || null,
      procedureSteps || null,
      basePrice || 0,
    ]
  );

  return result.rows[0];
};

const updateService = async (organizationId, serviceId, payload) => {
  const updates = [];
  const values = [];

  if (payload.name !== undefined) {
    values.push(payload.name);
    updates.push(`name = $${values.length}`);
  }

  if (payload.category !== undefined) {
    values.push(payload.category || null);
    updates.push(`category = $${values.length}`);
  }

  if (payload.description !== undefined) {
    values.push(payload.description || null);
    updates.push(`description = $${values.length}`);
  }

  if (payload.dossierElements !== undefined) {
    values.push(payload.dossierElements || null);
    updates.push(`dossier_elements = $${values.length}`);
  }

  if (payload.procedureSteps !== undefined) {
    values.push(payload.procedureSteps || null);
    updates.push(`procedure_steps = $${values.length}`);
  }

  if (payload.basePrice !== undefined) {
    values.push(payload.basePrice);
    updates.push(`base_price = $${values.length}`);
  }

  if (payload.isActive !== undefined) {
    values.push(Boolean(payload.isActive));
    updates.push(`is_active = $${values.length}`);
  }

  if (!updates.length) {
    return getServiceById(organizationId, serviceId);
  }

  values.push(organizationId);
  values.push(serviceId);

  const result = await pool.query(
    `UPDATE legal_services
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE organization_id = $${values.length - 1} AND id = $${values.length}
     RETURNING id, organization_id, name, category, description, dossier_elements, procedure_steps, base_price, is_active, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

const archiveService = async (organizationId, serviceId) => {
  return updateService(organizationId, serviceId, { isActive: false });
};

const deleteService = async (organizationId, serviceId) => {
  const result = await pool.query(
    `DELETE FROM legal_services
     WHERE organization_id = $1 AND id = $2
     RETURNING id, organization_id, name, category, description, dossier_elements, procedure_steps, base_price, is_active, created_at, updated_at`,
    [organizationId, serviceId]
  );

  return result.rows[0] || null;
};

const seedDefaultServices = async (organizationId, dbClient = pool) => {
  const existing = await dbClient.query(
    `SELECT name
     FROM legal_services
     WHERE organization_id = $1`,
    [organizationId]
  );

  const existingNames = new Set(
    existing.rows.map((row) => normalizeServiceName(row.name))
  );

  for (const name of DEFAULT_SERVICES) {
    if (existingNames.has(normalizeServiceName(name))) {
      continue;
    }

    await dbClient.query(
      `INSERT INTO legal_services (organization_id, name, category, description, base_price)
       VALUES ($1, $2, 'Procedure', NULL, 0)`,
      [organizationId, name]
    );

    existingNames.add(normalizeServiceName(name));
  }
};

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  archiveService,
  deleteService,
  seedDefaultServices,
};
