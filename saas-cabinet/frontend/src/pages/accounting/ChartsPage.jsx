import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { buildFinanceSummary, buildMonthlyRevenue } from "../../utils/financeMetrics";
import { onFinanceUpdate } from "../../utils/financeEvents";

const ChartsPage = () => {
  const [chartData, setChartData] = useState({
    paymentStatus: [],
    caseStatusSummary: { closed: 0, open: 0 },
    annualRevenue: [],
    monthlyGrowth: [],
  });
  const [loading, setLoading] = useState(true);

  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      const invoiceResponse = await api.invoices.list();
      const clientsResponse = await api.clients.list();

      const invoices = invoiceResponse.invoices || [];
      const clients = clientsResponse.clients || [];

      const monthlyRevenueRaw = buildMonthlyRevenue(invoices);
      const revenueByKey = new Map(
        monthlyRevenueRaw.map((entry) => [entry.key, Math.round(entry.amount)])
      );
      const now = new Date();
      const currentYear = now.getFullYear();
      const monthlyGrowth = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(currentYear, index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = date.toLocaleDateString("fr-FR", { month: "short" });
        return {
          month: label,
          amount: revenueByKey.get(key) || 0,
        };
      });

      // Annual revenue (invoiced amounts)
      const annualMap = {};
      invoices.forEach((invoice) => {
        const rawDate = invoice.issue_date || invoice.created_at;
        if (!rawDate) return;
        const year = new Date(rawDate).getFullYear();
        if (!annualMap[year]) {
          annualMap[year] = 0;
        }
        annualMap[year] += Number(invoice.total_amount || 0);
      });
      const annualRevenue = Object.entries(annualMap)
        .map(([year, amount]) => ({
          year: Number(year),
          amount: Math.round(amount),
        }))
        .sort((a, b) => a.year - b.year);

      // Invoice settlement pie
      const summary = buildFinanceSummary(invoices);
      const paidAmount = summary.totalPaid;
      const pendingAmount = summary.totalPending;

      const paymentStatus = [
        { name: "Paye", value: Math.round(paidAmount) },
        { name: "En attente", value: Math.round(pendingAmount) },
      ];

      // Case status breakdown (based on client status)
      const caseStatusSummary = clients.reduce(
        (acc, client) => {
          const status = String(client.status || "").trim().toLowerCase();
          if (status === "urgent" || status === "pret" || status === "termine") {
            acc.closed += 1;
          } else {
            acc.open += 1;
          }
          return acc;
        },
        { closed: 0, open: 0 }
      );

      setChartData({
        paymentStatus,
        caseStatusSummary,
        annualRevenue,
        monthlyGrowth,
      });
    } catch (error) {
      console.error("Erreur chargement graphiques:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChartData();
    const unsubscribe = onFinanceUpdate(() => {
      loadChartData();
    });
    return unsubscribe;
  }, [loadChartData]);

  const formatXaf = (value) => `${Number(value || 0).toLocaleString("fr-FR")} XAF`;
  const closedStatusData = [{ label: "Urgents / termines", value: chartData.caseStatusSummary.closed }];
  const openStatusData = [{ label: "En cours", value: chartData.caseStatusSummary.open }];
  const COLORS = ["#2563eb", "#f97316", "#10b981", "#a855f7", "#facc15"];

  const renderPaymentLegend = ({ payload }) => {
    if (!payload || !payload.length) {
      return null;
    }
    return (
      <ul className="chart-legend">
        {payload.map((entry, index) => {
          const amount = formatXaf(entry.payload.value);
          return (
            <li key={`legend-${index}`} className="chart-legend-item">
              <span className="chart-legend-dot" style={{ background: entry.color }} />
              <span className="chart-legend-amount">{amount}</span>
            </li>
          );
        })}
      </ul>
    );
  };


  if (loading) {
    return (
      <section className="card">
        <p>Chargement des graphiques...</p>
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <div className="accounting-header">
          <h3>Graphiques financiers</h3>
          <p className="muted">Visualisez vos données financières en temps réel.</p>
        </div>

        <div className="accounting-charts">
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h4 className="chart-title">État des factures</h4>
                <p className="chart-subtitle">Montants encaissés vs reste à percevoir</p>
              </div>
              <span className="chart-badge">Factures</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.paymentStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatXaf(value)} />
                  <Legend content={renderPaymentLegend} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h4 className="chart-title">Statut des dossiers clients</h4>
                <p className="chart-subtitle">Répartition des clients en cours vs urgents ou terminés</p>
              </div>
              <span className="chart-badge">Dossiers</span>
            </div>
            <div className="chart-body chart-status-body">
              <div className="chart-status-grid">
                <div className="chart-status-chart terminated">
                  <div className="chart-status-header">
                    <span className="chart-status-title">Urgents / terminés</span>
                    <span className="chart-status-count">{chartData.caseStatusSummary.closed}</span>
                  </div>
                  <div className="chart-mini-body">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={closedStatusData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#dc2626" name="Urgents / terminés" radius={[10, 10, 0, 0]} barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="chart-status-chart active">
                  <div className="chart-status-header">
                    <span className="chart-status-title">Dossiers en cours</span>
                    <span className="chart-status-count">{chartData.caseStatusSummary.open}</span>
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

        <div className="chart-forecast-wrap">
          <div className="chart-container chart-container-wide">
            <div className="chart-header">
              <div>
                <h4 className="chart-title">Évolution de l'entreprise</h4>
                <p className="chart-subtitle">Évolution de la facturation depuis janvier</p>
              </div>
              <span className="chart-badge">Croissance</span>
            </div>
            <div className="chart-body">
              {chartData.monthlyGrowth.length ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.monthlyGrowth} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="enterpriseEvolution" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#38bdf8" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} interval={0} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatXaf(value)} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatXaf(value)} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 8 }} />
                      <Line type="monotone" dataKey="amount" stroke="url(#enterpriseEvolution)" strokeWidth={4} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Facturation mensuelle" />
                    </LineChart>
                  </ResponsiveContainer>
                  {chartData.monthlyGrowth.length < 2 ? (
                    <p className="chart-note">Ajoutez au moins 2 mois de factures pour voir une tendance claire.</p>
                  ) : null}
                </>
              ) : (
                <p className="chart-note">Aucune donnée de facturation disponible pour afficher l'évolution.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ChartsPage;




