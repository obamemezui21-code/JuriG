const { pool } = require("../config/db");

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

const assertServiceBelongsToOrganization = async (organizationId, serviceId) => {
  const result = await pool.query(
    `SELECT id
     FROM legal_services
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, serviceId]
  );

  return Boolean(result.rows[0]);
};

const assertProcedureBelongsToOrganization = async (organizationId, procedureId) => {
  const result = await pool.query(
    `SELECT id, montant, service_id
     FROM procedure_requests
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, procedureId]
  );

  return result.rows[0] || null;
};

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
};

const normalizeStatus = (status) => String(status || "draft").trim().toLowerCase();
const normalizeSelectedElements = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  const entries = items
    .map((item) => {
      if (item && typeof item === "object") {
        const label = String(item.label || "").trim();
        const amount = Number(item.amount);
        if (!label) {
          return null;
        }
        return { label, amount: Number.isFinite(amount) && amount >= 0 ? amount : null };
      }
      const label = String(item || "").trim();
      if (!label) {
        return null;
      }
      return { label, amount: null };
    })
    .filter(Boolean)
    .filter((entry, index, array) => array.findIndex((it) => it.label === entry.label) === index);

  return entries;
};

const isPastDate = (dateValue) => {
  if (!dateValue) {
    return false;
  }
  const today = new Date();
  const nowDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dateValue);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due < nowDate;
};

const computeInvoiceStatus = ({ status, totalAmount, paidAmount, dueDate }) => {
  const normalizedStatus = normalizeStatus(status);
  const safeTotal = Number(totalAmount || 0);
  const safePaid = Number(paidAmount || 0);

  if (normalizedStatus === "cancelled") {
    return "cancelled";
  }

  if (safePaid >= safeTotal && safeTotal > 0) {
    return "paid";
  }

  if (safePaid > 0) {
    return "partial";
  }

  if (isPastDate(dueDate) && normalizedStatus !== "draft") {
    return "overdue";
  }

  if (["draft", "sent", "overdue"].includes(normalizedStatus)) {
    return normalizedStatus;
  }

  return "draft";
};

const resolveEffectivePaidAmount = (row) => {
  const totalAmount = Number(row.total_amount || 0);
  const storedPaidAmount = Number(row.paid_amount || 0);
  const historyCount = Number(row.payment_count || 0);
  const historyPaidAmount = Number(row.payments_total_paid || 0);
  const maxTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0;

  if (historyCount > 0) {
    const safeHistoryPaid = Number.isFinite(historyPaidAmount) ? historyPaidAmount : 0;
    return Math.min(maxTotal, Math.max(0, safeHistoryPaid));
  }

  const safeStoredPaid = Number.isFinite(storedPaidAmount) ? storedPaidAmount : 0;
  return Math.min(maxTotal, Math.max(0, safeStoredPaid));
};

const formatInvoiceRow = (row) => {
  const totalAmount = Number(row.total_amount || 0);
  const paidAmount = resolveEffectivePaidAmount(row);
  const balanceDue = Math.max(0, totalAmount - paidAmount);
  const computedStatus = computeInvoiceStatus({
    status: row.status,
    totalAmount,
    paidAmount,
    dueDate: row.due_date,
  });

  return {
    ...row,
    amount: row.total_amount,
    total_amount: row.total_amount,
    paid_amount: String(paidAmount),
    balance_due: String(balanceDue),
    status: computedStatus,
  };
};

