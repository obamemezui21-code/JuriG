﻿const { pool } = require("../config/db");

const CLIENT_STATUS_IN_PROGRESS = "en_cours";
const CLIENT_STATUS_URGENT = "urgent";
const CLIENT_STATUS_COMPLETED = "termine";
const CLIENT_DOCUMENT_TITLE_PREFIX = "document";
const DOCUMENT_URL_PATTERN = /^(?:https?:\/\/|\/uploads\/)/i;

const normalizeClientStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === CLIENT_STATUS_COMPLETED) {
    return CLIENT_STATUS_COMPLETED;
  }
  if (normalized === CLIENT_STATUS_URGENT || normalized === "pret") {
    return CLIENT_STATUS_URGENT;
  }
  return CLIENT_STATUS_IN_PROGRESS;
};

const isPiecesHeader = (value) => {
  const normalized = normalizeLoose(value);
  return normalized === "piecesafournir" || normalized === "picesfournir";
};

const normalizeLoose = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const isDocumentsHeader = (value) => {
  const normalized = normalizeLoose(value);
  return normalized === "documentsteleverses" || normalized === "documentstlverss";
};

const parseUploadedPieceEntriesFromDescription = (description) => {
  const lines = String(description || "").split(/\r?\n/);
  let inDocumentsBlock = false;
  let inRequiredPiecesBlock = false;
  const entries = [];

  lines.forEach((line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return;
    }

    if (isPiecesHeader(trimmed)) {
      inRequiredPiecesBlock = true;
      inDocumentsBlock = false;
      return;
    }

    if (isDocumentsHeader(trimmed)) {
      inDocumentsBlock = true;
      inRequiredPiecesBlock = false;
      return;
    }

    if ((inDocumentsBlock || inRequiredPiecesBlock) && /:$/i.test(trimmed) && !trimmed.startsWith("-")) {
      inDocumentsBlock = false;
      inRequiredPiecesBlock = false;
      return;
    }

    if ((!inDocumentsBlock && !inRequiredPiecesBlock) || !trimmed.startsWith("-")) {
      return;
    }

    const raw = trimmed.replace(/^\-\s*/, "");
    const separatorIndex = raw.indexOf(":");
    const value = separatorIndex > -1 ? raw.slice(separatorIndex + 1).trim() : "";
    const [urlPart] = String(value || "").split("|");
    const url = String(urlPart || "").trim();

    entries.push({
      submitted: Boolean(url) && url.toLowerCase() !== "non fourni" && DOCUMENT_URL_PATTERN.test(url),
    });
  });

  return entries;
};

const parseRequiredPieceLabelsFromDescription = (description) => {
  const lines = String(description || "").split(/\r?\n/);
  let inPiecesBlock = false;
  const labels = [];

  lines.forEach((line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return;
    }

    if (isPiecesHeader(trimmed)) {
      inPiecesBlock = true;
      return;
    }

    if (isDocumentsHeader(trimmed)) {
      inPiecesBlock = false;
      return;
    }

    if (!inPiecesBlock || !trimmed.startsWith("-")) {
      return;
    }

    const raw = trimmed.replace(/^\-\s*/, "");
    const separatorIndex = raw.indexOf(":");
    const label = (separatorIndex > 0 ? raw.slice(0, separatorIndex) : raw).trim();
    if (!label) {
      return;
    }

    labels.push(label);
  });

  return labels.filter((label, index, array) => array.indexOf(label) === index);
};

