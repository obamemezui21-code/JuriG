import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import {
  confirmAction,
  notifyActionStatus,
  startActionLoading,
  stopActionLoading,
} from "../../utils/actionFeedback";
const ITEMS_PER_PAGE = 15;

const ServicesPage = () => {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      description: "",
    });
  };

  const closeFormModal = () => {
    resetForm();
    setFormModalOpen(false);
  };

  const loadServices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.listServices(token, { include_inactive: true });
      setServices(res.services || []);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [services.length]);

  const handleInput = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const loadingId = startActionLoading(form.id ? "Mise a jour du service..." : "Creation du service...");
    const payload = {
      name: form.name,
      description: form.description,
    };
    try {
      if (form.id) {
        await api.updateService(token, form.id, payload);
      } else {
        await api.createService(token, payload);
      }
      resetForm();
      setFormModalOpen(false);
      await loadServices();
      notifyActionStatus("success", form.id ? "Service mis a jour." : "Service cree.");
    } catch (apiError) {
      setError(apiError.message);
      notifyActionStatus("error", apiError.message);
    } finally {
      stopActionLoading(loadingId);
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setForm({
      id: service.id,
      name: service.name || "",
      description: service.description || "",
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (service) => {
    const confirmed = await confirmAction({
      title: "Supprimer le service",
      message: `Supprimer definitivement le service "${service.name}" ?`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    setDeletingId(service.id);
    setError("");
    const loadingId = startActionLoading("Suppression du service...");

    try {
      await api.deleteService(token, service.id);
      await loadServices();
      notifyActionStatus("success", "Service supprimé.");
    } catch (apiError) {
      setError(apiError.message);
      notifyActionStatus("error", apiError.message);
    } finally {
      stopActionLoading(loadingId);
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(services.length / ITEMS_PER_PAGE));
  const paginatedServices = services.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <section className="card">
        <div className="inline row-between">
          <h3>Services</h3>
          <button type="button" className="btn" onClick={() => setFormModalOpen(true)}>
            Ajouter un service
          </button>
        </div>
        <p className="muted">Le formulaire s'ouvre en popup grand format.</p>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h3>Catalogue des services</h3>
        {loading && <p>Chargement...</p>}
        {!loading && !services.length && <p className="muted">Aucun service enregistré.</p>}
        {services.length > 0 && (
          <ul className="data-list">
            {paginatedServices.map((service) => (
              <li key={service.id} className="data-row stack-mobile">
                <div>
                  <strong>{service.name}</strong>
                  {!service.is_active && <span className="pill">Archive</span>}
                  {service.dossier_elements ? (
                    <p className="muted service-meta">
                      <strong>Éléments constitutifs :</strong> {service.dossier_elements}
                    </p>
                  ) : null}
                </div>
                <div className="inline">
                  <button
                    type="button"
                    className="icon-action-btn icon-action-btn-sm"
                    onClick={() => handleEdit(service)}
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
                    className="icon-action-btn icon-action-btn-sm danger"
                    type="button"
                    onClick={() => handleDelete(service)}
                    disabled={deletingId === service.id}
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    {deletingId === service.id ? (
                      <span className="spinner-sm" aria-hidden="true" />
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v10H7V9Zm4 0h2v10h-2V9Zm4 0h2v10h-2V9Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {services.length > ITEMS_PER_PAGE ? (
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

      <Modal
        open={formModalOpen}
        title={form.id ? "Modifier le service" : "Ajouter un service"}
        onClose={closeFormModal}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <input name="name" placeholder="Nom du service" value={form.name} onChange={handleInput} required />
          <textarea name="description" placeholder="Description (optionnel)" value={form.description} onChange={handleInput} />
          <div className="inline">
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Enregistrement..." : form.id ? "Mettre à jour" : "Ajouter le service"}
            </button>
            <button type="button" className="btn secondary" onClick={closeFormModal}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ServicesPage;
