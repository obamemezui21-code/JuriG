const toNumber = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
};

const buildMonthBucket = (rawDate) => {
  if (!rawDate) {
    return { key: "unknown", label: "Sans date", sortKey: Number.POSITIVE_INFINITY };
  }
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return { key: "unknown", label: "Sans date", sortKey: Number.POSITIVE_INFINITY };
  }
  const year = date.getFullYear();
  const month = date.getMonth();
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
  const sortKey = new Date(year, month, 1).getTime();
  return { key, label, sortKey };
};

export const buildMonthlyRevenue = (invoices) => {
  const buckets = new Map();
  (invoices || []).forEach((inv) => {
    const rawDate = inv.issue_date || inv.created_at || null;
    const bucket = buildMonthBucket(rawDate);
    const current = buckets.get(bucket.key) || { ...bucket, amount: 0 };
    current.amount += toNumber(inv.total_amount);
    buckets.set(bucket.key, current);
  });

  return Array.from(buckets.values()).sort((a, b) => a.sortKey - b.sortKey);
};

export const sumInvoicesAmount = (invoices) =>
  (invoices || []).reduce((sum, inv) => sum + toNumber(inv.total_amount), 0);

export const sumPaymentsAmount = (payments) =>
  (payments || []).reduce((sum, pmt) => sum + toNumber(pmt.amount), 0);

export const buildFinanceSummary = (invoices, payments = []) => {
  const totalRevenue = sumInvoicesAmount(invoices);
  const totalPaid = (invoices || []).reduce((sum, inv) => sum + toNumber(inv.paid_amount), 0);
  const totalPending = (invoices || []).reduce((sum, inv) => sum + toNumber(inv.balance_due), 0);

  return {
    totalInvoices: (invoices || []).length,
    totalRevenue,
    totalPaid,
    totalPending,
  };
};
