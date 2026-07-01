import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { exportRowsToExcel } from "../../utils/excelExport";
import Modal from "../../components/Modal";
import { ExcelFileIcon } from "../../components/ExportIcons";
import { formatClientCode } from "../../utils/clientCode";

const ITEMS_PER_PAGE = 15;
const emptyProcedureForm = {
  intitule: "",
  montant: "",
  clientId: "",
  serviceId: "",
};

const mapProcedureToForm = (procedure) => ({
  intitule: procedure?.title || "",
  montant: procedure?.montant !== undefined && procedure?.montant !== null ? String(procedure.montant) : "",
  clientId: procedure?.client_id ? String(procedure.client_id) : "",
  serviceId: procedure?.service_id ? String(procedure.service_id) : "",
});

const formatExportDate = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
};

const ProceduresPage = () => {
  const { token } = useAuth();

  const [procedures, setProcedures] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState(emptyProcedureForm);
  const [editForm, setEditForm] = useState(emptyProcedureForm);

  const selectedService = services.find((service) => Number(service.id) === Number(form.serviceId)) || null;

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [proceduresRes, clientsRes, servicesRes] = await Promise.all([
        api.listProcedures(token),
        api.listClients(token),
        api.listServices(token),
      ]);

      setProcedures((proceduresRes.procedures || []).filter(Boolean));
      setClients(clientsRes.clients || []);
      setServices(servicesRes.services || []);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.createProcedure(token, {
        intitule: form.intitule,
        montant: Number(form.montant || 0),
        clientId: form.clientId ? Number(form.clientId) : null,
        serviceId: form.serviceId ? Number(form.serviceId) : null,
      });

      setForm({
        ...emptyProcedureForm,
      });
      setCreateModalOpen(false);

      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInput = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (procedure) => {
    setSelectedProcedure(procedure);
    setEditForm(mapProcedureToForm(procedure));
    setEditModalOpen(true);
  };

  const openDeleteModal = (procedure) => {
    setSelectedProcedure(procedure);
    setDeleteModalOpen(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProcedure?.id) {
      return;
    }

    setEditSubmitting(true);
    setError("");

    try {
      await api.updateProcedure(token, selectedProcedure.id, {
        intitule: editForm.intitule,
        montant: Number(editForm.montant || 0),
      });

      setEditModalOpen(false);
      setSelectedProcedure(null);
      setEditForm(emptyProcedureForm);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProcedure = async () => {
    if (!selectedProcedure?.id) {
      return;
    }

    setDeleteSubmitting(true);
    setError("");

    try {
      await api.deleteProcedure(token, selectedProcedure.id);
      setDeleteModalOpen(false);
      setSelectedProcedure(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExportProcedures = () => {
    const rows = procedures.filter(Boolean).map((procedure) => ({
      intitule: procedure?.title || "",
      montant: Number(procedure?.montant || 0),
      client: procedure?.client_id
        ? `${formatClientCode(procedure.client_id)} - ${procedure.client_name || ""}`
        : procedure?.client_name || "",
      service: procedure?.service_name || "",
      priorite: procedure?.priority || "",
      echeance: formatExportDate(procedure?.expected_deadline),
      termineeLe: formatExportDate(procedure?.completed_at),
      dateCreation: formatExportDate(procedure?.created_at),
    }));

    exportRowsToExcel({
      fileName: "procedures-cabinet.xlsx",
      sheetName: "Procédures",
      columns: [
        { key: "intitule", label: "Intitulé" },
        { key: "montant", label: "Montant" },
        { key: "client", label: "Client" },
        { key: "service", label: "Service" },
        { key: "priorite", label: "Priorité" },
        { key: "echeance", label: "Échéance" },
        { key: "termineeLe", label: "Terminée le" },
        { key: "dateCreation", label: "Date de création" },
      ],
      rows,
    });
  };

  const safeProcedures = procedures.filter(Boolean);
  const totalPages = Math.max(1, Math.ceil(safeProcedures.length / ITEMS_PER_PAGE));
  const paginatedProcedures = safeProcedures.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <section className="card split-grid">
        <div>
          <h3>Nouveau document de procédure</h3>
          <p className="muted">Enregistrez rapidement une nouvelle demande client.</p>
        </div>
        <div className="inline" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => setCreateModalOpen(true)}>
            Ajouter procédure
          </button>
        </div>
      </section>

      <section className="card">
        <div className="inline row-between">
          <h3>Suivi des procédures</h3>
          <div className="inline">
            <button
              type="button"
              className="icon-action-btn export-file-btn export-file-btn-excel"
              onClick={handleExportProcedures}
              disabled={!procedures.length}
              title="Télécharger Excel"
              aria-label="Télécharger Excel"
            >
              <ExcelFileIcon />
            </button>
          </div>
        </div>

        {loading ? <p>Chargement...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !procedures.length ? <p className="muted">Aucune procédure enregistrée.</p> : null}

        <ul className="data-list">
          {paginatedProcedures.map((procedure) => (
            <li key={procedure.id} className="data-row stack-mobile">
              <div>
                <strong>{procedure?.title || "Procédure sans titre"}</strong>
                <div className="inline">
                  <span className="pill pill-soft">{procedure?.priority || "-"}</span>
                  <span className="muted">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF" }).format(
                      Number(procedure?.montant || 0)
                    )}
                  </span>
                  {procedure?.service_name ? <span className="muted">{procedure.service_name}</span> : null}
                  {procedure?.client_id ? (
                    <span className="muted">{`${formatClientCode(procedure.client_id)} - ${procedure.client_name || ""}`}</span>
                  ) : procedure?.client_name ? (
                    <span className="muted">{procedure.client_name}</span>
                  ) : null}
                </div>
                {procedure?.details ? <p className="muted">{procedure.details}</p> : null}
              </div>

              <div className="inline">
                {procedure?.expected_deadline ? (
                  <span className="muted">Échéance: {procedure.expected_deadline}</span>
                ) : null}
                <button
                  type="button"
                  className="icon-action-btn icon-action-btn-sm"
                  onClick={() => openEditModal(procedure)}
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="m15.6 3.2 5.2 5.2-11 11H4.6v-5.2l11-11Zm1.4-1.4 2.4-2.4a1.5 1.5 0 0 1 2.1 0l1.5 1.5a1.5 1.5 0 0 1 0 2.1l-2.4 2.4-3.6-3.6Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-action-btn icon-action-btn-sm danger"
                  onClick={() => openDeleteModal(procedure)}
                  title="Supprimer"
                  aria-label="Supprimer"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v10H7V9Zm4 0h2v10h-2V9Zm4 0h2v10h-2V9Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>

        {procedures.length > ITEMS_PER_PAGE ? (
          <div className="pagination-bar">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span className="muted">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        ) : null}
      </section>

      <Modal open={createModalOpen} title="Ajouter une procédure" onClose={() => setCreateModalOpen(false)}>
        <form className="form-grid" onSubmit={handleCreate}>
          <input
            name="intitule"
            placeholder="Intitulé de la procédure"
            value={form.intitule}
            onChange={handleInput}
            required
          />
          <input
            type="number"
            name="montant"
            placeholder="Montant (XAF)"
            min="0"
            step="0.01"
            value={form.montant}
            onChange={handleInput}
            required
          />

          <div className="inline">
            <select name="serviceId" value={form.serviceId} onChange={handleInput}>
              <option value="">Service associé (optionnel)</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <select name="clientId" value={form.clientId} onChange={handleInput}>
              <option value="">Client associé (optionnel)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {formatClientCode(client.id)} - {client.full_name}
                </option>
              ))}
            </select>
          </div>

          {selectedService ? (
            <section className="card" style={{ boxShadow: "none" }}>
              <h4 style={{ marginTop: 0, marginBottom: 10 }}>Informations du service sélectionné</h4>
              <p className="muted" style={{ marginTop: 0 }}>
                <strong>Service:</strong> {selectedService.name}
              </p>
              <p className="muted" style={{ margin: "6px 0" }}>
                <strong>Éléments constitutifs du document:</strong>{" "}
                {selectedService.dossier_elements || "Non renseignés pour ce service."}
              </p>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                <strong>Étapes de la procédure :</strong>{" "}
                {selectedService.procedure_steps || "Non renseignées pour ce service."}
              </p>
            </section>
          ) : null}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Ajouter la procédure"}
          </button>
        </form>
      </Modal>

      <Modal open={editModalOpen} title="Modifier la procédure" onClose={() => setEditModalOpen(false)}>
        <form className="form-grid" onSubmit={handleEditSubmit}>
          <input
            name="intitule"
            placeholder="Intitulé de la procédure"
            value={editForm.intitule}
            onChange={handleEditInput}
            required
          />
          <input
            type="number"
            name="montant"
            placeholder="Montant (XAF)"
            min="0"
            step="0.01"
            value={editForm.montant}
            onChange={handleEditInput}
            required
          />

          <button type="submit" className="btn" disabled={editSubmitting}>
            {editSubmitting ? "Mise à jour..." : "Enregistrer les modifications"}
          </button>
        </form>
      </Modal>

      <Modal open={deleteModalOpen} title="Supprimer la procédure" onClose={() => setDeleteModalOpen(false)}>
        <div className="form-grid">
          <p className="muted">
            Confirmez la suppression de <strong>{selectedProcedure?.title || "cette procédure"}</strong>.
          </p>
          <div className="inline">
            <button type="button" className="btn secondary" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </button>
            <button type="button" className="btn" onClick={handleDeleteProcedure} disabled={deleteSubmitting}>
              {deleteSubmitting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProceduresPage;
