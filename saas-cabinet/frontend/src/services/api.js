import { notifyActionStatus } from "../utils/actionFeedback";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/* ----------------------------- ASSETS URL ----------------------------- */
export const getAssetUrl = (assetPath) => {
  if (!assetPath) return "";

  // If the assetPath is already a full URL, return it as-is.
  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const baseUrl = API_URL.replace(/\/api\/?$/, "");
  const safePath = String(assetPath).replace(/^\/+/, "");
  return `${baseUrl}/${safePath}`;
};

/* ----------------------------- RESPONSE HANDLER ----------------------------- */
const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    let errorData = {};

    if (text) {
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = {};
      }
    }

    const trimmed = String(text || "").trim();
    const looksLikeHtml = trimmed.startsWith("<");
    const fallbackMessage = `HTTP ${response.status} ${response.statusText || ""}`.trim();
    const message = errorData.message || ((!looksLikeHtml && trimmed) || fallbackMessage) || "Une erreur est survenue.";

    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }

  if (response.status === 204) return null;

  return response.json();
};

/* ----------------------------- CORE FETCH ----------------------------- */
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("saas-cabinet-token");
  const method = (options.method || "GET").toUpperCase();
  const shouldNotify = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    config.body = options.body;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await handleResponse(response);

    if (shouldNotify) {
      const defaultSuccessMessage =
        method === "POST"
          ? "Création enregistrée."
          : method === "DELETE"
            ? "Suppression réalisée."
            : "Mise à jour enregistrée.";

      notifyActionStatus("success", options.successMessage || defaultSuccessMessage);
    }

    return data;
  } catch (error) {
    if (shouldNotify) {
      const defaultErrorMessage =
        method === "POST"
          ? "Échec de création."
          : method === "DELETE"
            ? "Échec de suppression."
            : "Échec de mise à jour.";

      notifyActionStatus("error", options.errorMessage || error.message || defaultErrorMessage);
    }

    throw error;
  }
};

/* ----------------------------- AUTH ----------------------------- */
const login = (credentials) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

const register = (userData) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

const forgotPassword = (payload) =>
  apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const resetPassword = (payload) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const me = () => apiFetch("/auth/me");

/* ----------------------------- ORGANIZATION ----------------------------- */
const organization = {
  get: () => apiFetch("/organization/me"),

  update: (data) =>
    apiFetch("/organization/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getThemes: () => apiFetch("/organization/themes"),
};

/* ----------------------------- USERS ----------------------------- */
const users = {
  list: () => apiFetch("/users"),
  create: (data) =>
    apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiFetch(`/users/${id}`, {
      method: "DELETE",
    }),
};

/* ----------------------------- CLIENTS ----------------------------- */
const clients = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/clients${query ? `?${query}` : ""}`);
  },

  create: (data) =>
    apiFetch("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/clients/${id}`),

  update: (id, data) =>
    apiFetch(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/clients/${id}`, {
      method: "DELETE",
    }),

  getProcedures: (id) => apiFetch(`/clients/${id}/procedures`),

  updateProcedures: (id, procedureIds) =>
    apiFetch(`/clients/${id}/procedures`, {
      method: "PUT",
      body: JSON.stringify({ procedureIds }),
    }),
};

/* ----------------------------- CASES ----------------------------- */
const cases = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/cases${query ? `?${query}` : ""}`);
  },

  create: (data) =>
    apiFetch("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/cases/${id}`),

  update: (id, data) =>
    apiFetch(`/cases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/cases/${id}`, {
      method: "DELETE",
    }),
};

/* ----------------------------- PROCEDURES ----------------------------- */
const procedures = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/procedures${query ? `?${query}` : ""}`);
  },

  create: (data) =>
    apiFetch("/procedures", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/procedures/${id}`),

  update: (id, data) =>
    apiFetch(`/procedures/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/procedures/${id}`, {
      method: "DELETE",
    }),
};

/* ----------------------------- INVOICES ----------------------------- */
const invoices = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/invoices${query ? `?${query}` : ""}`);
  },

  get: (id) => apiFetch(`/invoices/${id}`),

  create: (data) =>
    apiFetch("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiFetch(`/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/invoices/${id}`, {
      method: "DELETE",
    }),

  getSummary: () => apiFetch("/invoices/summary"),

  payments: {
    list: (id) => apiFetch(`/invoices/${id}/payments`),

    create: (id, data) =>
      apiFetch(`/invoices/${id}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};

/* ----------------------------- PAYMENTS ----------------------------- */
const payments = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/payments${query ? `?${query}` : ""}`);
  },

  getSummary: () => apiFetch("/payments/summary"),
  syncInvoices: () =>
    apiFetch("/payments/sync-invoices", {
      method: "POST",
    }),
  syncHistory: () => apiFetch("/payments/sync-history"),

  create: (data) =>
    apiFetch("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiFetch(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/payments/${id}`, {
      method: "DELETE",
    }),
};

