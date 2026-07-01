const { pool } = require("../config/db");

const getTableColumns = async (table) => {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = $1`,
    [table]
  );
  return new Set(result.rows.map((row) => row.column_name));
};

const withFallbackTable = async (handler) => {
  try {
    return await handler("expenses");
  } catch (error) {
    if (error.code === "42P01") {
      return await handler("disbursements");
    }
    throw error;
  }
};

const buildSelectQuery = (table, columns, { organizationId, id } = {}) => {
  const hasUserId = columns.has("user_id");
  const hasCreatedBy = columns.has("created_by_name");
  const hasMotif = columns.has("motif");
  const hasReason = columns.has("reason");
  const hasUtilisateur = columns.has("utilisateur");
  const hasUserName = columns.has("user_name");

  const userJoin = hasUserId ? "LEFT JOIN users u ON u.id = d.user_id" : "";
  const userLabelExpr = hasUserId
    ? hasCreatedBy
      ? "COALESCE(d.created_by_name, u.name, u.email)"
      : "COALESCE(u.name, u.email)"
    : hasCreatedBy
      ? "d.created_by_name"
      : hasUtilisateur
        ? "d.utilisateur"
        : hasUserName
          ? "d.user_name"
          : "'Utilisateur'";

  const motifExpr = hasMotif && hasReason
    ? "COALESCE(d.motif, d.reason)"
    : hasMotif
      ? "d.motif"
      : hasReason
        ? "d.reason"
        : "NULL";

  const transactionExpr = columns.has("transaction_date")
    ? "d.transaction_date"
    : columns.has("created_at")
      ? "d.created_at"
      : "NOW()";
  const createdAtExpr = columns.has("created_at") ? "d.created_at" : "NOW()";
  const updatedAtExpr = columns.has("updated_at") ? "d.updated_at" : createdAtExpr;

  const whereParts = ["d.organization_id = $1"];
  const values = [organizationId];
  if (id) {
    values.push(id);
    whereParts.push(`d.id = $${values.length}`);
  }

  const query = `SELECT d.id,
                        d.organization_id,
                        ${hasUserId ? "d.user_id" : "NULL"} AS user_id,
                        ${columns.has("created_by_name") ? "d.created_by_name" : "NULL"} AS created_by_name,
                        ${columns.has("amount") ? "d.amount" : "0"} AS amount,
                        ${columns.has("currency") ? "d.currency" : "'XAF'"} AS currency,
                        ${motifExpr} AS motif,
                        ${columns.has("description") ? "d.description" : "NULL"} AS description,
                        ${transactionExpr} AS transaction_date,
                        ${createdAtExpr} AS created_at,
                        ${updatedAtExpr} AS updated_at,
                        ${userLabelExpr} AS user_label
                 FROM ${table} d
                 ${userJoin}
                 WHERE ${whereParts.join(" AND ")}
                 ${id ? "" : `ORDER BY ${transactionExpr} DESC, ${createdAtExpr} DESC`}`;

  return { query, values };
};

const listDisbursements = async (req, res, next) => {
  try {
    const result = await withFallbackTable(async (table) => {
      const columns = await getTableColumns(table);
      const { query, values } = buildSelectQuery(table, columns, {
        organizationId: req.organizationId,
      });
      return pool.query(query, values);
    });

    res.json({ disbursements: result.rows });
  } catch (error) {
    next(error);
  }
};

const createDisbursement = async (req, res, next) => {
  try {
    const { amount, currency, motif, description, transactionDate } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      res.status(400).json({ message: "Le montant doit être un nombre positif." });
      return;
    }

    if (!motif || !String(motif).trim()) {
      res.status(400).json({ message: "Le motif est obligatoire." });
      return;
    }

    const createdByName = req.user?.name || req.user?.email || "Utilisateur";
    const normalizedCurrency = String(currency || "XAF").trim().toUpperCase() || "XAF";
    const normalizedDate = transactionDate ? new Date(transactionDate) : new Date();

    const result = await withFallbackTable(async (table) => {
      const columns = await getTableColumns(table);
      const cols = ["organization_id"];
      const values = [req.organizationId];

      const addColumn = (column, value) => {
        cols.push(column);
        values.push(value);
      };

      if (columns.has("user_id")) {
        addColumn("user_id", req.user?.id || null);
      }
      if (columns.has("created_by_name")) {
        addColumn("created_by_name", createdByName);
      }
      if (columns.has("utilisateur")) {
        addColumn("utilisateur", createdByName);
      }
      if (columns.has("user_name")) {
        addColumn("user_name", createdByName);
      }
      if (columns.has("amount")) {
        addColumn("amount", Number(amount));
      }
      if (columns.has("currency")) {
        addColumn("currency", normalizedCurrency);
      }
      if (columns.has("motif")) {
        addColumn("motif", String(motif).trim());
      }
      if (columns.has("reason")) {
        addColumn("reason", String(motif).trim());
      }
      if (columns.has("description")) {
        addColumn("description", description ? String(description).trim() : null);
      }
      if (columns.has("transaction_date")) {
        addColumn("transaction_date", normalizedDate);
      }

      const placeholders = values.map((_, index) => `$${index + 1}`);
      const insertQuery = `INSERT INTO ${table} (${cols.join(", ")})
                           VALUES (${placeholders.join(", ")})
                           RETURNING id`;

      const insertResult = await pool.query(insertQuery, values);
      const insertedId = insertResult.rows[0]?.id;

      const { query, values: selectValues } = buildSelectQuery(table, columns, {
        organizationId: req.organizationId,
        id: insertedId,
      });
      return pool.query(query, selectValues);
    });

    res.status(201).json({ disbursement: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateDisbursement = async (req, res, next) => {
  try {
    const disbursementId = Number(req.params.id);

    if (!Number.isInteger(disbursementId)) {
      res.status(400).json({ message: "ID décaissement invalide." });
      return;
    }

    const { amount, currency, motif, description, transactionDate } = req.body;

    const result = await withFallbackTable(async (table) => {
      const columns = await getTableColumns(table);
      const updates = [];
      const values = [];

      const addUpdate = (column, value) => {
        updates.push(`${column} = $${values.length + 1}`);
        values.push(value);
      };

      if (amount !== undefined && columns.has("amount")) {
        if (Number(amount) <= 0) {
          res.status(400).json({ message: "Le montant doit être un nombre positif." });
          return null;
        }
        addUpdate("amount", Number(amount));
      }

      if (currency !== undefined && columns.has("currency")) {
        addUpdate("currency", String(currency || "XAF").trim().toUpperCase() || "XAF");
      }

      if (motif !== undefined) {
        if (!String(motif).trim()) {
          res.status(400).json({ message: "Le motif est obligatoire." });
          return null;
        }
        if (columns.has("motif")) {
          addUpdate("motif", String(motif).trim());
        }
        if (columns.has("reason")) {
          addUpdate("reason", String(motif).trim());
        }
      }

      if (description !== undefined && columns.has("description")) {
        addUpdate("description", description ? String(description).trim() : null);
      }

      if (transactionDate !== undefined && columns.has("transaction_date")) {
        const normalizedDate = transactionDate ? new Date(transactionDate) : new Date();
        addUpdate("transaction_date", normalizedDate);
      }

      if (!updates.length) {
        res.status(400).json({ message: "Aucune valeur à mettre à jour." });
        return null;
      }

      values.push(req.organizationId);
      values.push(disbursementId);

      const updateQuery = `UPDATE ${table}
                           SET ${updates.join(", ")}, updated_at = NOW()
                           WHERE organization_id = $${values.length - 1} AND id = $${values.length}
                           RETURNING id`;
      const updateResult = await pool.query(updateQuery, values);
      const updatedId = updateResult.rows[0]?.id;

      if (!updatedId) {
        return { rows: [] };
      }

      const { query, values: selectValues } = buildSelectQuery(table, columns, {
        organizationId: req.organizationId,
        id: updatedId,
      });
      return pool.query(query, selectValues);
    });

    if (!result || !result.rows?.length) {
      if (!res.headersSent) {
        res.status(404).json({ message: "Décaissement introuvable." });
      }
      return;
    }

    res.json({ disbursement: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteDisbursement = async (req, res, next) => {
  try {
    const disbursementId = Number(req.params.id);

    if (!Number.isInteger(disbursementId)) {
      res.status(400).json({ message: "ID décaissement invalide." });
      return;
    }

    const result = await withFallbackTable(async (table) => {
      return pool.query(
        `DELETE FROM ${table}
         WHERE organization_id = $1 AND id = $2
         RETURNING id`,
        [req.organizationId, disbursementId]
      );
    });

    if (!result.rows[0]) {
      res.status(404).json({ message: "Décaissement introuvable." });
      return;
    }

    res.json({ message: "Décaissement supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDisbursements,
  createDisbursement,
  updateDisbursement,
  deleteDisbursement,
};
