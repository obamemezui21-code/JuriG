const { pool } = require("../config/db");

const DEFAULT_PROCEDURES = [
  {
    title: "Constitution de societe",
    montant: 150000,
    details: "Preparation du dossier, redaction des actes et formalites d'immatriculation.",
  },
  {
    title: "Modification des statuts",
    montant: 120000,
    details: "Mise a jour des statuts, proces-verbal et formalites administratives.",
  },
  {
    title: "Recouvrement de creance",
    montant: 100000,
    details: "Mise en demeure, negociations et suivi precontentieux.",
  },
  {
    title: "Redaction de contrat commercial",
    montant: 85000,
    details: "Redaction et securisation juridique des contrats commerciaux.",
  },
  {
    title: "Bail commercial",
    montant: 90000,
    details: "Redaction, revision ou analyse d'un bail commercial.",
  },
  {
    title: "Cession de parts sociales",
    montant: 175000,
    details: "Preparation de l'acte, verification des pieces et formalites.",
  },
  {
    title: "Creation d'association",
    montant: 70000,
    details: "Accompagnement a la creation et au depot du dossier d'association.",
  },
  {
    title: "Depot de marque",
    montant: 110000,
    details: "Recherche d'anteriorite, depot et suivi initial de la marque.",
  },
  {
    title: "Regularisation fonciere",
    montant: 200000,
    details: "Verification documentaire et accompagnement des formalites foncieres.",
  },
  {
    title: "Procedure de divorce",
    montant: 250000,
    details: "Ouverture du dossier, redaction des actes et accompagnement procedural.",
  },
  {
    title: "Succession et partage",
    montant: 180000,
    details: "Assistance pour ouverture de succession et opérations de partage.",
  },
  {
    title: "Contentieux du travail",
    montant: 130000,
    details: "Assistance pour litiges employeur-salarié et procédure sociale.",
  },
];

const normalizeProcedureTitle = (value) => String(value || "").trim().toLowerCase();

const listProcedures = async (organizationId, options = {}) => {
  const status = options.status ? String(options.status).trim() : "";
  const values = [organizationId];

  let query = `
    SELECT p.id,
           p.organization_id,
           p.client_id,
           p.service_id,
           p.title,
           p.montant,
           p.details,
           p.status,
           p.priority,
           p.expected_deadline,
           p.completed_at,
           p.created_at,
           p.updated_at,
           c.full_name AS client_name,
           s.name AS service_name
    FROM procedure_requests p
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN legal_services s ON s.id = p.service_id
    WHERE p.organization_id = $1
  `;

  if (status) {
    values.push(status);
    query += ` AND p.status = $${values.length}`;
  }

  query += " ORDER BY p.created_at DESC";

  const result = await pool.query(query, values);
  return result.rows;
};

const getProcedureById = async (organizationId, procedureId) => {
  const result = await pool.query(
    `SELECT id, organization_id, client_id, service_id, title, montant, details, status, priority, expected_deadline, completed_at, created_at, updated_at
     FROM procedure_requests
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, procedureId]
  );

  return result.rows[0] || null;
};

const createProcedure = async ({
  organizationId,
  clientId,
  serviceId,
  title,
  montant,
  details,
  status,
  priority,
  expectedDeadline,
}) => {
  const result = await pool.query(
    `INSERT INTO procedure_requests (
       organization_id, client_id, service_id, title, montant, details, status, priority, expected_deadline
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, organization_id, client_id, service_id, title, montant, details, status, priority, expected_deadline, completed_at, created_at, updated_at`,
    [
      organizationId,
      clientId || null,
      serviceId || null,
      title,
      montant || 0,
      details || null,
      status || "nouvelle",
      priority || "normale",
      expectedDeadline || null,
    ]
  );

  return result.rows[0];
};

const updateProcedure = async (organizationId, procedureId, payload) => {
  const updates = [];
  const values = [];

  if (payload.title !== undefined) {
    values.push(payload.title);
    updates.push(`title = $${values.length}`);
  }

  if (payload.details !== undefined) {
    values.push(payload.details || null);
    updates.push(`details = $${values.length}`);
  }

  if (payload.montant !== undefined) {
    values.push(payload.montant || 0);
    updates.push(`montant = $${values.length}`);
  }

  if (payload.status !== undefined) {
    values.push(payload.status);
    updates.push(`status = $${values.length}`);
  }

  if (payload.priority !== undefined) {
    values.push(payload.priority);
    updates.push(`priority = $${values.length}`);
  }

  if (payload.expectedDeadline !== undefined) {
    values.push(payload.expectedDeadline || null);
    updates.push(`expected_deadline = $${values.length}`);
  }

  if (payload.completedAt !== undefined) {
    values.push(payload.completedAt || null);
    updates.push(`completed_at = $${values.length}`);
  }

  if (payload.clientId !== undefined) {
    values.push(payload.clientId || null);
    updates.push(`client_id = $${values.length}`);
  }

  if (payload.serviceId !== undefined) {
    values.push(payload.serviceId || null);
    updates.push(`service_id = $${values.length}`);
  }

  if (!updates.length) {
    return getProcedureById(organizationId, procedureId);
  }

  values.push(organizationId);
  values.push(procedureId);

  const result = await pool.query(
    `UPDATE procedure_requests
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE organization_id = $${values.length - 1} AND id = $${values.length}
     RETURNING id, organization_id, client_id, service_id, title, montant, details, status, priority, expected_deadline, completed_at, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

const deleteProcedure = async (organizationId, procedureId) => {
  const result = await pool.query(
    `DELETE FROM procedure_requests
     WHERE organization_id = $1 AND id = $2
     RETURNING id`,
    [organizationId, procedureId]
  );

  return Boolean(result.rows[0]);
};

const seedDefaultProcedures = async (organizationId, dbClient = pool) => {
  const existing = await dbClient.query(
    `SELECT title
     FROM procedure_requests
     WHERE organization_id = $1`,
    [organizationId]
  );

  const existingTitles = new Set(existing.rows.map((row) => normalizeProcedureTitle(row.title)));

  for (const procedure of DEFAULT_PROCEDURES) {
    if (existingTitles.has(normalizeProcedureTitle(procedure.title))) {
      continue;
    }

    await dbClient.query(
      `INSERT INTO procedure_requests (
         organization_id, title, montant, details, status, priority
       )
       VALUES ($1, $2, $3, $4, 'nouvelle', 'normale')`,
      [organizationId, procedure.title, procedure.montant, procedure.details]
    );

    existingTitles.add(normalizeProcedureTitle(procedure.title));
  }
};

module.exports = {
  listProcedures,
  getProcedureById,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  seedDefaultProcedures,
};
