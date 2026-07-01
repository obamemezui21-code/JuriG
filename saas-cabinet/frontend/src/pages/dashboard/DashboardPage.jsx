import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { exportRowsToExcel } from "../../utils/excelExport";
import ImageSlider from "../../components/ImageSlider";

// Import slider images
import sliderImg1 from "../images/ChatGPT Image 21 mai 2026, 00_55_50.png";
import sliderImg2 from "../images/ChatGPT Image 21 mai 2026, 00_56_11.png";
import sliderImg3 from "../images/ChatGPT Image 21 mai 2026, 00_56_24.png";

const DashboardPage = () => {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // Slider images array
  const sliderImages = useMemo(() => [sliderImg1, sliderImg2, sliderImg3], []);

  const loadData = useCallback(async () => {
    if (!token) {
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        api.listClients(token),
        api.listInvoices(token),
      ]);
      setClients(clientsRes.clients || []);
      setInvoices(invoicesRes.invoices || []);
    } catch (apiError) {
      setDashboardError(apiError.message || "Impossible de charger les indicateurs du tableau de bord.");
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientsById = useMemo(
    () =>
      clients.reduce((acc, client) => {
        acc[Number(client.id)] = client;
        return acc;
      }, {}),
    [clients]
  );

  const closedCaseCount = useMemo(
    () =>
      clients.filter(
        (client) => {
          const status = String(client.status || "").trim().toLowerCase();
          return status === "urgent" || status === "pret" || status === "termine";
        }
      ).length,
    [clients]
  );
  const openCaseCount = Math.max(0, clients.length - closedCaseCount);
  const paidInvoiceCount = useMemo(
    () =>
      invoices.filter((invoice) => {
        const status = String(invoice.status || "").trim().toLowerCase();
        return status === "paid" || status === "partial";
      }).length,
    [invoices]
  );
  const outstandingInvoiceCount = Math.max(0, invoices.length - paidInvoiceCount);
  const completionRate = clients.length ? Math.round((closedCaseCount / clients.length) * 100) : 0;
  const paymentCoverage = invoices.length ? Math.round((paidInvoiceCount / invoices.length) * 100) : 0;
  const hasDashboardData = clients.length > 0 || invoices.length > 0;
  const formatDate = (value) => {
    if (!value) {
      return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value).slice(0, 10);
    }
    return new Intl.DateTimeFormat("fr-FR").format(parsed);
  };

  const exportClientsToExcel = () => {
    const rows = clients.map((client) => ({
      code: client.id ? `CL-${String(client.id).padStart(5, "0")}` : "",
      nom: client.full_name || "",
      email: client.email || "",
      telephone: client.phone || "",
      nationalite: client.nationality || "",
      dateCreation: formatDate(client.created_at),
    }));

    exportRowsToExcel({
      fileName: "clients-cabinet.xlsx",
      sheetName: "Clients",
      columns: [
        { key: "code", label: "Code client" },
        { key: "nom", label: "Nom" },
        { key: "email", label: "Email" },
        { key: "telephone", label: "Telephone" },
        { key: "nationalite", label: "Nationalite" },
        { key: "dateCreation", label: "Date creation" },
      ],
      rows,
    });
  };

  const exportInvoicesToExcel = () => {
    const rows = invoices.map((invoice) => {
      const client = clientsById[Number(invoice.client_id)];

      return {
        numero: invoice.invoice_number || "",
        client: client?.full_name || invoice.client_name || "",
        service: invoice.service_name || "",
        statut: invoice.status || "",
        montant: Number(invoice.amount || invoice.total_amount || 0),
        devise: invoice.currency || "XAF",
        dateEmission: formatDate(invoice.issue_date),
        dateEcheance: formatDate(invoice.due_date),
        dateCreation: formatDate(invoice.created_at),
      };
    });

    exportRowsToExcel({
      fileName: "factures-cabinet.xlsx",
      sheetName: "Factures",
      columns: [
        { key: "numero", label: "Numero facture" },
        { key: "client", label: "Client" },
        { key: "service", label: "Service" },
        { key: "statut", label: "Statut" },
        { key: "montant", label: "Montant" },
        { key: "devise", label: "Devise" },
        { key: "dateEmission", label: "Date emission" },
        { key: "dateEcheance", label: "Date echeance" },
        { key: "dateCreation", label: "Date creation" },
      ],
      rows,
    });
  };

  return (
    <>
      <section className="dashboard-hero dashboard-hero-sample">
        <div className="dashboard-hero-topbar">
          <div className="dashboard-hero-topbar-search">
            <span className="dashboard-hero-search-icon" aria-hidden="true">🔍</span>
            <span>Search Juriste Numérique</span>
          </div>
        </div>

        <div className="dashboard-hero-media" aria-label="Galerie visuelle de la plateforme">
          <ImageSlider images={sliderImages} autoOnly={false} />

          <div className="dashboard-hero-media-overlay">
            <span>Plateforme</span>
            <h3>Juriste Numérique</h3>
            <p>
              Une expérience complète pour piloter vos dossiers, clients et factures dans un espace clair,
              moderne et professionnel.
            </p>
          </div>

          <div className="dashboard-hero-feature-strip">
            <article className="dashboard-hero-feature-card">
              <span>Dossiers suivis</span>
              <strong>{clients.length}</strong>
            </article>
            <article className="dashboard-hero-feature-card">
              <span>Factures en attente</span>
              <strong>{outstandingInvoiceCount}</strong>
            </article>
            <article className="dashboard-hero-feature-card">
              <span>Factures réglées</span>
              <strong>{paidInvoiceCount}</strong>
            </article>
          </div>
        </div>
      </section>

      {dashboardLoading ? (
        <section className="card dashboard-state-card" role="status" aria-live="polite" aria-busy="true">
          <div className="dashboard-state-spinner" aria-hidden="true" />
          <div>
            <h3>Chargement des indicateurs</h3>
            <p>Nous recuperons les clients, dossiers et factures du cabinet.</p>
          </div>
        </section>
      ) : null}

      {!dashboardLoading && dashboardError ? (
        <section className="card dashboard-state-card dashboard-state-error" role="alert">
          <div className="dashboard-state-icon" aria-hidden="true">!</div>
          <div>
            <h3>Tableau de bord indisponible</h3>
            <p>{dashboardError}</p>
          </div>
          <button type="button" className="btn secondary" onClick={loadData}>
            Reessayer
          </button>
        </section>
      ) : null}

      {!dashboardLoading && !dashboardError && !hasDashboardData ? (
        <section className="card dashboard-state-card dashboard-empty-card">
          <div className="dashboard-state-icon" aria-hidden="true">+</div>
          <div>
            <h3>Demarrez le cabinet en ajoutant un client</h3>
            <p>Le tableau de bord affichera ensuite les dossiers, factures et relances prioritaires.</p>
          </div>
          <Link className="btn" to="/clients">
            Ajouter un client
          </Link>
        </section>
      ) : null}

      <section className="grid-3 dashboard-kpi-strip">
        <article className="card dashboard-kpi-card dashboard-kpi-card-clients">
          <div className="label">Clients</div>
          <div className="kpi">{clients.length}</div>
        </article>
        <article className="card dashboard-kpi-card dashboard-kpi-card-open">
          <div className="label">Dossiers en cours</div>
          <div className="kpi">{openCaseCount}</div>
        </article>
        <article className="card dashboard-kpi-card dashboard-kpi-card-closed">
          <div className="label">Urgents / terminés</div>
          <div className="kpi">{closedCaseCount}</div>
        </article>
      </section>

    </>
  );
};

export default DashboardPage;
