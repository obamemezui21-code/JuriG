import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import {
  DEFAULT_ROLE_OPTIONS,
  buildRoleOption,
  loadCustomRoles,
  normalizeRoleValue,
  persistCustomRoles,
} from "../../utils/roleCategories";
import {
  confirmAction,
  notifyActionStatus,
  startActionLoading,
  stopActionLoading,
} from "../../utils/actionFeedback";

const EMPTY_FORM = { label: "", value: "" };

const UserCategoriesPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [customRoles, setCustomRoles] = useState(() => loadCustomRoles());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const currentUserRole = user ? normalizeRoleValue(user.role) : "";

  const roleUsage = useMemo(() => {
    const counts = new Map();
    users.forEach((u) => {
      const value = normalizeRoleValue(u.role);
      if (!value) {
        return;
      }
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }, [users]);

  const loadUsers = async () => {
    setLoading(true);
    setStatus({ error: "", success: "" });
    try {
      const response = await api.users.list();
      setUsers(response.users || []);
    } catch (error) {
      setStatus({ error: error.message || "Impossible de charger les utilisateurs.", success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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

  const openCreateModal = () => {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setStatus({ error: "", success: "" });
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role.value);
    setForm({ label: role.label, value: role.value });
    setStatus({ error: "", success: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValueTaken = (value, ignoreValue = "") => {
    const normalized = normalizeRoleValue(value);
    if (!normalized) {
      return false;
    }
    if (DEFAULT_ROLE_OPTIONS.some((opt) => opt.value === normalized)) {
      return true;
    }
    return customRoles.some((role) => role.value === normalized && role.value !== ignoreValue);
  };

  const updateUsersRole = async (oldValue, newValue) => {
    const affectedUsers = users.filter((u) => normalizeRoleValue(u.role) === oldValue);
    if (!affectedUsers.length) {
      return;
    }

    await Promise.all(
      affectedUsers.map((u) =>
        api.users.update(u.id, { role: newValue })
      )
    );

    setUsers((prev) =>
      prev.map((u) =>
        normalizeRoleValue(u.role) === oldValue ? { ...u, role: newValue } : u
      )
    );
  };

  const saveRole = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });

    const option = buildRoleOption(form.label, form.value || form.label);
    if (!option) {
      setStatus({ error: "Nom et valeur requis.", success: "" });
      return;
    }

    if (editingRole) {
      const oldValue = editingRole;
      if (isValueTaken(option.value, oldValue)) {
        setStatus({ error: "Cette valeur existe deja.", success: "" });
        return;
      }
      if (option.value !== oldValue && currentUserRole === oldValue) {
        setStatus({ error: "Impossible de modifier la valeur de votre role.", success: "" });
        return;
      }

      setSubmitting(true);
      const loadingId = startActionLoading("Mise a jour de la categorie...");
      try {
        if (option.value !== oldValue) {
          await updateUsersRole(oldValue, option.value);
        }
        const next = customRoles.map((role) =>
          role.value === oldValue ? { value: option.value, label: option.label } : role
        );
        setCustomRoles(next);
        persistCustomRoles(next);
        setStatus({ error: "", success: "Categorie modifiee." });
        setModalOpen(false);
      } catch (error) {
        setStatus({ error: error.message || "Erreur lors de la mise a jour.", success: "" });
      } finally {
        stopActionLoading(loadingId);
        setSubmitting(false);
      }
      return;
    }

    if (isValueTaken(option.value)) {
      setStatus({ error: "Cette valeur existe deja.", success: "" });
      return;
    }

    const loadingId = startActionLoading("Ajout de la categorie...");
    try {
      const next = [...customRoles, option];
      setCustomRoles(next);
      persistCustomRoles(next);
      setStatus({ error: "", success: "Categorie ajoutee." });
      setModalOpen(false);
    } finally {
      stopActionLoading(loadingId);
    }
  };

  const deleteRole = async (roleValue) => {
    const count = roleUsage.get(roleValue) || 0;
    if (count > 0) {
      setStatus({ error: "Impossible de supprimer : categorie utilisee.", success: "" });
      return;
    }
    const confirmed = await confirmAction({
      title: "Supprimer la categorie",
      message: "Voulez-vous vraiment supprimer cette categorie ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    const loadingId = startActionLoading("Suppression de la categorie...");
    try {
      const next = customRoles.filter((role) => role.value !== roleValue);
      setCustomRoles(next);
      persistCustomRoles(next);
      setStatus({ error: "", success: "Categorie supprimee." });
    } finally {
      stopActionLoading(loadingId);
    }
  };

  return (
    <>
      <section className="card">
        <div className="inline row-between">
          <div>
            <h2>Gestion des categories utilisateur</h2>
            <p className="muted">Creez, modifiez ou supprimez des categories pour les roles.</p>
          </div>
          <div className="inline">
            <Link className="btn secondary" to="/users">
              Retour utilisateurs
            </Link>
            <button className="btn" type="button" onClick={openCreateModal}>
              Nouvelle categorie
            </button>
          </div>
        </div>

        {status.error ? <p className="error">{status.error}</p> : null}
        {status.success ? <p>{status.success}</p> : null}

        <div style={{ marginTop: 16 }}>
          <h3>Categories systeme</h3>
          <div className="role-categories">
            {DEFAULT_ROLE_OPTIONS.map((role) => (
              <div key={role.value} className="role-card">
                <div>
                  <p className="role-card-title">{role.label}</p>
                  <p className="muted role-card-note">Valeur: {role.value}</p>
                </div>
                <span className="badge badge-sm">Systeme</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h3>Categories personnalisees</h3>
          {customRoles.length ? (
            <div className="role-categories">
              {customRoles.map((role) => {
                const count = roleUsage.get(role.value) || 0;
                return (
                  <div key={role.value} className="role-card">
                    <div>
                      <p className="role-card-title">{role.label}</p>
                      <p className="muted role-card-note">
                        Valeur: {role.value} · Utilise par {count} utilisateur{count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="role-card-actions">
                      <button
                        className="icon-action-btn icon-action-btn-sm"
                        type="button"
                        onClick={() => openEditModal(role)}
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
                        onClick={() => deleteRole(role.value)}
                        disabled={count > 0}
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
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Aucune categorie personnalisee.</p>
          )}
        </div>

        {loading ? <p className="muted">Chargement des utilisateurs...</p> : null}
      </section>

      <Modal
        open={modalOpen}
        title={editingRole ? "Modifier une categorie" : "Ajouter une categorie"}
        onClose={closeModal}
      >
        <form className="form-grid" onSubmit={saveRole}>
          <input
            type="text"
            name="label"
            placeholder="Nom de la categorie"
            value={form.label}
            onChange={handleFormChange}
            required
          />
          <input
            type="text"
            name="value"
            placeholder="Valeur interne (optionnel)"
            value={form.value}
            onChange={handleFormChange}
          />
          <p className="muted" style={{ margin: 0 }}>
            La valeur interne sert d'identifiant. Laissez vide pour utiliser le nom.
          </p>
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
    </>
  );
};

export default UserCategoriesPage;