/* -------------------------- DISBURSEMENTS -------------------------- */
const disbursements = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      return await apiFetch(`/expenses${query ? `?${query}` : ""}`);
    } catch (error) {
      if (error.status === 404) {
        return apiFetch(`/disbursements${query ? `?${query}` : ""}`);
      }
      throw error;
    }
  },

  create: async (data) => {
    try {
      return await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error.status === 404) {
        return apiFetch("/disbursements", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      return await apiFetch(`/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error.status === 404) {
        return apiFetch(`/disbursements/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await apiFetch(`/expenses/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error.status === 404) {
        return apiFetch(`/disbursements/${id}`, {
          method: "DELETE",
        });
      }
      throw error;
    }
  },
};

/* ----------------------------- SERVICES ----------------------------- */
const services = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/services${query ? `?${query}` : ""}`);
  },

  create: (data) =>
    apiFetch("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiFetch(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/services/${id}`, {
      method: "DELETE",
    }),
};

/* ----------------------------- EXPORT API ----------------------------- */
export const api = {
  login,
  register,
  forgotPassword,
  resetPassword,
  me,
  organization,
  users,
  clients,
  cases,
  procedures,
  invoices,
  payments,
  disbursements,
  services,
};

// Legacy helper methods for backwards compatibility
api.listClients = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.clients.list(resolvedParams);
};
api.createClient = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.clients.create(resolvedData);
};
api.getClient = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.clients.get(resolvedId);
};
api.updateClient = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.clients.update(resolvedId, resolvedData);
};
api.deleteClient = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.clients.delete(resolvedId);
};
api.listClientProcedures = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.clients.getProcedures(resolvedId);
};
api.updateClientProcedures = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.clients.updateProcedures(resolvedId, resolvedData);
};
api.updateClientStatus = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return apiFetch(`/clients/${resolvedId}/status`, {
    method: "PATCH",
    body: JSON.stringify(resolvedData),
  });
};

api.listCases = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.cases.list(resolvedParams);
};
api.createCase = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.cases.create(resolvedData);
};
api.getCase = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.cases.get(resolvedId);
};
api.updateCase = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.cases.update(resolvedId, resolvedData);
};
api.deleteCase = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.cases.delete(resolvedId);
};

api.listProcedures = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.procedures.list(resolvedParams);
};
api.createProcedure = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.procedures.create(resolvedData);
};
api.getProcedure = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.procedures.get(resolvedId);
};
api.updateProcedure = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.procedures.update(resolvedId, resolvedData);
};
api.deleteProcedure = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.procedures.delete(resolvedId);
};

api.listInvoices = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.invoices.list(resolvedParams);
};
api.createInvoice = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.invoices.create(resolvedData);
};
api.updateInvoice = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.invoices.update(resolvedId, resolvedData);
};
api.deleteInvoice = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.invoices.delete(resolvedId);
};
api.getInvoiceSummary = () => api.invoices.getSummary();

api.getOrganization = () => api.organization.get();
api.updateOrganization = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.organization.update(resolvedData);
};

api.listPayments = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.payments.list(resolvedParams);
};
api.createPayment = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.payments.create(resolvedData);
};
api.updatePayment = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.payments.update(resolvedId, resolvedData);
};
api.deletePayment = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.payments.delete(resolvedId);
};

api.listDisbursements = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.disbursements.list(resolvedParams);
};
api.createDisbursement = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.disbursements.create(resolvedData);
};
api.getPaymentSummary = () => api.payments.getSummary();

api.listServices = (tokenOrParams, params) => {
  const resolvedParams = typeof tokenOrParams === "string" ? params : tokenOrParams;
  return api.services.list(resolvedParams);
};
api.createService = (tokenOrData, data) => {
  const resolvedData = typeof tokenOrData === "string" ? data : tokenOrData;
  return api.services.create(resolvedData);
};
api.updateService = (tokenOrId, idOrData, data) => {
  const resolvedId = typeof tokenOrId === "string" ? idOrData : tokenOrId;
  const resolvedData = typeof tokenOrId === "string" ? data : idOrData;
  return api.services.update(resolvedId, resolvedData);
};
api.deleteService = (tokenOrId, id) => {
  const resolvedId = typeof tokenOrId === "string" ? id : tokenOrId;
  return api.services.delete(resolvedId);
};

// Special methods that might need custom handling
api.uploadCaseDocuments = async (token, caseId, labeledFiles) => {
  const formData = new FormData();
  
  // Add files and labels
  labeledFiles.forEach((item, index) => {
    if (item.file) {
      formData.append('documents', item.file);
      formData.append('labels', item.label || `Document ${index + 1}`);
    }
  });

  const authToken = localStorage.getItem("saas-cabinet-token");
  const config = {
    method: 'POST',
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: formData,
  };

  return fetch(`${API_URL}/cases/${caseId}/documents`, config).then(handleResponse);
};

api.uploadClientPhoto = async (token, clientId, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);

  const authToken = localStorage.getItem("saas-cabinet-token");
  const config = {
    method: 'POST',
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: formData,
  };

  try {
    const response = await fetch(`${API_URL}/clients/${clientId}/photo`, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(errorData.message || "Upload failed");
    }
    return response.json();
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
};

api.uploadOrganizationLogo = async (token, logoFile) => {
  const formData = new FormData();
  formData.append('logo', logoFile);

  const authToken = localStorage.getItem("saas-cabinet-token");
  const config = {
    method: 'POST',
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: formData,
  };

  try {
    const response = await fetch(`${API_URL}/organization/me/logo`, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(errorData.message || "Upload failed");
    }
    return response.json();
  } catch (error) {
    console.error('Organization logo upload error:', error);
    throw error;
  }
};
