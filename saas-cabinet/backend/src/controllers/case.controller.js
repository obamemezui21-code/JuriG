const { pool } = require("../config/db");
const { updateClientStatusFromPayments } = require("../models/client.model");

const assertClientBelongsToOrganization = async (organizationId, clientId) => {
  const result = await pool.query(
    `SELECT id
     FROM clients
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );

  return Boolean(result.rows[0]);
};

const assertCaseBelongsToOrganization = async (organizationId, caseId) => {
  const result = await pool.query(
    `SELECT id
     FROM cases
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, caseId]
  );

  return Boolean(result.rows[0]);
};

const listCases = async (req, res, next) => {
  try {
    const { status, clientId } = req.query;
    const values = [req.organizationId];

    let query = `
      SELECT c.id,
             c.organization_id,
             c.client_id,
             c.title,
             c.description,
             c.status,
             c.opened_at,
             c.closed_at,
             c.created_at,
             c.updated_at,
             cl.full_name AS client_name
      FROM cases c
      LEFT JOIN clients cl ON cl.id = c.client_id
      WHERE c.organization_id = $1
    `;

    if (status) {
      values.push(status);
      query += ` AND c.status = $${values.length}`;
    }

    if (clientId) {
      const normalizedClientId = Number(clientId);

      if (!Number.isInteger(normalizedClientId)) {
        res.status(400).json({ message: "Le paramètre clientId doit être un entier." });
        return;
      }

      values.push(normalizedClientId);
      query += ` AND c.client_id = $${values.length}`;
    }

    query += " ORDER BY c.created_at DESC";

    const result = await pool.query(query, values);
    res.json({ cases: result.rows });
  } catch (error) {
    next(error);
  }
};

const createCase = async (req, res, next) => {
  try {
    const { title, description, status, openedAt, closedAt, clientId } = req.body;

    if (!title) {
      res.status(400).json({ message: "title est obligatoire." });
      return;
    }

    const normalizedClientId = clientId === undefined || clientId === null ? null : Number(clientId);

    if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
      res.status(400).json({ message: "clientId doit être un entier." });
      return;
    }

    if (normalizedClientId !== null) {
      const belongs = await assertClientBelongsToOrganization(req.organizationId, normalizedClientId);

      if (!belongs) {
        res.status(400).json({ message: "clientId n'appartient pas à ce cabinet." });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO cases (organization_id, client_id, title, description, status, opened_at, closed_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7)
       RETURNING id, organization_id, client_id, title, description, status, opened_at, closed_at, created_at, updated_at`,
      [
        req.organizationId,
        normalizedClientId,
        String(title).trim(),
        description ? String(description).trim() : null,
        status ? String(status).trim() : "open",
        openedAt || null,
        closedAt || null,
      ]
    );

    if (normalizedClientId !== null) {
      await updateClientStatusFromPayments(req.organizationId, normalizedClientId);
    }

    res.status(201).json({
      message: "Dossier créé avec succès.",
      case: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);

    if (!Number.isInteger(caseId)) {
      res.status(400).json({ message: "ID dossier invalide." });
      return;
    }

    const result = await pool.query(
      `SELECT id, organization_id, client_id, title, description, status, opened_at, closed_at, created_at, updated_at
       FROM cases
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, caseId]
    );

    const row = result.rows[0];

    if (!row) {
      res.status(404).json({ message: "Dossier introuvable." });
      return;
    }

    res.json({ case: row });
  } catch (error) {
    next(error);
  }
};

