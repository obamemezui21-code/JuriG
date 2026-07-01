const { pool } = require("../src/config/db");

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
    return { invoice, snapshot };
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

  return { invoice, snapshot };
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
  const nextStatus = computeInvoiceStatus({ totalAmount, paidAmount: totalPaid });

  await pool.query(
    `UPDATE invoices
     SET paid_amount = $1,
         last_paid_at = $2,
         status = $3,
         updated_at = NOW()
     WHERE organization_id = $4 AND id = $5`,
    [totalPaid, lastPaidAt, nextStatus, organizationId, invoiceId]
  );
};

const syncAll = async () => {
  const paymentsRes = await pool.query(
    `SELECT id, organization_id, client_id, case_id, invoice_id, amount, currency, status, paid_at, notes
     FROM payments
     WHERE status IN ('paid', 'partial')
     ORDER BY organization_id, client_id, id`
  );

  const payments = paymentsRes.rows || [];
  const touchedInvoices = new Set();

  for (const payment of payments) {
    if (!payment.client_id) {
      continue;
    }

    const normalizedStatus = normalizeStatus(payment.status);
    if (!PAID_STATUSES.has(normalizedStatus)) {
      continue;
    }

    let invoiceId = payment.invoice_id;
    if (!invoiceId) {
      const { invoice } = await ensureInvoiceForPayment({
        organizationId: payment.organization_id,
        clientId: payment.client_id,
        caseId: payment.case_id,
        paidAt: payment.paid_at,
      });
      invoiceId = invoice?.id || null;

      if (invoiceId) {
        await pool.query(
          `UPDATE payments
           SET invoice_id = $1, updated_at = NOW()
           WHERE organization_id = $2 AND id = $3`,
          [invoiceId, payment.organization_id, payment.id]
        );
      }
    }

    if (!invoiceId) {
      continue;
    }

    const existingInvoicePayment = await pool.query(
      `SELECT id
       FROM invoice_payments
       WHERE organization_id = $1 AND payment_id = $2
       LIMIT 1`,
      [payment.organization_id, payment.id]
    );

    if (!existingInvoicePayment.rows[0]) {
      await pool.query(
        `INSERT INTO invoice_payments (organization_id, invoice_id, payment_id, amount, currency, paid_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          payment.organization_id,
          invoiceId,
          payment.id,
          Number(payment.amount),
          payment.currency || "XAF",
          payment.paid_at || new Date().toISOString().slice(0, 10),
          payment.notes || null,
        ]
      );
    }

    touchedInvoices.add(`${payment.organization_id}:${invoiceId}`);
  }

  for (const key of touchedInvoices) {
    const [orgId, invId] = key.split(":");
    await syncInvoiceTotals(Number(orgId), Number(invId));
  }

  console.log(`Synchronisation terminée. Paiements traités: ${payments.length}. Factures recalculées: ${touchedInvoices.size}.`);
};

syncAll()
  .then(() => pool.end())
  .catch((error) => {
    console.error("Erreur sync:", error);
    pool.end();
    process.exit(1);
  });