const computeClientDocumentProgress = async (organizationId, clientId, dbClient = pool) => {
  const clientResult = await dbClient.query(
    `SELECT identity_document_url
     FROM clients
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );

  const clientRow = clientResult.rows[0] || {};
  const hasIdentityDocument = Boolean(String(clientRow.identity_document_url || "").trim());

  const casesResult = await dbClient.query(
    `SELECT title, description
     FROM cases
     WHERE organization_id = $1 AND client_id = $2`,
    [organizationId, clientId]
  );

  const requiredLabels = new Set();
  const submittedLabels = new Set();

  casesResult.rows.forEach((item) => {
    const title = String(item.title || "").trim().toLowerCase();
    if (!title.startsWith(CLIENT_DOCUMENT_TITLE_PREFIX)) {
      return;
    }

    parseRequiredPieceLabelsFromDescription(item.description || "").forEach((label) => {
      requiredLabels.add(label);
    });

    parseUploadedPieceEntriesFromDescription(item.description || "").forEach((entry) => {
      if (entry.submitted && entry.label) {
        submittedLabels.add(entry.label);
      }
    });
  });

  if (hasIdentityDocument) {
    submittedLabels.add("Pièce d'identité");
  }

  const totalRequiredDocuments = requiredLabels.size;
  const submittedRequiredDocuments = totalRequiredDocuments
    ? Array.from(requiredLabels).filter((label) => submittedLabels.has(label)).length
    : 0;
  const hasSubmittedDocument = hasIdentityDocument || submittedLabels.size > 0;
  const documentCompletionRate = totalRequiredDocuments > 0 ? submittedRequiredDocuments / totalRequiredDocuments : 1;

  return {
    totalRequiredDocuments,
    submittedRequiredDocuments,
    documentCompletionRate,
    hasSubmittedDocument,
  };
};

const hasAnySubmittedClientDocument = async (organizationId, clientId, dbClient = pool) => {
  const progress = await computeClientDocumentProgress(organizationId, clientId, dbClient);
  return progress.hasSubmittedDocument;
};

const createClient = async ({
  organizationId,
  fullName,
  email,
  phone,
  birthDate,
  birthPlace,
  nationality,
  photoUrl,
  identityDocumentUrl,
  serviceId,
  notes,
}) => {
  const result = await pool.query(
    `INSERT INTO clients (organization_id, service_id, full_name, email, phone, birth_date, birth_place, nationality, photo_url, identity_document_url, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      organizationId,
      serviceId || null,
      fullName,
      email || null,
      phone || null,
      birthDate || null,
      birthPlace || null,
      nationality || null,
      photoUrl || null,
      identityDocumentUrl || null,
      notes || null,
    ]
  );

  return getClientById(organizationId, result.rows[0].id);
};

const listClients = async (organizationId, search = "") => {
  const normalizedSearch = String(search || "").trim();
  const values = [organizationId];

  let query = `
    SELECT c.id,
           c.organization_id,
           c.service_id,
           s.name AS service_name,
           c.full_name,
           c.email,
           c.phone,
           c.birth_date,
           c.birth_place,
           c.nationality,
           c.photo_url,
           c.identity_document_url,
           c.notes,
           CASE
             WHEN LOWER(COALESCE(c.status, '')) = 'termine' THEN 'termine'
             WHEN LOWER(COALESCE(c.status, '')) IN ('urgent', 'pret') THEN 'urgent'
             ELSE 'en_cours'
           END AS status,
           c.created_at,
           c.updated_at
    FROM clients c
    LEFT JOIN legal_services s ON s.id = c.service_id
    WHERE c.organization_id = $1
  `;

  if (normalizedSearch) {
    values.push(`%${normalizedSearch}%`);
    query += `
      AND (
        full_name ILIKE $2
        OR COALESCE(c.email, '') ILIKE $2
        OR COALESCE(c.phone, '') ILIKE $2
      )
    `;
  }

  query += " ORDER BY c.created_at DESC";

  const result = await pool.query(query, values);
  return result.rows;
};

