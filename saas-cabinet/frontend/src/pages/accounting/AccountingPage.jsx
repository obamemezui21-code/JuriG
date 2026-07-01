import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Modal from "../../components/Modal";
import { isCaseClosed } from "../../utils/caseStatus";
import { onFinanceUpdate } from "../../utils/financeEvents";
import { notifyActionStatus, startActionLoading, stopActionLoading } from "../../utils/actionFeedback";

const AccountingPage = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [disbursementForm, setDisbursementForm] = useState({
    motif: '',
    utilisateur: '',
    montant: ''
  });

  useEffect(() => {
    const fetchAccountingData = async () => {
      if (!token) return;

      setLoading(true);
      setError("");

      try {
        const [invoicesRes, casesRes] = await Promise.all([
          api.listInvoices(token),
          api.listCases(token),
        ]);

        setInvoices(invoicesRes.invoices || []);
        setCases(casesRes.cases || []);
      } catch (err) {
        console.error("Error fetching accounting data:", err);
        setError(err.message || "Erreur lors du chargement des données comptables");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountingData();
    const unsubscribe = onFinanceUpdate(() => {
      fetchAccountingData();
    });
    return unsubscribe;
  }, [token]);

  const formatAmount = (value, currency = "FCFA") => {
    const amount = Number(value || 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const safeCurrency = String(currency || "FCFA").trim() || "FCFA";

    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: safeCurrency === "FCFA" ? "XAF" : safeCurrency === "EUR" ? "EUR" : safeCurrency,
        maximumFractionDigits: safeCurrency === "FCFA" ? 0 : 2,
      }).format(safeAmount);
    } catch (_error) {
      return `${safeAmount.toLocaleString("fr-FR")} ${safeCurrency}`;
    }
  };

  const formatCompactNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M FCFA`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k FCFA`;
    } else {
      return formatAmount(num);
    }
  };

  const formatXaf = (value) => `${Number(value || 0).toLocaleString("fr-FR")} XAF`;

  const processChartData = () => {
    const monthlyData = {};
    const quarterlyData = {};
    const annualData = {};

    invoices.forEach((invoice) => {
      const date = new Date(invoice.issue_date || invoice.created_at);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      const amount = Number(invoice.total_amount) || 0;

      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { month: monthKey, profit: 0 };
      monthlyData[monthKey].profit += amount;

      const quarterKey = `${year}-Q${quarter}`;
      if (!quarterlyData[quarterKey]) quarterlyData[quarterKey] = { quarter: quarterKey, profit: 0 };
      quarterlyData[quarterKey].profit += amount;

      if (!annualData[year]) annualData[year] = { year: year.toString(), profit: 0 };
      annualData[year].profit += amount;
    });

    return {
      monthly: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
      quarterly: Object.values(quarterlyData).sort((a, b) => a.quarter.localeCompare(b.quarter)),
      annual: Object.values(annualData).sort((a, b) => a.year.localeCompare(b.year))
    };
  };

  // Fonctions de calcul avancées pour version professionnelle
  const calculateKPIs = () => {
    const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const totalPaidInvoices = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
    const outstandingBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);

    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = invoices
      .filter(inv => {
        const invoiceDate = new Date(inv.issue_date || inv.created_at);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

    return {
      totalRevenue: totalBilled,
      invoiceCount: invoices.length,
      outstandingBalance,
      totalOverdue,
      monthlyRevenue,
      collectionRate: totalBilled > 0 ? (totalPaidInvoices / totalBilled) * 100 : 0,
      overdueCount: overdueInvoices.length
    };
  };

  const processAdvancedChartData = () => {
    const clientData = {};
    const serviceData = {};
    const statusData = {};

    invoices.forEach(invoice => {
      const clientName = invoice.client_name || 'Client inconnu';
      if (!clientData[clientName]) clientData[clientName] = { name: clientName, value: 0 };
      clientData[clientName].value += Number(invoice.total_amount) || 0;
    });

    invoices.forEach(invoice => {
      const serviceName = invoice.service_name || 'Service non spécifié';
      if (!serviceData[serviceName]) serviceData[serviceName] = { name: serviceName, value: 0 };
      serviceData[serviceName].value += Number(invoice.total_amount) || 0;
    });

    // Données par statut de dossier client
    cases.forEach((caseItem) => {
      const status = isCaseClosed(caseItem) ? "Terminés" : "En cours";
      if (!statusData[status]) statusData[status] = { name: status, value: 0 };
      statusData[status].value += 1;
    });

    return {
      clients: Object.values(clientData).sort((a, b) => b.value - a.value).slice(0, 10),
      services: Object.values(serviceData).sort((a, b) => b.value - a.value).slice(0, 10),
      status: Object.values(statusData)
    };
  };

  const handleDisbursementSubmit = (e) => {
    e.preventDefault();
    const loadingId = startActionLoading("Enregistrement du decaissement...");
    window.setTimeout(() => {
      stopActionLoading(loadingId);
      notifyActionStatus("success", "Décaissement enregistré.");
      setShowDisbursementModal(false);
      setDisbursementForm({ motif: '', utilisateur: '', montant: '' });
    }, 300);
  };

  const kpis = calculateKPIs();
  const chartData = processChartData();
  const advancedData = processAdvancedChartData();
  const closedCaseCount = advancedData.status.find((item) => item.name === "Terminés")?.value || 0;
  const openCaseCount = advancedData.status.find((item) => item.name === "En cours")?.value || 0;
  const closedStatusData = [{ label: "Terminés", value: closedCaseCount }];
  const openStatusData = [{ label: "En cours", value: openCaseCount }];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des données comptables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="card">
        <div className="accounting-header">
          <h3>🏢 Espace Comptabilité Professionnel</h3>
          <p className="muted">Tableau de bord financier complet du cabinet</p>
        </div>

        {/* KPIs principaux */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h4>Chiffre d'Affaires Total</h4>
              <p className="kpi-value">{formatCompactNumber(kpis.totalRevenue)}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h4>Factures Émises</h4>
              <p className="kpi-value">{kpis.invoiceCount}</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">⏳</div>
            <div className="kpi-content">
              <h4>Créances en Cours</h4>
              <p className="kpi-value">{formatCompactNumber(kpis.outstandingBalance)}</p>
            </div>
          </div>

          <div className="kpi-card warning">
            <div className="kpi-icon">⚠️</div>
            <div className="kpi-content">
              <h4>Créances Impayées</h4>
              <p className="kpi-value">{formatCompactNumber(kpis.totalOverdue)}</p>
              <small>{kpis.overdueCount} factures</small>
            </div>
          </div>

          <div className="kpi-card success">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h4>Taux d'Encaissement</h4>
              <p className="kpi-value">{kpis.collectionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="kpi-card info">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <h4>CA du Mois</h4>
              <p className="kpi-value">{formatCompactNumber(kpis.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="accounting-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Vue d'ensemble
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analyses détaillées
          </button>
          <button
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📋 Rapports
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="accounting-charts">
              <div className="chart-container">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Évolution Annuelle des Revenus</h4>
                    <p className="chart-subtitle">Vue macro de la facturation</p>
                  </div>
                  <span className="chart-badge">Annuel</span>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.annual} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="annualGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCompactNumber(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [formatCompactNumber(value), "Revenus"]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
                      <Bar dataKey="profit" fill="url(#annualGradient)" name="Revenus (FCFA)" radius={[10, 10, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Évolution Trimestrielle</h4>
                    <p className="chart-subtitle">Lecture stratégique par trimestre</p>
                  </div>
                  <span className="chart-badge">Tendance</span>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.quarterly} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="quarterGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCompactNumber(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [formatCompactNumber(value), "Revenus"]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
                      <Line type="monotone" dataKey="profit" stroke="url(#quarterGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }} name="Revenus (FCFA)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Évolution Mensuelle (12 derniers mois)</h4>
                    <p className="chart-subtitle">Pilotage opérationnel mensuel</p>
                  </div>
                  <span className="chart-badge">Mensuel</span>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.monthly} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="monthlyGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCompactNumber(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [formatCompactNumber(value), "Revenus"]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
                      <Line type="monotone" dataKey="profit" stroke="url(#monthlyGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }} name="Revenus (FCFA)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div className="chart-forecast-wrap">
              <div className="chart-container chart-container-wide">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Évolution de l'entreprise</h4>
                    <p className="chart-subtitle">Progression annuelle basée sur les factures émises</p>
                  </div>
                  <span className="chart-badge">Croissance</span>
                </div>
                <div className="chart-body">
                  {chartData.annual.length ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.annual} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                          <defs>
                            <linearGradient id="enterpriseEvolutionAnnual" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#0ea5e9" />
                              <stop offset="100%" stopColor="#38bdf8" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => formatCompactNumber(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <Tooltip formatter={(value) => formatXaf(value)} />
                          <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
                          <Line type="monotone" dataKey="profit" stroke="url(#enterpriseEvolutionAnnual)" strokeWidth={3} dot={false} name="Facturation annuelle" />
                        </LineChart>
                      </ResponsiveContainer>
                      {chartData.annual.length < 2 ? (
                        <p className="chart-note">Ajoutez au moins 2 années de factures pour voir une tendance claire.</p>
                      ) : null}
                    </>
                  ) : (
                    <p className="chart-note">Aucune donnée de facturation disponible pour afficher l'évolution.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-grid">
              <div className="chart-container">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Top 10 Clients par CA</h4>
                    <p className="chart-subtitle">Les clients les plus contributeurs</p>
                  </div>
                  <span className="chart-badge">Top clients</span>
                </div>
                <div className="chart-body chart-body-tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={advancedData.clients} layout="horizontal" margin={{ top: 8, right: 24, left: 80, bottom: 8 }}>
                      <defs>
                        <linearGradient id="clientGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis type="number" tickFormatter={(value) => formatCompactNumber(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
                      <Tooltip formatter={(value) => [formatCompactNumber(value), "CA"]} />
                      <Bar dataKey="value" fill="url(#clientGradient)" radius={[0, 10, 10, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-header">
                  <div>
                    <h4 className="chart-title">Répartition par Service</h4>
                    <p className="chart-subtitle">Poids de chaque service</p>
                  </div>
                  <span className="chart-badge">Services</span>
                </div>
                <div className="chart-body chart-body-tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={advancedData.services}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={135}
                        innerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {advancedData.services.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCompactNumber(value), "CA"]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <div>
                      <h4 className="chart-title">Statut des dossiers clients</h4>
                      <p className="chart-subtitle">Répartition des dossiers en cours vs terminés</p>
                    </div>
                    <span className="chart-badge">Dossiers</span>
                  </div>
                  <div className="chart-body chart-status-body">
                    <div className="chart-status-grid">
                      <div className="chart-status-chart terminated">
                        <div className="chart-status-header">
                          <span className="chart-status-title">Dossiers terminés</span>
                          <span className="chart-status-count">{closedCaseCount}</span>
                        </div>
                        <div className="chart-mini-body">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={closedStatusData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#10b981" name="Terminés" radius={[10, 10, 0, 0]} barSize={36} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="chart-status-chart active">
                        <div className="chart-status-header">
                          <span className="chart-status-title">Dossiers en cours</span>
                          <span className="chart-status-count">{openCaseCount}</span>
                        </div>
                        <div className="chart-mini-body">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={openStatusData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#f97316" name="En cours" radius={[10, 10, 0, 0]} barSize={36} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content">
            <div className="reports-section">
              <h4>📋 Rapports Disponibles</h4>
              <div className="report-buttons">
                <button className="btn btn-secondary">
                  📊 Rapport Mensuel
                </button>
                <button className="btn btn-secondary">
                  📈 Rapport Annuel
                </button>
                <button className="btn btn-secondary">
                  👥 Rapport Clients
                </button>
                <button className="btn btn-secondary">
                  ⚠️ Rapport Impayés
                </button>
                <button className="btn btn-secondary">
                  💰 Rapport Financier
                </button>
              </div>
            </div>

            <div className="recent-activity">
              <h4>🕒 Activité Récente</h4>
              <div className="activity-list">
                {invoices
                  .slice()
                  .sort((left, right) => new Date(right.created_at || right.issue_date || 0) - new Date(left.created_at || left.issue_date || 0))
                  .slice(0, 5)
                  .map(invoice => (
                  <div key={invoice.id} className="activity-item">
                    <div className="activity-icon">💰</div>
                    <div className="activity-content">
                      <p>
                        Facture émise pour {invoice.client_name || "Client inconnu"}
                        {invoice.invoice_number ? ` • Facture ${invoice.invoice_number}` : ""}
                      </p>
                      <small>{new Date(invoice.issue_date || invoice.created_at).toLocaleDateString('fr-FR')}</small>
                    </div>
                    <div className="activity-amount">{formatCompactNumber(invoice.total_amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="disbursement-section">
          <button
            className="btn btn-primary"
            onClick={() => setShowDisbursementModal(true)}
          >
            💸 Nouveau Décaissement
          </button>
        </div>
      </section>

      <Modal
        open={showDisbursementModal}
        title="Nouveau Décaissement"
        onClose={() => setShowDisbursementModal(false)}
        width="600px"
      >
        <form onSubmit={handleDisbursementSubmit} className="disbursement-form">
          <div className="form-group">
            <label htmlFor="motif">Motif du décaissement</label>
            <input
              type="text"
              id="motif"
              value={disbursementForm.motif}
              onChange={(e) => setDisbursementForm({...disbursementForm, motif: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="utilisateur">Nom de l'utilisateur effectuant le décaissement</label>
            <input
              type="text"
              id="utilisateur"
              value={disbursementForm.utilisateur}
              onChange={(e) => setDisbursementForm({...disbursementForm, utilisateur: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="montant">Montant</label>
            <input
              type="number"
              id="montant"
              value={disbursementForm.montant}
              onChange={(e) => setDisbursementForm({...disbursementForm, montant: e.target.value})}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowDisbursementModal(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountingPage;
