const { pool } = require("../config/db");

const { updateClientStatusFromPayments } = require("../models/client.model");

const PAID_STATUSES = new Set(["paid", "partial"]);

const normalizeStatus = (value) => String(value || "pending").trim().toLowerCase();

const computeInvoiceStatus = ({ totalAmount, paidAmount }) => {
  const safeTotal = Number(totalAmount || 0);
  const safePaid = Number(paidAmount || 0);

  if (safeTotal > 0 && safePaid >= safeTotal) {
    return "paid";
  }
  if (safePaid > 0) {
    return "partial";
  }
  return "draft";
};

const fetchClientInvoiceSnapshot = async (organizationId, clientId) => {
  const clientResult = await pool.query(
    `SELECT service_id
     FROM clients
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, clientId]
  );
  const serviceId = clientResult.rows[0]?.service_id || null;

  const proceduresResult = await pool.query(
    `SELECT p.title, p.montant
     FROM client_procedure_selections cps
     JOIN procedure_requests p ON p.id = cps.procedure_id
     WHERE cps.organization_id = $1 AND cps.client_id = $2
     ORDER BY p.id ASC`,
    [organizationId, clientId]
  );

  const rows = proceduresResult.rows || [];
  const totalDue = rows.reduce((sum, row) => sum + Number(row.montant || 0), 0);
  const selectedElements = rows.length
    ? rows
        .map((row) => `${String(row.title || "Procedure").trim()}::${Number(row.montant || 0)}`)
        .join("\n")
    : null;

  return { totalDue, selectedElements, serviceId };
};

const findActiveInvoice = async (organizationId, clientId, caseId) => {
  const values = [organizationId, clientId];
  let query = `
    SELECT id, total_amount, paid_amount, status
    FROM invoices
    WHERE organization_id = $1 AND client_id = $2
      AND status IN ('draft', 'sent', 'partial', 'overdue')
  `;

  if (caseId) {
    values.push(caseId);
    query += ` AND case_id = $${values.length}`;
  } else {
    query += " AND case_id IS NULL";
  }

  query += " ORDER BY created_at DESC LIMIT 1";

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

const createInvoiceForClient = async ({
  organizationId,
  clientId,
  caseId,
  issueDate,
  totalAmount,
  selectedElements,
  serviceId,
}) => {
  const tmpInvoiceNumber = `TMP-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;
  const inserted = await pool.query(
    `INSERT INTO invoices (
       organization_id, client_id, case_id, service_id, invoice_number, currency, status, issue_date,
       total_amount, paid_amount, selected_elements, last_paid_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, issue_date`,
    [
      organizationId,
      clientId,
      caseId || null,
      serviceId || null,
      tmpInvoiceNumber,
      "XAF",
      "draft",
      issueDate || new Date().toISOString().slice(0, 10),
      Number(totalAmount || 0),
      0,
      selectedElements || null,
      null,
    ]
  );

  const created = inserted.rows[0];
  const refDate = created?.issue_date ? new Date(created.issue_date) : new Date();
  const year = Number.isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();
  const invoiceNumber = `FAC-${year}-${String(created.id).padStart(6, "0")}`;

  const updated = await pool.query(
    `UPDATE invoices
     SET invoice_number = $1, updated_at = NOW()
     WHERE organization_id = $2 AND id = $3
     RETURNING id, total_amount, paid_amount, status`,
    [invoiceNumber, organizationId, created.id]
  );

  return updated.rows[0];
};

const ensureInvoiceForPayment = async ({ organizationId, clientId, caseId, paidAt }) => {
  let invoice = await findActiveInvoice(organizationId, clientId, caseId);
  const snapshot = await fetchClientInvoiceSnapshot(organizationId, clientId);
  let created = false;

  if (!invoice) {
    invoice = await createInvoiceForClient({
      organizationId,
      clientId,
      caseId,
      issueDate: paidAt || null,
      totalAmount: snapshot.totalDue,
      selectedElements: snapshot.selectedElements,
      serviceId: snapshot.serviceId,
    });
    created = true;
    return { invoice, snapshot, created };
  }

  if (Number(invoice.total_amount || 0) !== Number(snapshot.totalDue || 0) || snapshot.selectedElements) {
    await pool.query(
      `UPDATE invoices
       SET total_amount = $1,
           selected_elements = $2,
           updated_at = NOW()
       WHERE organization_id = $3 AND id = $4`,
      [Number(snapshot.totalDue || 0), snapshot.selectedElements || null, organizationId, invoice.id]
    );
    invoice.total_amount = Number(snapshot.totalDue || 0);
  }

  return { invoice, snapshot, created };
};

const syncInvoiceTotals = async (organizationId, invoiceId) => {
  if (!invoiceId) return;
  const totals = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total_paid,
            MAX(paid_at) AS last_paid_at
     FROM invoice_payments
     WHERE organization_id = $1 AND invoice_id = $2`,
    [organizationId, invoiceId]
  );
  const totalPaid = Number(totals.rows[0]?.total_paid || 0);
  const lastPaidAt = totals.rows[0]?.last_paid_at || null;

  const invoiceRes = await pool.query(
    `SELECT total_amount
     FROM invoices
     WHERE organization_id = $1 AND id = $2`,
    [organizationId, invoiceId]
  );
  const totalAmount = Number(invoiceRes.rows[0]?.total_amount || 0);
  const cappedPaidAmount = Math.min(Math.max(totalPaid, 0), Math.max(totalAmount, 0));
  const nextStatus = computeInvoiceStatus({ totalAmount, paidAmount: cappedPaidAmount });

  await pool.query(
    `UPDATE invoices
     SET paid_amount = $1,
         last_paid_at = $2,
         status = $3,
         updated_at = NOW()
     WHERE organization_id = $4 AND id = $5`,
    [cappedPaidAmount, lastPaidAt, nextStatus, organizationId, invoiceId]
  );
};

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

const listPayments = async (req, res, next) => {
  try {
    const { status, clientId } = req.query;
    const values = [req.organizationId];

    let query = `
      SELECT p.id,
             p.organization_id,
             p.client_id,
             p.case_id,
             p.invoice_id,
             p.amount,
             p.currency,
             p.status,
             p.paid_at,
             p.notes,
             p.created_at,
             p.updated_at,
             cl.full_name AS client_name,
             c.title AS case_title,
             i.invoice_number AS invoice_number
      FROM payments p
      LEFT JOIN clients cl ON cl.id = p.client_id
      LEFT JOIN cases c ON c.id = p.case_id
      LEFT JOIN invoices i ON i.id = p.invoice_id
      WHERE p.organization_id = $1
    `;

    if (status) {
      values.push(status);
      query += ` AND p.status = $${values.length}`;
    }

    if (clientId !== undefined) {
      const normalizedClientId = Number(clientId);
      if (!Number.isInteger(normalizedClientId)) {
        res.status(400).json({ message: "clientId doit être un entier." });
        return;
      }

      values.push(normalizedClientId);
      query += ` AND p.client_id = $${values.length}`;
    }

    query += " ORDER BY p.created_at DESC";

    const result = await pool.query(query, values);
    res.json({ payments: result.rows });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId)) {
      res.status(400).json({ message: "ID paiement invalide." });
      return;
    }

    const result = await pool.query(
      `SELECT id, organization_id, client_id, case_id, invoice_id, amount, currency, status, paid_at, notes, created_at, updated_at
       FROM payments
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, paymentId]
    );

    const payment = result.rows[0];

    if (!payment) {
      res.status(404).json({ message: "Paiement introuvable." });
      return;
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { amount, currency, status, paidAt, notes, clientId, caseId } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      res.status(400).json({ message: "amount doit être un nombre positif." });
      return;
    }

    const normalizedClientId = clientId === undefined || clientId === null ? null : Number(clientId);
    const normalizedCaseId = caseId === undefined || caseId === null ? null : Number(caseId);

    if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
      res.status(400).json({ message: "clientId doit être un entier." });
      return;
    }

    if (normalizedCaseId !== null && !Number.isInteger(normalizedCaseId)) {
      res.status(400).json({ message: "caseId doit être un entier." });
      return;
    }

    if (normalizedClientId !== null) {
      const belongs = await assertClientBelongsToOrganization(req.organizationId, normalizedClientId);

      if (!belongs) {
        res.status(400).json({ message: "clientId n'appartient pas à ce cabinet." });
        return;
      }
    }

    if (normalizedCaseId !== null) {
      const belongs = await assertCaseBelongsToOrganization(req.organizationId, normalizedCaseId);

      if (!belongs) {
        res.status(400).json({ message: "caseId n'appartient pas à ce cabinet." });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO payments (organization_id, client_id, case_id, amount, currency, status, paid_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, organization_id, client_id, case_id, invoice_id, amount, currency, status, paid_at, notes, created_at, updated_at`,
      [
        req.organizationId,
        normalizedClientId,
        normalizedCaseId,
        Number(amount),
        currency ? String(currency).trim().toUpperCase() : "XAF",
        status ? String(status).trim() : "pending",
        paidAt || null,
        notes ? String(notes).trim() : null,
      ]
    );

    const payment = result.rows[0];

    if (payment?.client_id) {
      await updateClientStatusFromPayments(req.organizationId, payment.client_id);
    }

    res.status(201).json({
      message: "Paiement créé avec succès.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId)) {
      res.status(400).json({ message: "ID paiement invalide." });
      return;
    }

    const updates = [];
    const values = [];

    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ message: "amount doit être un nombre positif." });
        return;
      }

      values.push(amount);
      updates.push(`amount = $${values.length}`);
    }

    if (req.body.currency !== undefined) {
      values.push(String(req.body.currency).trim().toUpperCase());
      updates.push(`currency = $${values.length}`);
    }

    if (req.body.status !== undefined) {
      values.push(String(req.body.status).trim());
      updates.push(`status = $${values.length}`);
    }

    if (req.body.paidAt !== undefined) {
      values.push(req.body.paidAt || null);
      updates.push(`paid_at = $${values.length}`);
    }

    if (req.body.notes !== undefined) {
      values.push(req.body.notes ? String(req.body.notes).trim() : null);
      updates.push(`notes = $${values.length}`);
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

    if (req.body.caseId !== undefined) {
      const normalizedCaseId = req.body.caseId === null ? null : Number(req.body.caseId);

      if (normalizedCaseId !== null && !Number.isInteger(normalizedCaseId)) {
        res.status(400).json({ message: "caseId doit être un entier." });
        return;
      }

      if (normalizedCaseId !== null) {
        const belongs = await assertCaseBelongsToOrganization(req.organizationId, normalizedCaseId);

        if (!belongs) {
          res.status(400).json({ message: "caseId n'appartient pas à ce cabinet." });
          return;
        }
      }

      values.push(normalizedCaseId);
      updates.push(`case_id = $${values.length}`);
    }

    if (!updates.length) {
      res.status(400).json({ message: "Aucune valeur fournie à mettre à jour." });
      return;
    }

    values.push(req.organizationId);
    values.push(paymentId);

    const previousResult = await pool.query(
      `SELECT id, client_id, case_id, invoice_id, amount, currency, status, paid_at, notes
       FROM payments
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, paymentId]
    );
    const previousPayment = previousResult.rows[0];

    if (!previousPayment) {
      res.status(404).json({ message: "Paiement introuvable." });
      return;
    }

    const result = await pool.query(
      `UPDATE payments
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE organization_id = $${values.length - 1} AND id = $${values.length}
       RETURNING id, organization_id, client_id, case_id, invoice_id, amount, currency, status, paid_at, notes, created_at, updated_at`,
      values
    );

    const payment = result.rows[0];

    if (payment?.client_id) {
      await updateClientStatusFromPayments(req.organizationId, payment.client_id);
    }

    res.json({
      message: "Paiement mis à jour avec succès.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId)) {
      res.status(400).json({ message: "ID paiement invalide." });
      return;
    }

    const existing = await pool.query(
      `SELECT id, client_id, invoice_id
       FROM payments
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, paymentId]
    );
    const deleted = existing.rows[0];

    if (!deleted) {
      res.status(404).json({ message: "Paiement introuvable." });
      return;
    }

    await pool.query(
      `DELETE FROM payments
       WHERE organization_id = $1 AND id = $2`,
      [req.organizationId, deleted.id]
    );

    if (deleted.client_id) {
      await updateClientStatusFromPayments(req.organizationId, deleted.client_id);
    }

    res.json({ message: "Paiement supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};

const getPaymentSummary = async (req, res, next) => {
  try {
    const totalsByStatusResult = await pool.query(
      `SELECT status,
              COUNT(*)::INT AS count,
              COALESCE(SUM(amount), 0)::TEXT AS total
       FROM payments
       WHERE organization_id = $1
       GROUP BY status
       ORDER BY status ASC`,
      [req.organizationId]
    );

    const paidTotalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::TEXT AS total_paid
       FROM payments
       WHERE organization_id = $1
         AND status = 'paid'`,
      [req.organizationId]
    );

    res.json({
      totalsByStatus: totalsByStatusResult.rows,
      totalPaid: paidTotalResult.rows[0]?.total_paid || "0",
    });
  } catch (error) {
    next(error);
  }
};

const syncInvoicesFromPayments = async (req, res, next) => {
  try {
    const details = {
      message:
        "La synchronisation paiements vers factures est desactivee. Les factures doivent maintenant etre creees explicitement puis reglees via le module facture.",
    };
    await pool.query(
      `INSERT INTO sync_logs (organization_id, action, status, details)
       VALUES ($1, $2, $3, $4)`,
      [req.organizationId, "sync_invoices", "disabled", JSON.stringify(details)]
    );

    res.status(410).json(details);
  } catch (error) {
    try {
      await pool.query(
        `INSERT INTO sync_logs (organization_id, action, status, details)
         VALUES ($1, $2, $3, $4)`,
        [req.organizationId, "sync_invoices", "error", JSON.stringify({ error: error.message })]
      );
    } catch (_logError) {
      // ignore log failures
    }
    next(error);
  }
};

const listSyncHistory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, action, status, details, created_at
       FROM sync_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.organizationId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentSummary,
  syncInvoicesFromPayments,
  listSyncHistory,
};
