export const formatClientCode = (clientId) => {
  const parsed = Number(clientId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return "CL-000000";
  }

  return `CL-${String(parsed).padStart(6, "0")}`;
};

