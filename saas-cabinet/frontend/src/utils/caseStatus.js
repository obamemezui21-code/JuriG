const CLOSED_CASE_STATUSES = new Set(["closed", "termine", "completed", "done"]);

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

export const isCaseClosed = (caseItem) => {
  const status = normalizeStatus(caseItem.status);
  return CLOSED_CASE_STATUSES.has(status) || Boolean(caseItem.closed_at);
};

export const getClientStatusFromCases = (cases = []) => {
  if (!Array.isArray(cases) || cases.length === 0) {
    return "en_cours";
  }
  return cases.every((caseItem) => isCaseClosed(caseItem)) ? "termine" : "en_cours";
};
