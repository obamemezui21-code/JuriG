import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import { api } from "../../services/api";
import {
  confirmAction,
  notifyActionStatus,
  startActionLoading,
  stopActionLoading,
} from "../../utils/actionFeedback";

const DEFAULT_FORM = {
  montant: "",
  motif: "",
  description: "",
};

const ReceiptsPage = () => {
  const { user, token } = useAuth();
  const [decaissements, setDecaissements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionDate, setTransactionDate] = useState("");
  const [editTransactionDate, setEditTransactionDate] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const userLabel = user.name || user.email || "Utilisateur";
  const displayDate = transactionDate
    ? new Date(transactionDate).toLocaleString("fr-FR")
    : new Date().toLocaleString("fr-FR");

  const openModal = () => {
    setStatus({ error: "", success: "" });
    setForm(DEFAULT_FORM);
    setTransactionDate(new Date().toISOString());
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const openEditModal = (item) => {
    setStatus({ error: "", success: "" });
    setEditTarget(item);
    setEditForm({
      montant: String(item.amount ?? item.montant ?? ""),
      motif: item.motif || "",
      description: item.description || "",
    });
    setEditTransactionDate(
      item.transaction_date || item.createdAt || item.created_at || new Date().toISOString()
    );
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTarget(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadDecaissements = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.listDisbursements(token);
      setDecaissements(response.disbursements || []);
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDecaissements();
  }, [loadDecaissements]);

  useEffect(() => {
    if (status.error) {
      notifyActionStatus("error", status.error);
    }
  }, [status.error]);

  useEffect(() => {
    if (status.success) {
      notifyActionStatus("success", status.success);
    }
  }, [status.success]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });

    if (!form.montant || !form.motif) {
      setStatus({ error: "Montant et motif obligatoires.", success: "" });
      return;
    }

    setSubmitting(true);
    const loadingId = startActionLoading("Enregistrement du decaissement...");

    try {
      const createdAt = transactionDate || new Date().toISOString();
      const response = await api.createDisbursement(token, {
        amount: Number(form.montant),
        currency: "XAF",
        motif: form.motif.trim(),
        description: form.description.trim() || null,
        transactionDate: createdAt,
      });
      if (response.disbursement) {
        setDecaissements((prev) => [response.disbursement, ...prev]);
      } else {
        await loadDecaissements();
      }
      setStatus({ error: "", success: "Décaissement enregistré." });
      setForm(DEFAULT_FORM);
      setModalOpen(false);
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      stopActionLoading(loadingId);
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget?.id) {
      return;
    }
    setStatus({ error: "", success: "" });

    if (!editForm.montant || !editForm.motif) {
      setStatus({ error: "Montant et motif obligatoires.", success: "" });
      return;
    }

    setSubmitting(true);
    const loadingId = startActionLoading("Mise a jour du decaissement...");

    try {
      const response = await api.disbursements.update(editTarget.id, {
        amount: Number(editForm.montant),
        currency: "XAF",
        motif: editForm.motif.trim(),
        description: editForm.description.trim() || null,
        transactionDate: editTransactionDate || new Date().toISOString(),
      });

      if (response.disbursement) {
        setDecaissements((prev) =>
          prev.map((item) => (item.id === editTarget.id ? response.disbursement : item))
        );
      } else {
        await loadDecaissements();
      }

      setStatus({ error: "", success: "Décaissement mis à jour." });
      setEditModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      stopActionLoading(loadingId);
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!item.id) {
      return;
    }
    const confirmed = await confirmAction({
      title: "Supprimer le decaissement",
      message: "Voulez-vous vraiment supprimer ce decaissement ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    setStatus({ error: "", success: "" });
    const loadingId = startActionLoading("Suppression du decaissement...");
    try {
      await api.disbursements.delete(item.id);
      setDecaissements((prev) => prev.filter((row) => row.id !== item.id));
      setStatus({ error: "", success: "Décaissement supprimé." });
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      stopActionLoading(loadingId);
    }
  };

  const formatAmount = (value) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const filteredDecaissements = decaissements.filter((item) => {
    const needle = String(searchQuery || "").trim().toLowerCase();
    if (!needle) return true;
    const dateLabel = new Date(item.transaction_date || item.createdAt || item.created_at || new Date().toISOString())
      .toLocaleString("fr-FR");
    const userName =
      item.user_label && item.user_label !== "Utilisateur"
        ? item.user_label
        : item.created_by_name || item.utilisateur || (
          item.user_id && user.id && Number(item.user_id) === Number(user.id)
            ? userLabel
            : ""
        );
    const haystack = [
      dateLabel,
      userName,
      item.motif,
      item.description,
      String(item.amount ?? item.montant ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <>
      <section className="card">
        <div className="inline row-between">
          <div>
            <h2>Gestion des décaissements</h2>
            <p className="muted">Enregistrez les sorties de caisse du cabinet.</p>
          </div>
          <button className="btn" type="button" onClick={openModal}>
            Nouveau décaissement
          </button>
        </div>

        {status.error ? <p className="error">{status.error}</p> : null}
        {status.success ? <p>{status.success}</p> : null}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>Historique des décaissements</h3>
        {loading ? <p className="muted">Chargement...</p> : null}
        <div className="data-search-bar">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M11 2a9 9 0 1 0 5.645 16.018l4.168 4.168a1 1 0 0 0 1.414-1.414l-4.168-4.168A9 9 0 0 0 11 2Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              className="data-search-input"
              type="search"
              placeholder="Rechercher un décaissement..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Désignation</th>
                <th>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredDecaissements.length === 0 ? (
                <tr>
                  <td colSpan={5}>Aucun décaissement enregistré.</td>
                </tr>
              ) : (
                filteredDecaissements.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.transaction_date || item.createdAt || item.created_at).toLocaleString("fr-FR")}</td>
                    <td>
                      {item.user_label && item.user_label !== "Utilisateur"
                        ? item.user_label
                        : item.created_by_name || item.utilisateur || (
                          item.user_id && user.id && Number(item.user_id) === Number(user.id)
                            ? userLabel
                            : "-"
                        )}
                    </td>
                    <td>{item.motif}</td>
                    <td>{formatAmount(item.amount ?? item.montant ?? 0)}</td>
                    <td className="table-actions">
                      <div className="inline" style={{ flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          className="icon-action-btn icon-action-btn-sm"
                          onClick={() => openEditModal(item)}
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
                          onClick={() => handleDelete(item)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title="Nouveau décaissement" onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="inline" style={{ gap: 16 }}>
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <label className="muted">Utilisateur</label>
              <input type="text" value={userLabel} disabled />
            </div>
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <label className="muted">Date</label>
              <input type="text" value={displayDate} disabled />
            </div>
          </div>

          <input
            type="number"
            name="montant"
            placeholder="Montant (XAF)"
            value={form.montant}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            required
          />

          <input
            type="text"
            name="motif"
            placeholder="Motif"
            value={form.motif}
            onChange={handleInputChange}
            required
          />

          {status.error ? <p className="error">{status.error}</p> : null}

          <div className="inline">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button className="btn secondary" type="button" onClick={closeModal}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} title="Modifier le décaissement" onClose={closeEditModal}>
        <form className="form-grid" onSubmit={handleEditSubmit}>
          <div className="inline" style={{ gap: 16 }}>
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <label className="muted">Utilisateur</label>
              <input type="text" value={userLabel} disabled />
            </div>
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <label className="muted">Date</label>
              <input type="text" value={new Date(editTransactionDate).toLocaleString("fr-FR")} disabled />
            </div>
          </div>

          <input
            type="number"
            name="montant"
            placeholder="Montant (XAF)"
            value={editForm.montant}
            onChange={(event) => setEditForm((prev) => ({ ...prev, montant: event.target.value }))}
            step="0.01"
            min="0"
            required
          />

          <input
            type="text"
            name="motif"
            placeholder="Motif"
            value={editForm.motif}
            onChange={(event) => setEditForm((prev) => ({ ...prev, motif: event.target.value }))}
            required
          />

          {status.error ? <p className="error">{status.error}</p> : null}

          <div className="inline">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Mettre à jour"}
            </button>
            <button className="btn secondary" type="button" onClick={closeEditModal}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ReceiptsPage;