const listInvoices = async (req, res, next) => {
  try {
    const { status, clientId } = req.query;
    const values = [req.organizationId];

    let query = `
      SELECT i.id,
             i.organization_id,
             i.client_id,
             i.case_id,
             i.service_id,
             i.procedure_id,
             i.invoice_number,
             i.currency,
             i.status,
             i.issue_date,
             i.due_date,
             i.total_amount,
             i.paid_amount,
             i.selected_elements,
             i.last_paid_at,
             i.notes,
             i.created_at,
             i.updated_at,
                  COALESCE(ip.total_paid, 0)::TEXT AS payments_total_paid,
                  COALESCE(ip.payment_count, 0)::INT AS payment_count,
             cl.full_name AS client_name,
             c.title AS case_title,
             s.name AS service_name,
             p.title AS procedure_title
      FROM invoices i
                LEFT JOIN (
             SELECT organization_id,
               invoice_id,
               COALESCE(SUM(amount), 0) AS total_paid,
               COUNT(*) AS payment_count
             FROM invoice_payments
             GROUP BY organization_id, invoice_id
                ) ip ON ip.organization_id = i.organization_id AND ip.invoice_id = i.id
      LEFT JOIN clients cl ON cl.id = i.client_id
      LEFT JOIN cases c ON c.id = i.case_id
      LEFT JOIN legal_services s ON s.id = i.service_id
      LEFT JOIN procedure_requests p ON p.id = i.procedure_id
      WHERE i.organization_id = $1
    `;

    if (status) {
      values.push(normalizeStatus(status));
      query += ` AND i.status = $${values.length}`;
    }

    if (clientId !== undefined) {
      const normalizedClientId = Number(clientId);
      if (!Number.isInteger(normalizedClientId)) {
        res.status(400).json({ message: "clientId doit être un entier." });
        return;
      }

      values.push(normalizedClientId);
      query += ` AND i.client_id = $${values.length}`;
    }

    query += " ORDER BY i.created_at DESC";

    const result = await pool.query(query, values);
    res.json({ invoices: result.rows.map(formatInvoiceRow) });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId)) {
      res.status(400).json({ message: "ID facture invalide." });
      return;
    }

    const result = await pool.query(
      `SELECT i.id,
             i.organization_id,
             i.client_id,
             i.case_id,
             i.service_id,
             i.procedure_id,
             i.invoice_number,
             i.currency,
             i.status,
             i.issue_date,
             i.due_date,
             i.total_amount,
             i.paid_amount,
             i.selected_elements,
             i.last_paid_at,
             i.notes,
             i.created_at,
             i.updated_at,
                  COALESCE(ip.total_paid, 0)::TEXT AS payments_total_paid,
                  COALESCE(ip.payment_count, 0)::INT AS payment_count,
             cl.full_name AS client_name,
             c.title AS case_title,
             s.name AS service_name,
             p.title AS procedure_title
      FROM invoices i
                LEFT JOIN (
             SELECT organization_id,
               invoice_id,
               COALESCE(SUM(amount), 0) AS total_paid,
               COUNT(*) AS payment_count
             FROM invoice_payments
             GROUP BY organization_id, invoice_id
                ) ip ON ip.organization_id = i.organization_id AND ip.invoice_id = i.id
      LEFT JOIN clients cl ON cl.id = i.client_id
      LEFT JOIN cases c ON c.id = i.case_id
      LEFT JOIN legal_services s ON s.id = i.service_id
      LEFT JOIN procedure_requests p ON p.id = i.procedure_id
      WHERE i.organization_id = $1 AND i.id = $2
      LIMIT 1`,
      [req.organizationId, invoiceId]
    );

    const invoice = result.rows[0];
    if (!invoice) {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }

    res.json({ invoice: formatInvoiceRow(invoice) });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { amount, currency, status, issueDate, dueDate, notes, clientId, caseId, serviceId, procedureId, selectedElements, paidAmount } = req.body;
    const requestedAmount = toMoney(amount);
    const normalizedPaidAmount = paidAmount === undefined ? 0 : toMoney(paidAmount);

    if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount < 0) {
      res.status(400).json({ message: "paidAmount doit être un nombre positif ou nul." });
      return;
    }

    const normalizedClientId = clientId === undefined || clientId === null ? null : Number(clientId);
    const normalizedCaseId = caseId === undefined || caseId === null ? null : Number(caseId);
    let normalizedServiceId = serviceId === undefined || serviceId === null ? null : Number(serviceId);
    const normalizedProcedureId = procedureId === undefined || procedureId === null ? null : Number(procedureId);
    let procedureRow = null;

    if (normalizedClientId !== null && !Number.isInteger(normalizedClientId)) {
      res.status(400).json({ message: "clientId doit être un entier." });
      return;
    }

    if (normalizedCaseId !== null && !Number.isInteger(normalizedCaseId)) {
      res.status(400).json({ message: "caseId doit être un entier." });
      return;
    }
    if (normalizedServiceId !== null && !Number.isInteger(normalizedServiceId)) {
      res.status(400).json({ message: "serviceId doit être un entier." });
      return;
    }
    if (normalizedProcedureId !== null && !Number.isInteger(normalizedProcedureId)) {
      res.status(400).json({ message: "procedureId doit être un entier." });
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
    if (normalizedServiceId !== null) {
      const belongs = await assertServiceBelongsToOrganization(req.organizationId, normalizedServiceId);
      if (!belongs) {
        res.status(400).json({ message: "serviceId n'appartient pas à ce cabinet." });
        return;
      }
    }
    if (normalizedProcedureId !== null) {
      const belongs = await assertProcedureBelongsToOrganization(req.organizationId, normalizedProcedureId);
      if (!belongs) {
        res.status(400).json({ message: "procedureId n'appartient pas à ce cabinet." });
        return;
      }
      procedureRow = belongs;
    }

    const normalizedAmount =
      Number.isFinite(requestedAmount) && requestedAmount >= 0
        ? requestedAmount
        : procedureRow
          ? Number(procedureRow.montant || 0)
          : 0;
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
      res.status(400).json({ message: "amount doit être un nombre positif ou nul." });
      return;
    }
    if (normalizedPaidAmount > normalizedAmount) {
      res.status(400).json({ message: "paidAmount ne peut pas dépasser amount." });
      return;
    }
    const normalizedElements = normalizeSelectedElements(selectedElements);

    const wantedStatus = normalizeStatus(status || "draft");
    const effectiveStatus = computeInvoiceStatus({
      status: wantedStatus,
      totalAmount: normalizedAmount,
      paidAmount: normalizedPaidAmount,
      dueDate: dueDate || null,
    });

    const tmpInvoiceNumber = `TMP-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;

    const inserted = await pool.query(
      `INSERT INTO invoices (
         organization_id, client_id, case_id, service_id, procedure_id, invoice_number, currency, status, issue_date, due_date,
         total_amount, paid_amount, selected_elements, last_paid_at, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, issue_date`,
      [
        req.organizationId,
        normalizedClientId,
        normalizedCaseId,
        normalizedServiceId,
        normalizedProcedureId,
        tmpInvoiceNumber,
        currency ? String(currency).trim().toUpperCase() : "XAF",
        effectiveStatus,
        issueDate || new Date().toISOString().slice(0, 10),
        dueDate || null,
        normalizedAmount,
        normalizedPaidAmount,
        normalizedElements.length
          ? normalizedElements
              .map((entry) => (entry.amount !== null ? `${entry.label}::${entry.amount}` : entry.label))
              .join("\n")
          : null,
        normalizedPaidAmount > 0 ? new Date().toISOString().slice(0, 10) : null,
        notes ? String(notes).trim() : null,
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
       RETURNING id, organization_id, client_id, case_id, service_id, procedure_id, invoice_number, currency, status, issue_date, due_date,
                 total_amount, paid_amount, selected_elements, last_paid_at, notes, created_at, updated_at`,
      [invoiceNumber, req.organizationId, created.id]
    );

    res.status(201).json({
      message: "Facture créée avec succès.",
      invoice: formatInvoiceRow(updated.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId)) {
      res.status(400).json({ message: "ID facture invalide." });
      return;
    }

    const existingResult = await pool.query(
      `SELECT id, total_amount, paid_amount, due_date, status
       FROM invoices
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, invoiceId]
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }

    const updates = [];
    const values = [];

    let nextTotalAmount = Number(existing.total_amount || 0);
    let nextPaidAmount = Number(existing.paid_amount || 0);
    let nextDueDate = existing.due_date || null;
    let wantedStatus = normalizeStatus(req.body.status || existing.status);

    if (req.body.amount !== undefined || req.body.totalAmount !== undefined) {
      const amountValue = req.body.totalAmount !== undefined ? req.body.totalAmount : req.body.amount;
      const amount = toMoney(amountValue);
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ message: "amount doit être un nombre positif." });
        return;
      }
      nextTotalAmount = amount;
      values.push(amount);
      updates.push(`total_amount = $${values.length}`);
    }

    if (req.body.paidAmount !== undefined) {
      const paidAmount = toMoney(req.body.paidAmount);
      if (!Number.isFinite(paidAmount) || paidAmount < 0) {
        res.status(400).json({ message: "paidAmount doit être un nombre positif ou nul." });
        return;
      }
      nextPaidAmount = paidAmount;
      values.push(paidAmount);
      updates.push(`paid_amount = $${values.length}`);
    }

    if (nextPaidAmount > nextTotalAmount) {
      res.status(400).json({ message: "Le montant payé ne peut pas dépasser le montant total." });
      return;
    }

    if (req.body.currency !== undefined) {
      values.push(String(req.body.currency).trim().toUpperCase());
      updates.push(`currency = $${values.length}`);
    }

    if (req.body.issueDate !== undefined) {
      values.push(req.body.issueDate || null);
      updates.push(`issue_date = $${values.length}`);
    }

    if (req.body.dueDate !== undefined) {
      nextDueDate = req.body.dueDate || null;
      values.push(nextDueDate);
      updates.push(`due_date = $${values.length}`);
    }

    if (req.body.notes !== undefined) {
      values.push(req.body.notes ? String(req.body.notes).trim() : null);
      updates.push(`notes = $${values.length}`);
    }

    if (req.body.selectedElements !== undefined) {
      const normalizedElements = normalizeSelectedElements(req.body.selectedElements);
      values.push(
        normalizedElements.length
          ? normalizedElements
              .map((entry) => (entry.amount !== null ? `${entry.label}::${entry.amount}` : entry.label))
              .join("\n")
          : null
      );
      updates.push(`selected_elements = $${values.length}`);
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

    if (req.body.serviceId !== undefined) {
      const normalizedServiceId = req.body.serviceId === null ? null : Number(req.body.serviceId);
      if (normalizedServiceId !== null && !Number.isInteger(normalizedServiceId)) {
        res.status(400).json({ message: "serviceId doit être un entier." });
        return;
      }
      if (normalizedServiceId !== null) {
        const belongs = await assertServiceBelongsToOrganization(req.organizationId, normalizedServiceId);
        if (!belongs) {
          res.status(400).json({ message: "serviceId n'appartient pas à ce cabinet." });
          return;
        }
      }
      values.push(normalizedServiceId);
      updates.push(`service_id = $${values.length}`);
    }

    if (req.body.procedureId !== undefined) {
      const normalizedProcedureId = req.body.procedureId === null ? null : Number(req.body.procedureId);
      if (normalizedProcedureId !== null && !Number.isInteger(normalizedProcedureId)) {
        res.status(400).json({ message: "procedureId doit être un entier." });
        return;
      }
      if (normalizedProcedureId !== null) {
        const belongs = await assertProcedureBelongsToOrganization(req.organizationId, normalizedProcedureId);
        if (!belongs) {
          res.status(400).json({ message: "procedureId n'appartient pas à ce cabinet." });
          return;
        }
      }
      values.push(normalizedProcedureId);
      updates.push(`procedure_id = $${values.length}`);
    }

    const computedStatus = computeInvoiceStatus({
      status: wantedStatus,
      totalAmount: nextTotalAmount,
      paidAmount: nextPaidAmount,
      dueDate: nextDueDate,
    });
    values.push(computedStatus);
    updates.push(`status = $${values.length}`);

    if (!updates.length) {
      res.status(400).json({ message: "Aucune valeur fournie à mettre à jour." });
      return;
    }

    values.push(req.organizationId);
    values.push(invoiceId);

    const result = await pool.query(
      `UPDATE invoices
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE organization_id = $${values.length - 1} AND id = $${values.length}
       RETURNING id, organization_id, client_id, case_id, service_id, procedure_id, invoice_number, currency, status, issue_date, due_date,
                 total_amount, paid_amount, selected_elements, last_paid_at, notes, created_at, updated_at`,
      values
    );

    res.json({
      message: "Facture mise à jour avec succès.",
      invoice: formatInvoiceRow(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId)) {
      res.status(400).json({ message: "ID facture invalide." });
      return;
    }

    const result = await pool.query(
      `DELETE FROM invoices
       WHERE organization_id = $1 AND id = $2
       RETURNING id`,
      [req.organizationId, invoiceId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }

    res.json({ message: "Facture supprimée avec succès." });
  } catch (error) {
    next(error);
  }
};

const registerInvoicePayment = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId)) {
      res.status(400).json({ message: "ID facture invalide." });
      return;
    }

    const amount = toMoney(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ message: "amount doit être un nombre positif." });
      return;
    }

    const invoiceResult = await pool.query(
      `SELECT i.id,
              i.organization_id,
              i.currency,
              i.status,
              i.due_date,
              i.total_amount,
              i.paid_amount,
              COALESCE(ip.total_paid, 0)::TEXT AS payments_total_paid,
              COALESCE(ip.payment_count, 0)::INT AS payment_count
      FROM invoices i
       LEFT JOIN (
         SELECT organization_id,
                invoice_id,
                COALESCE(SUM(amount), 0) AS total_paid,
                COUNT(*) AS payment_count
         FROM invoice_payments
         GROUP BY organization_id, invoice_id
       ) ip ON ip.organization_id = i.organization_id AND ip.invoice_id = i.id
       WHERE i.organization_id = $1 AND i.id = $2
       LIMIT 1`,
      [req.organizationId, invoiceId]
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }

    const totalAmount = Number(invoice.total_amount || 0);
    const currentPaid = resolveEffectivePaidAmount(invoice);
    if (currentPaid >= totalAmount) {
      res.status(400).json({ message: "Cette facture est déjà totalement réglée." });
      return;
    }

    const remaining = Math.max(0, totalAmount - currentPaid);
    if (amount > remaining) {
      res.status(400).json({ message: "Le montant depasse le reste a payer." });
      return;
    }

    const nextPaidAmount = Math.min(totalAmount, currentPaid + amount);
    const effectivePayment = nextPaidAmount - currentPaid;
    const paidAt = req.body.paidAt || new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO invoice_payments (
         organization_id, invoice_id, amount, currency, paid_at, payment_method, reference, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.organizationId,
        invoiceId,
        effectivePayment,
        invoice.currency,
        paidAt,
        req.body.paymentMethod ? String(req.body.paymentMethod).trim() : null,
        req.body.reference ? String(req.body.reference).trim() : null,
        req.body.notes ? String(req.body.notes).trim() : null,
      ]
    );

    const nextStatus = computeInvoiceStatus({
      status: invoice.status,
      totalAmount,
      paidAmount: nextPaidAmount,
      dueDate: invoice.due_date,
    });

    const updatedResult = await pool.query(
      `UPDATE invoices
       SET paid_amount = $1, last_paid_at = $2, status = $3, updated_at = NOW()
       WHERE organization_id = $4 AND id = $5
       RETURNING id, organization_id, client_id, case_id, service_id, procedure_id, invoice_number, currency, status, issue_date, due_date,
                 total_amount, paid_amount, selected_elements, last_paid_at, notes, created_at, updated_at`,
      [nextPaidAmount, paidAt, nextStatus, req.organizationId, invoiceId]
    );

    res.json({
      message: "Paiement enregistré avec succès.",
      invoice: formatInvoiceRow(updatedResult.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

const listInvoicePayments = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId)) {
      res.status(400).json({ message: "ID facture invalide." });
      return;
    }

    const invoiceResult = await pool.query(
      `SELECT id
       FROM invoices
       WHERE organization_id = $1 AND id = $2
       LIMIT 1`,
      [req.organizationId, invoiceId]
    );
    if (!invoiceResult.rows[0]) {
      res.status(404).json({ message: "Facture introuvable." });
      return;
    }

    const result = await pool.query(
      `SELECT id, organization_id, invoice_id, amount, currency, paid_at, payment_method, reference, notes, created_at
       FROM invoice_payments
       WHERE organization_id = $1 AND invoice_id = $2
       ORDER BY paid_at DESC, id DESC`,
      [req.organizationId, invoiceId]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    next(error);
  }
};

const getInvoiceSummary = async (req, res, next) => {
  try {
    const totalsByStatusResult = await pool.query(
      `SELECT computed_status AS status,
              COUNT(*)::INT AS count,
              COALESCE(SUM(total_amount), 0)::TEXT AS total
       FROM (
         SELECT i.total_amount,
                CASE
                  WHEN capped_paid >= i.total_amount AND i.total_amount > 0 THEN 'paid'
                  WHEN capped_paid > 0 THEN 'partial'
                  WHEN i.status = 'cancelled' THEN 'cancelled'
                  WHEN i.due_date IS NOT NULL
                       AND i.due_date < CURRENT_DATE
                       AND i.status <> 'draft' THEN 'overdue'
                  WHEN i.status IN ('draft', 'sent', 'overdue') THEN i.status
                  ELSE 'draft'
                END AS computed_status
         FROM (
           SELECT i.*, 
                  LEAST(
                    CASE
                      WHEN COALESCE(ip.payment_count, 0) > 0 THEN COALESCE(ip.total_paid, 0)
                      ELSE COALESCE(i.paid_amount, 0)
                    END,
                    COALESCE(i.total_amount, 0)
                  ) AS capped_paid,
                  CASE
                    WHEN COALESCE(ip.payment_count, 0) > 0 THEN COALESCE(ip.total_paid, 0)
                    ELSE COALESCE(i.paid_amount, 0)
                  END AS effective_paid
           FROM invoices i
           LEFT JOIN (
             SELECT organization_id,
                    invoice_id,
                    COALESCE(SUM(amount), 0) AS total_paid,
                    COUNT(*) AS payment_count
             FROM invoice_payments
             GROUP BY organization_id, invoice_id
           ) ip ON ip.organization_id = i.organization_id AND ip.invoice_id = i.id
           WHERE i.organization_id = $1
         ) i
       ) summary
       GROUP BY computed_status
       ORDER BY computed_status ASC`,
      [req.organizationId]
    );

    const paidTotalResult = await pool.query(
      `SELECT COALESCE(SUM(capped_paid), 0)::TEXT AS total_paid
       FROM (
         SELECT LEAST(
                  CASE
                    WHEN COALESCE(ip.payment_count, 0) > 0 THEN COALESCE(ip.total_paid, 0)
                    ELSE COALESCE(i.paid_amount, 0)
                  END,
                  COALESCE(i.total_amount, 0)
                ) AS capped_paid
         FROM invoices i
         LEFT JOIN (
           SELECT organization_id,
                  invoice_id,
                  COALESCE(SUM(amount), 0) AS total_paid,
                  COUNT(*) AS payment_count
           FROM invoice_payments
           GROUP BY organization_id, invoice_id
         ) ip ON ip.organization_id = i.organization_id AND ip.invoice_id = i.id
         WHERE i.organization_id = $1
       ) paid_summary`,
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

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  registerInvoicePayment,
  listInvoicePayments,
  getInvoiceSummary,
};