const updateCase = async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);

    if (!Number.isInteger(caseId)) {
      res.status(400).json({ message: "ID dossier invalide." });
      return;
    }

    const updates = [];
    const values = [];

    if (req.body.title !== undefined) {
      values.push(String(req.body.title).trim());
      updates.push(`title = $${values.length}`);
    }

    if (req.body.description !== undefined) {
      values.push(req.body.description ? String(req.body.description).trim() : null);
      updates.push(`description = $${values.length}`);
    }

    if (req.body.status !== undefined) {
      values.push(String(req.body.status).trim());
      updates.push(`status = $${values.length}`);
    }

    if (req.body.openedAt !== undefined) {
      values.push(req.body.openedAt || null);
      updates.push(`opened_at = $${values.length}`);
    }

    if (req.body.closedAt !== undefined) {
      values.push(req.body.closedAt || null);
      updates.push(`closed_at = $${values.length}`);
    }

    if (req.body.clientId !== undefined) {
      const normalizedClientId = req.body.clientId === null ? null : Number(req.body.clientId);

      if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
        res.status(400).json({ message: "clientId doit être un entier." });
        return;
      }

      if (normalizedClientId !== null) {
        const belongs = await assertClientBelongsToOrganization(req.organizationId, normalizedClientId);

        if (!belongs) {
          res.status(400).json({ message: "clientId n'appartient pas à ce cabinet." });
          return;
        }
      }

      values.push(normalizedClientId);
      updates.push(`client_id = $${values.length}`);
    }

    if (!updates.length) {
      res.status(400).json({ message: "Aucune valeur fournie à mettre à jour." });
      return;
    }

    values.push(req.organizationId);
    values.push(caseId);

    const previousCaseResult = await pool.query(
      `SELECT client_id
       FROM cases
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, caseId]
    );

    const previousCase = previousCaseResult.rows[0] || null;

    const result = await pool.query(
      `UPDATE cases
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE organization_id = $${values.length - 1} AND id = $${values.length}
       RETURNING id, organization_id, client_id, title, description, status, opened_at, closed_at, created_at, updated_at`,
      values
    );

    const row = result.rows[0];

    if (!row) {
      res.status(404).json({ message: "Dossier introuvable." });
      return;
    }

    const affectedClientIds = new Set(
      [previousCase?.client_id, row.client_id].filter((value) => Number.isInteger(Number(value)))
    );
    for (const affectedClientId of affectedClientIds) {
      await updateClientStatusFromPayments(req.organizationId, Number(affectedClientId));
    }

    res.json({
      message: "Dossier mis à jour avec succès.",
      case: row,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCase = async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);

    if (!Number.isInteger(caseId)) {
      res.status(400).json({ message: "ID dossier invalide." });
      return;
    }

    const existingCaseResult = await pool.query(
      `SELECT client_id
       FROM cases
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, caseId]
    );

    const result = await pool.query(
      `DELETE FROM cases
       WHERE organization_id = $1 AND id = $2
       RETURNING id, client_id`,
      [req.organizationId, caseId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ message: "Dossier introuvable." });
      return;
    }

    const deletedClientId = result.rows[0].client_id ?? existingCaseResult.rows[0]?.client_id ?? null;
    if (Number.isInteger(Number(deletedClientId))) {
      await updateClientStatusFromPayments(req.organizationId, Number(deletedClientId));
    }

    res.json({ message: "Dossier supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

const uploadCaseDocuments = async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);

    if (!Number.isInteger(caseId)) {
      res.status(400).json({ message: "ID dossier invalide." });
      return;
    }

    const belongs = await assertCaseBelongsToOrganization(req.organizationId, caseId);
    if (!belongs) {
      res.status(404).json({ message: "Dossier introuvable." });
      return;
    }

    const files = req.files || [];
    if (!files.length) {
      res.status(400).json({ message: "Aucun fichier reçu." });
      return;
    }

    const labelsInput = req.body.labels;
    const labels = Array.isArray(labelsInput)
      ? labelsInput
      : labelsInput
        ? [labelsInput]
        : [];

    const documents = files.map((file, index) => ({
      label: String(labels[index] || `Piece ${index + 1}`).trim(),
      fileName: file.originalname,
      url: `/uploads/${file.filename}`,
    }));

    const caseResult = await pool.query(
      `SELECT client_id
       FROM cases
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, caseId]
    );
    const clientId = caseResult.rows[0]?.client_id ?? null;
    if (Number.isInteger(Number(clientId))) {
      await updateClientStatusFromPayments(req.organizationId, Number(clientId));
    }

    res.json({
      message: "Pièces du dossier téléversées avec succès.",
      documents,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCases,
  createCase,
  getCaseById,
  updateCase,
  deleteCase,
  uploadCaseDocuments,
};
