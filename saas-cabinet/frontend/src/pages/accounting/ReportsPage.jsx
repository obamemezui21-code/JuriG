import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, getAssetUrl } from "../../services/api";
import { onFinanceUpdate } from "../../utils/financeEvents";
import { exportRowsToExcel } from "../../utils/excelExport";
import { ExcelFileIcon, PdfFileIcon } from "../../components/ExportIcons";
import { defaultAppLogo } from "../../assets/branding";

const PAYMENT_MOVEMENT_STATUSES = new Set(["paid", "partial"]);
const REPORTS_PERIOD_EVENT = "app:reports-period";

const ReportsPage = () => {
  const { organization } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movementFilter, setMovementFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedMonth, setSelectedMonth] = useState("");

  const getEffectiveRange = useCallback(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end };
    }

    let start = null;
    let end = null;

    if (dateRange.startDate) {
      start = new Date(`${dateRange.startDate}T00:00:00`);
    }

    if (dateRange.endDate) {
      end = new Date(`${dateRange.endDate}T23:59:59`);
    }

    return { start, end };
  }, [dateRange.endDate, dateRange.startDate, selectedMonth]);

  const extractDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isWithinRange = (value, start, end) => {
    if (!value) return false;
    if (start && value < start) return false;
    if (end && value > end) return false;
    return true;
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsResponse, disbursementsResponse] = await Promise.all([
        api.listPayments(),
        api.listDisbursements(),
      ]);

      const payments = paymentsResponse.payments || [];
      const disbursements = disbursementsResponse.disbursements || [];

      const { start, end } = getEffectiveRange();

      const paymentOperations = payments
        .filter((payment) => PAYMENT_MOVEMENT_STATUSES.has(String(payment.status || "").trim().toLowerCase()))
        .map((payment) => {
          const operationDate = extractDate(payment.created_at || payment.paid_at);
          const paymentId = payment.id != null ? String(payment.id) : "";
          const invoiceReference = payment.invoice_number ? `FAC-${payment.invoice_number}` : "";
          return {
            id: `payment-${payment.id}`,
            date: operationDate,
            rawDate: payment.created_at || payment.paid_at || "",
            movementType: "entree",
            movementLabel: "Entrée",
            operationType: payment.invoice_id ? "Paiement client" : "Encaissement",
            amount: Number(payment.amount || 0),
            currency: payment.currency || "XAF",
            source: payment.client_name || payment.invoice_number || "Client non renseigné",
            reference: invoiceReference || (paymentId ? `PAI-${paymentId}` : "-"),
            description: [
              payment.invoice_number ? `Facture ${payment.invoice_number}` : "",
              payment.case_title ? `Dossier: ${payment.case_title}` : "",
              payment.notes || "",
            ]
              .filter(Boolean)
              .join(" • ") || "Paiement client enregistré",
          };
        })
        .filter((operation) => isWithinRange(operation.date, start, end));

      const disbursementOperations = disbursements
        .map((item) => {
          const operationDate = extractDate(item.created_at || item.transaction_date);
          const disbursementId = item.id != null ? String(item.id) : "";
          const motifLabel = item.motif || "Autre";
          return {
            id: `disbursement-${item.id}`,
            date: operationDate,
            rawDate: item.created_at || item.transaction_date || "",
            movementType: "sortie",
            movementLabel: "Sortie",
            operationType: "Décaissement",
            amount: Number(item.amount || 0),
            currency: item.currency || "XAF",
            source: item.user_label || item.created_by_name || item.utilisateur || "Cabinet",
            reference: disbursementId ? `DEC-${disbursementId}` : "-",
            description: [
              `Motif: ${motifLabel}`,
              item.description || "",
            ]
              .filter(Boolean)
              .join(" • ") || "Décaissement enregistré",
          };
        })
        .filter((operation) => isWithinRange(operation.date, start, end));

      const operations = [...paymentOperations, ...disbursementOperations].sort((left, right) => {
        const leftTime = left.date ? left.date.getTime() : 0;
        const rightTime = right.date ? right.date.getTime() : 0;
        return rightTime - leftTime;
      });

      const totalEntries = paymentOperations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalExits = disbursementOperations.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      setReportData({
        operations,
        incomingOperations: paymentOperations,
        outgoingOperations: disbursementOperations,
        totalEntries,
        totalExits,
        netFlow: totalEntries - totalExits,
        range: { start, end },
      });
    } catch (error) {
      console.error("Erreur lecture rapports:", error);
    } finally {
      setLoading(false);
    }
  }, [getEffectiveRange]);

  useEffect(() => {
    loadReport();
    const unsubscribe = onFinanceUpdate(() => {
      loadReport();
    });
    return unsubscribe;
  }, [loadReport]);

  useEffect(() => {
    if (selectedMonth) {
      loadReport();
    }
  }, [loadReport, selectedMonth]);

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setSelectedMonth("");
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (event) => {
    const value = event.target.value;
    setSelectedMonth(value);
    if (value) {
      const [year, month] = value.split("-").map(Number);
      const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const end = new Date(year, month, 0).toISOString().split("T")[0];
      setDateRange({ startDate: start, endDate: end });
    }
  };

  const formatXaf = (value) => `${Math.round(Number(value || 0)).toLocaleString("fr-FR")} XAF`;

  const normalizeSearchValue = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const formatDateTime = (value) => {
    if (!value) return { date: "-", time: "-" };
    return {
      date: value.toLocaleDateString("fr-FR"),
      time: value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });

  const monthOptions = Array.from({ length: 12 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return { value, label };
  });

  const filteredOperations = (reportData?.operations || []).filter((operation) => {
    if (movementFilter === "all") return true;
    return operation.movementType === movementFilter;
  });

  const normalizedSearchTerm = normalizeSearchValue(searchTerm);
  const searchedOperations = filteredOperations.filter((operation) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    const searchableContent = [
      operation.source,
      operation.description,
      operation.reference,
      operation.amount,
      formatXaf(operation.amount),
    ]
      .map((value) => normalizeSearchValue(value))
      .join(" ");

    return searchableContent.includes(normalizedSearchTerm);
  });

  const filteredIncomingOperations = searchedOperations.filter((operation) => operation.movementType === "entree");
  const filteredOutgoingOperations = searchedOperations.filter((operation) => operation.movementType === "sortie");
  const filteredTotalEntries = filteredIncomingOperations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filteredTotalExits = filteredOutgoingOperations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filteredNetFlow = filteredTotalEntries - filteredTotalExits;
  const movementFilterLabel =
    movementFilter === "entree" ? "Entrées uniquement" : movementFilter === "sortie" ? "Sorties uniquement" : "Toutes les opérations";

  const operationRows = searchedOperations.map((operation) => {
    const { date, time } = formatDateTime(operation.date);
    return {
      date: `${date} ${time}`,
      reference: operation.reference || "-",
      category: operation.movementLabel,
      amount: formatXaf(operation.amount),
      source: operation.source,
    };
  });

  const handleExportExcel = () => {
    exportRowsToExcel({
      fileName: "rapport-mouvements-financiers",
      sheetName: "Mouvements financiers",
      columns: [
        { header: "Date et heure", key: "date" },
        { header: "Référence", key: "reference" },
        { header: "Catégorie", key: "category" },
        { header: "Montant", key: "amount" },
        { header: "Client / Source", key: "source" },
      ],
      rows: operationRows,
    });
  };

  const handleExportPdf = () => {
    const periodLabel = reportData?.range?.start && reportData?.range?.end
        ? `${reportData.range.start.toLocaleDateString("fr-FR")} - ${reportData.range.end.toLocaleDateString("fr-FR")}`
      : "Période complète";
    const logoPath = organization?.logoUrl || organization?.logo_url || "";
    const logoUrl = (logoPath ? getAssetUrl(logoPath) : "") || defaultAppLogo;

    const html = `
      <html>
        <head>
          <title>Rapport des mouvements financiers</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; background: #f3f6fb; }
            .sheet {
              position: relative;
              max-width: 900px;
              margin: 0 auto;
              padding: 24px;
              background: #ffffff;
              border: 1px solid #ddd;
              border-radius: 16px;
              overflow: hidden;
            }
            .watermark {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.06;
              pointer-events: none;
            }
            .watermark img {
              width: 60%;
              max-width: 520px;
              height: auto;
              filter: grayscale(100%);
            }
            .content { position: relative; z-index: 1; }
            h1 { margin-bottom: 8px; }
            p { margin-top: 0; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${logoUrl ? `<div class="watermark"><img src="${escapeHtml(logoUrl)}" alt="Logo filigrane" /></div>` : ""}
            <div class="content">
              <h1>Rapport des mouvements financiers</h1>
              <p>Période: ${escapeHtml(periodLabel)}</p>
              <p>Vue: ${escapeHtml(movementFilterLabel)}</p>
              <table>
                <thead>
                  <tr>
                    <th>Date et heure</th>
                    <th>Référence</th>
                    <th>Catégorie</th>
                    <th>Montant</th>
                    <th>Client / Source</th>
                  </tr>
                </thead>
                <tbody>
                  ${operationRows
                    .map(
                      (row) =>
                        `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.reference)}</td><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.amount)}</td><td>${escapeHtml(row.source)}</td></tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const periodLabel = reportData?.range?.start && reportData?.range?.end
    ? `${reportData.range.start.toLocaleDateString("fr-FR")} - ${reportData.range.end.toLocaleDateString("fr-FR")}`
    : "Période complète";
  const totalMovements = searchedOperations.length;
  const entryRate = totalMovements
    ? Math.round((filteredIncomingOperations.length / totalMovements) * 100)
    : 0;
  const averageMovementAmount = totalMovements
    ? (filteredTotalEntries + filteredTotalExits) / totalMovements
    : 0;
  const reportSummaryCards = reportData
    ? [
        {
          label: "Opérations",
          value: totalMovements,
          tone: "volume",
          accent: `${filteredIncomingOperations.length} entrées • ${filteredOutgoingOperations.length} sorties`,
        },
        {
          label: "Entrées",
          value: formatXaf(filteredTotalEntries),
          tone: "revenue",
          accent: `${entryRate}% des mouvements • moyenne ${formatXaf(averageMovementAmount)}`,
        },
        {
          label: "Sorties",
          value: formatXaf(filteredTotalExits),
          tone: "paid",
          accent: `${Math.max(0, 100 - entryRate)}% des mouvements`,
        },
        {
          label: "Solde net",
          value: formatXaf(filteredNetFlow),
          tone: "pending",
          accent: filteredNetFlow >= 0 ? "Flux positif sur la période" : "Flux sortant supérieur aux entrées",
        },
      ]
    : [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    window.dispatchEvent(new CustomEvent(REPORTS_PERIOD_EVENT, { detail: { periodLabel } }));

    return () => {
      window.dispatchEvent(new CustomEvent(REPORTS_PERIOD_EVENT, { detail: { periodLabel: "" } }));
    };
  }, [periodLabel]);

  if (loading) {
    return (
      <section className="card reports-loading-card">
        <div className="reports-loading-shell">
          <div className="spinner" />
          <p>Chargement des rapports...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {reportData ? (
        <>
          <section className="card reports-filters-card">
            <div className="reports-section-head">
              <div>
                <h3>Synthèse des mouvements</h3>
                <p className="muted">Vue d'ensemble des opérations, entrées, sorties et du solde net sur la période sélectionnée.</p>
              </div>
            </div>
            <div className="reports-summary-grid">
              {reportSummaryCards.map((item) => (
                <article key={item.label} className={`kpi-card report-summary-card report-summary-card-${item.tone}`}>
                  <p className="kpi-label">{item.label}</p>
                  <p className="kpi-value">{item.value}</p>
                  <span className="report-summary-accent">{item.accent}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="card reports-table-card">
            <div className="reports-table-head">
              <div>
                <h3>Journal complet des opérations</h3>
                <p className="muted">Chaque ligne représente un mouvement financier trié par ordre de création, de la plus récente à la plus ancienne.</p>
              </div>
              <div className="reports-head-actions">
                <div className="reports-operations-overview">
                  <div className="reports-operation-chip reports-operation-chip-entry">
                    <span>Entrées</span>
                    <strong>{filteredIncomingOperations.length}</strong>
                  </div>
                  <div className="reports-operation-chip reports-operation-chip-exit">
                    <span>Sorties</span>
                    <strong>{filteredOutgoingOperations.length}</strong>
                  </div>
                </div>
                <div className="reports-export-row">
                  <button
                    type="button"
                    className="icon-action-btn export-file-btn export-file-btn-pdf"
                    onClick={handleExportPdf}
                    title="Télécharger PDF"
                    aria-label="Télécharger PDF"
                  >
                    <PdfFileIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn export-file-btn export-file-btn-excel"
                    onClick={handleExportExcel}
                    title="Télécharger Excel"
                    aria-label="Télécharger Excel"
                  >
                    <ExcelFileIcon />
                  </button>
                </div>
              </div>
            </div>
            <div className="reports-table-tools">
              <div className="reports-filter-grid">
                <label className="reports-filter-field reports-filter-field-inline">
                  <span className="reports-filter-label">Période manuelle</span>
                  <div className="reports-filter-inline-row">
                    <input
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateChange}
                    />
                    <input
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateChange}
                    />
                  </div>
                </label>
                <label className="reports-filter-field">
                  <span className="reports-filter-label">Raccourci mensuel</span>
                  <select value={selectedMonth} onChange={handleMonthChange}>
                    <option value="">Mois (tous)</option>
                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="reports-filter-field">
                  <span className="reports-filter-label">Type de mouvement</span>
                  <select value={movementFilter} onChange={(event) => setMovementFilter(event.target.value)}>
                    <option value="all">Toutes les opérations</option>
                    <option value="entree">Entrées uniquement</option>
                    <option value="sortie">Sorties uniquement</option>
                  </select>
                </label>
                <label className="reports-filter-field reports-filter-search-field">
                  <span className="reports-filter-label">Recherche</span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Client, description, montant ou référence"
                  />
                </label>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table reports-summary-table">
                <thead>
                  <tr>
                    <th>Date et heure</th>
                    <th>Référence</th>
                    <th>Catégorie</th>
                    <th>Montant</th>
                    <th>Client / Source</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedOperations.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Aucun mouvement trouvé pour ce filtre sur cette période.</td>
                    </tr>
                  ) : (
                    searchedOperations.map((operation) => {
                      const { date, time } = formatDateTime(operation.date);
                      return (
                      <tr key={operation.id}>
                        <td>{date} à {time}</td>
                        <td className="reports-reference-cell">{operation.reference || "-"}</td>
                        <td>
                          <span className={`reports-category-badge reports-category-badge-${operation.movementType}`}>
                            {operation.movementLabel}
                          </span>
                        </td>
                        <td className={`reports-amount-cell reports-amount-cell-${operation.movementType}`}>
                          {operation.movementType === "entree" ? "+" : "-"}{formatXaf(operation.amount)}
                        </td>
                        <td>{operation.source}</td>
                      </tr>
                    );})
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
};

export default ReportsPage;
