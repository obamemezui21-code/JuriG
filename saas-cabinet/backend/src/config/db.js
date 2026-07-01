const { Pool } = require("pg");
require("dotenv").config();

const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || "5432";
const dbName = process.env.DB_NAME || "saas_cabinet";

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

if (!connectionString) {
  console.warn(
    "DATABASE_URL n'est pas défini. Les opérations base de données échoueront tant qu'il n'est pas configuré."
  );
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (error) => {
  console.error("Erreur PostgreSQL inattendue:", error.message);
});

const repairInvoicePaymentIntegrity = async () => {
  const result = await pool.query(`
    WITH payment_totals AS (
      SELECT
        organization_id,
        invoice_id,
        COALESCE(SUM(amount), 0)::NUMERIC AS total_paid,
        MAX(paid_at) AS last_paid_at
      FROM invoice_payments
      GROUP BY organization_id, invoice_id
    ),
    recomputed AS (
      SELECT
        i.id,
        i.organization_id,
        LEAST(
          GREATEST(
            COALESCE(pt.total_paid, i.paid_amount, 0),
            0
          ),
          GREATEST(COALESCE(i.total_amount, 0), 0)
        ) AS next_paid_amount,
        CASE
          WHEN LEAST(
            GREATEST(COALESCE(pt.total_paid, i.paid_amount, 0), 0),
            GREATEST(COALESCE(i.total_amount, 0), 0)
          ) >= GREATEST(COALESCE(i.total_amount, 0), 0)
            AND GREATEST(COALESCE(i.total_amount, 0), 0) > 0 THEN 'paid'
          WHEN LEAST(
            GREATEST(COALESCE(pt.total_paid, i.paid_amount, 0), 0),
            GREATEST(COALESCE(i.total_amount, 0), 0)
          ) > 0 THEN 'partial'
          WHEN i.status = 'cancelled' THEN 'cancelled'
          WHEN i.due_date IS NOT NULL
            AND i.due_date < CURRENT_DATE
            AND i.status <> 'draft' THEN 'overdue'
          WHEN i.status IN ('draft', 'sent', 'overdue') THEN i.status
          ELSE 'draft'
        END AS next_status,
        CASE
          WHEN LEAST(
            GREATEST(COALESCE(pt.total_paid, i.paid_amount, 0), 0),
            GREATEST(COALESCE(i.total_amount, 0), 0)
          ) > 0 THEN COALESCE(pt.last_paid_at, i.last_paid_at)
          ELSE NULL
        END AS next_last_paid_at
      FROM invoices i
      LEFT JOIN payment_totals pt
        ON pt.organization_id = i.organization_id
       AND pt.invoice_id = i.id
    )
    UPDATE invoices i
    SET paid_amount = r.next_paid_amount,
        status = r.next_status,
        last_paid_at = r.next_last_paid_at,
        updated_at = NOW()
    FROM recomputed r
    WHERE i.organization_id = r.organization_id
      AND i.id = r.id
      AND (
        COALESCE(i.paid_amount, 0) <> COALESCE(r.next_paid_amount, 0)
        OR COALESCE(i.status, '') <> COALESCE(r.next_status, '')
        OR COALESCE(i.last_paid_at::TEXT, '') <> COALESCE(r.next_last_paid_at::TEXT, '')
      )
    RETURNING i.id
  `);

  if (result.rowCount > 0) {
    console.log(`Factures réconciliées automatiquement: ${result.rowCount}`);
  }
};

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      logo_url TEXT,
      address TEXT,
      phone VARCHAR(60),
      email VARCHAR(190),
      theme_key VARCHAR(40) NOT NULL DEFAULT 'blue',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS theme_key VARCHAR(40) NOT NULL DEFAULT 'blue';
    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS phone VARCHAR(60);
    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS email VARCHAR(190);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'member',
      permissions JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]';

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      service_id INTEGER REFERENCES legal_services(id) ON DELETE SET NULL,
      full_name VARCHAR(160) NOT NULL,
      email VARCHAR(190),
      phone VARCHAR(60),
      birth_date DATE,
      birth_place VARCHAR(160),
      nationality VARCHAR(120),
      photo_url TEXT,
      notes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'en_cours',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES legal_services(id) ON DELETE SET NULL;

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS birth_date DATE;

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS birth_place VARCHAR(160);

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS nationality VARCHAR(120);

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS identity_document_url TEXT;

    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'en_cours';

    CREATE TABLE IF NOT EXISTS cases (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'open',
      opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
      closed_at DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      paid_at DATE,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by_name VARCHAR(160),
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
      motif VARCHAR(200) NOT NULL,
      description TEXT,
      transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(160);
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'XAF';
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS motif VARCHAR(200) NOT NULL DEFAULT '';
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP NOT NULL DEFAULT NOW();
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS reason VARCHAR(200) NOT NULL DEFAULT '';
    ALTER TABLE expenses
    ALTER COLUMN reason SET DEFAULT '';
    UPDATE expenses
    SET reason = ''
    WHERE reason IS NULL;

    UPDATE expenses
    SET created_by_name = u.name
    FROM users u
    WHERE expenses.user_id = u.id
      AND (expenses.created_by_name IS NULL OR expenses.created_by_name = '');

    ALTER TABLE disbursements
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE disbursements
    ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(160);

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES legal_services(id) ON DELETE SET NULL,
      procedure_id INTEGER REFERENCES procedure_requests(id) ON DELETE SET NULL,
      invoice_number VARCHAR(50) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
      due_date DATE,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
      paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
      selected_elements TEXT,
      last_paid_at DATE,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (organization_id, invoice_number)
    );

    CREATE TABLE IF NOT EXISTS invoice_payments (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
      paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method VARCHAR(40),
      reference VARCHAR(120),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      action VARCHAR(60) NOT NULL,
      status VARCHAR(30) NOT NULL,
      details TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES legal_services(id) ON DELETE SET NULL;

    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS procedure_id INTEGER REFERENCES procedure_requests(id) ON DELETE SET NULL;

    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS selected_elements TEXT;

    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

    ALTER TABLE invoice_payments
    ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS legal_services (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(220) NOT NULL,
      category VARCHAR(120),
      description TEXT,
      dossier_elements TEXT,
      procedure_steps TEXT,
      base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE legal_services
    ADD COLUMN IF NOT EXISTS dossier_elements TEXT;

    ALTER TABLE legal_services
    ADD COLUMN IF NOT EXISTS procedure_steps TEXT;

    CREATE TABLE IF NOT EXISTS procedure_requests (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES legal_services(id) ON DELETE SET NULL,
      title VARCHAR(220) NOT NULL,
      montant NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (montant >= 0),
      details TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'nouvelle',
      priority VARCHAR(30) NOT NULL DEFAULT 'normale',
      expected_deadline DATE,
      completed_at DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE procedure_requests
    ADD COLUMN IF NOT EXISTS montant NUMERIC(12, 2) NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS client_procedure_selections (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      procedure_id INTEGER NOT NULL REFERENCES procedure_requests(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (client_id, procedure_id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(organization_id);
    CREATE INDEX IF NOT EXISTS idx_cases_org_id ON cases(organization_id);
    CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(organization_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_service_id ON invoices(service_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_procedure_id ON invoices(procedure_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_payments_org_id ON invoice_payments(organization_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_id ON invoice_payments(payment_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_org_id ON sync_logs(organization_id);
    CREATE INDEX IF NOT EXISTS idx_services_org_id ON legal_services(organization_id);
    CREATE INDEX IF NOT EXISTS idx_procedures_org_id ON procedure_requests(organization_id);
    CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedure_requests(status);
    CREATE INDEX IF NOT EXISTS idx_client_procedures_client_id ON client_procedure_selections(client_id);
    CREATE INDEX IF NOT EXISTS idx_client_procedures_org_id ON client_procedure_selections(organization_id);

  `);

  await repairInvoicePaymentIntegrity();
};

const closeDatabase = async () => {
  await pool.end();
};

module.exports = {
  pool,
  initDatabase,
  closeDatabase,
};