const getClientById = async (organizationId, clientId) => {
  const result = await pool.query(
    `SELECT c.id,
            c.organization_id,
            c.service_id,
            s.name AS service_name,
            c.full_name,
            c.email,
            c.phone,
            c.birth_date,
            c.birth_place,
            c.nationality,
            c.photo_url,
            c.identity_document_url,
            c.notes,
            CASE
              WHEN LOWER(COALESCE(c.status, '')) = 'termine' THEN 'termine'
              WHEN LOWER(COALESCE(c.status, '')) IN ('urgent', 'pret') THEN 'urgent'
              ELSE 'en_cours'
            END AS status,
            c.created_at,
            c.updated_at
     FROM clients c
     LEFT JOIN legal_services s ON s.id = c.service_id
     WHERE c.organization_id = $1 AND c.id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );

  return result.rows[0] || null;
};

const updateClient = async (organizationId, clientId, payload) => {
  const fields = [];
  const values = [];

  if (payload.fullName !== undefined) {
    values.push(payload.fullName);
    fields.push(`full_name = $${values.length}`);
  }

  if (payload.email !== undefined) {
    values.push(payload.email || null);
    fields.push(`email = $${values.length}`);
  }

  if (payload.phone !== undefined) {
    values.push(payload.phone || null);
    fields.push(`phone = $${values.length}`);
  }

  if (payload.birthDate !== undefined) {
    values.push(payload.birthDate || null);
    fields.push(`birth_date = $${values.length}`);
  }

  if (payload.birthPlace !== undefined) {
    values.push(payload.birthPlace || null);
    fields.push(`birth_place = $${values.length}`);
  }

  if (payload.nationality !== undefined) {
    values.push(payload.nationality || null);
    fields.push(`nationality = $${values.length}`);
  }

  if (payload.photoUrl !== undefined) {
    values.push(payload.photoUrl || null);
    fields.push(`photo_url = $${values.length}`);
  }

  if (payload.identityDocumentUrl !== undefined) {
    values.push(payload.identityDocumentUrl || null);
    fields.push(`identity_document_url = $${values.length}`);
  }

  if (payload.notes !== undefined) {
    values.push(payload.notes || null);
    fields.push(`notes = $${values.length}`);
  }

  if (payload.serviceId !== undefined) {
    values.push(payload.serviceId || null);
    fields.push(`service_id = $${values.length}`);
  }

  if (!fields.length) {
    return getClientById(organizationId, clientId);
  }

  values.push(organizationId);
  values.push(clientId);

  const result = await pool.query(
    `UPDATE clients
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE organization_id = $${values.length - 1} AND id = $${values.length}
     RETURNING id`,
    values
  );

  if (!result.rows[0]) {
    return null;
  }

  return getClientById(organizationId, result.rows[0].id);
};

const deleteClient = async (organizationId, clientId) => {
  const result = await pool.query(
    `DELETE FROM clients
     WHERE organization_id = $1 AND id = $2
     RETURNING id`,
    [organizationId, clientId]
  );

  return result.rows[0] || null;
};

const updateClientStatusFromPayments = async (organizationId, clientId, dbClient = pool) => {
  const clientResult = await dbClient.query(
    `SELECT status
     FROM clients
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );

  const currentClient = clientResult.rows[0] || null;
  if (!currentClient) {
    return {
      totalDue: 0,
      totalPaid: 0,
      paymentCoverageRate: 0,
      totalRequiredDocuments: 0,
      submittedRequiredDocuments: 0,
      documentCompletionRate: 0,
      hasSubmittedDocument: false,
      status: null,
    };
  }

  const totalsResult = await dbClient.query(
    `SELECT
       COALESCE(SUM(p.montant), 0)::NUMERIC AS total_due,
       (
         SELECT COALESCE(SUM(amount), 0)::NUMERIC
         FROM payments
         WHERE organization_id = $1
           AND client_id = $2
           AND status IN ('paid', 'partial')
       ) AS total_paid
     FROM client_procedure_selections cps
     JOIN procedure_requests p ON p.id = cps.procedure_id
     WHERE cps.organization_id = $1 AND cps.client_id = $2`,
    [organizationId, clientId]
  );

  const totalsRow = totalsResult.rows[0] || {};
  const totalDue = Number(totalsRow.total_due || 0);
  const totalPaid = Number(totalsRow.total_paid || 0);
  const paymentCoverageRate = totalDue > 0 ? totalPaid / totalDue : 0;
  const normalizedCurrentStatus = normalizeClientStatus(currentClient.status);
  const documentProgress = await computeClientDocumentProgress(organizationId, clientId, dbClient);

  let nextStatus = CLIENT_STATUS_IN_PROGRESS;
  if (normalizedCurrentStatus === CLIENT_STATUS_COMPLETED) {
    nextStatus = CLIENT_STATUS_COMPLETED;
  } else if (paymentCoverageRate >= 0.7 && documentProgress.documentCompletionRate >= 1) {
    nextStatus = CLIENT_STATUS_URGENT;
  }

  await dbClient.query(
    `UPDATE clients
     SET status = $1, updated_at = NOW()
     WHERE organization_id = $2 AND id = $3`,
    [nextStatus, organizationId, clientId]
  );

  return {
    totalDue,
    totalPaid,
    paymentCoverageRate,
    totalRequiredDocuments: documentProgress.totalRequiredDocuments,
    submittedRequiredDocuments: documentProgress.submittedRequiredDocuments,
    documentCompletionRate: documentProgress.documentCompletionRate,
    hasSubmittedDocument: documentProgress.hasSubmittedDocument,
    status: nextStatus,
  };
};

const listClientProcedureSelections = async (organizationId, clientId) => {
  const result = await pool.query(
    `SELECT procedure_id
     FROM client_procedure_selections
     WHERE organization_id = $1 AND client_id = $2
     ORDER BY procedure_id ASC`,
    [organizationId, clientId]
  );

  return result.rows.map((row) => row.procedure_id);
};

const replaceClientProcedureSelections = async (organizationId, clientId, procedureIds, dbClient = pool) => {
  await dbClient.query(
    `DELETE FROM client_procedure_selections
     WHERE organization_id = $1 AND client_id = $2`,
    [organizationId, clientId]
  );

  if (!procedureIds || procedureIds.length === 0) {
    return;
  }

  const values = [];
  const placeholders = procedureIds.map((procedureId, index) => {
    const baseIndex = index * 3;
    values.push(organizationId, clientId, procedureId);
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
  });

  await dbClient.query(
    `INSERT INTO client_procedure_selections (organization_id, client_id, procedure_id)
     VALUES ${placeholders.join(", ")}`,
    values
  );
};

module.exports = {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
  listClientProcedureSelections,
  replaceClientProcedureSelections,
  updateClientStatusFromPayments,
};
