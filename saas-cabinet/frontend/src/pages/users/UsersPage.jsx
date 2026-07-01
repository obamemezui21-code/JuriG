import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/Modal";
import {
  DEFAULT_ROLE_OPTIONS,
  loadCustomRoles,
  normalizeRoleValue,
} from "../../utils/roleCategories";
import {
  confirmAction,
  notifyActionStatus,
  startActionLoading,
  stopActionLoading,
} from "../../utils/actionFeedback";

const PERMISSION_LIST = [
  { key: "viewDashboard", label: "Voir le tableau de bord" },
  { key: "manageClients", label: "Gérer les clients" },
  { key: "manageServices", label: "Gérer les services" },
  { key: "manageProcedures", label: "Gérer les procédures" },
  { key: "manageInvoices", label: "Gérer les factures" },
  { key: "managePayments", label: "Gérer les paiements" },
  { key: "manageOrganization", label: "Gérer le cabinet" },
  { key: "manageUsers", label: "Gérer les utilisateurs" },
];

const getDefaultPermissions = (role) => {
  const base = PERMISSION_LIST
    .filter((p) => p.key !== "manageUsers")
    .map((p) => p.key);

  if (role === "admin") {
    return [...base, "manageUsers"];
  }

  return base;
};

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [customRoles] = useState(() => loadCustomRoles());
  const [autoPassword, setAutoPassword] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member",
    password: "",
    permissions: getDefaultPermissions("member"),
  });

  const canManageUsers = (user.permissions || []).includes("manageUsers");

  const roleOptions = useMemo(() => {
    const byValue = new Map();
    DEFAULT_ROLE_OPTIONS.forEach((opt) => byValue.set(opt.value, opt));
    customRoles.forEach((opt) => {
      if (!byValue.has(opt.value)) {
        byValue.set(opt.value, opt);
      }
    });
    users.forEach((u) => {
      const value = normalizeRoleValue(u.role);
      if (!value) {
        return;
      }
      if (!byValue.has(value)) {
        byValue.set(value, { value, label: u.role });
      }
    });
    return Array.from(byValue.values());
  }, [customRoles, users]);

  const filteredUsers = useMemo(() => {
    const needle = String(searchQuery || "").trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const roleLabel =
        roleOptions.find((opt) => opt.value === normalizeRoleValue(u.role))?.label || u.role || "";
      const permissionLabels = (u.permissions || [])
        .map((p) => PERMISSION_LIST.find((perm) => perm.key === p)?.label || p)
        .join(" ");
      const haystack = [
        u.name,
        u.email,
        u.role,
        roleLabel,
        permissionLabels,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [roleOptions, searchQuery, users]);

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
    if (!canManageUsers) return;
    loadUsers();
  }, [canManageUsers]);

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
    setEditUser(null);
    setAutoPassword(true);
    setGeneratedPassword("");
    setCopyStatus("");
    setForm({ name: "", email: "", role: "member", password: "", permissions: getDefaultPermissions("member") });
    setStatus({ error: "", success: "" });
    setModalOpen(true);
  };

  const openEditModal = (userToEdit) => {
    setEditUser(userToEdit);
    setAutoPassword(false);
    setGeneratedPassword("");
    setCopyStatus("");
    setForm({
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      role: userToEdit.role || "member",
      password: "",
      permissions: userToEdit.permissions || getDefaultPermissions(userToEdit.role || "member"),
    });
    setStatus({ error: "", success: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setStatus({ error: "", success: "" });
    setGeneratedPassword("");
    setCopyStatus("");
  };

  const handleCopyPassword = async () => {
    if (!generatedPassword) {
      return;
    }
    try {
      if (navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedPassword);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = generatedPassword;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("Copie.");
    } catch (_error) {
      setCopyStatus("Impossible de copier.");
    }
    window.setTimeout(() => setCopyStatus(""), 2000);
  };

  const handleFormChange = (event) => {
    const { name, value, checked } = event.target;

    if (name === "permissions") {
      setForm((prev) => {
        const current = new Set(prev.permissions || []);
        if (checked) {
          current.add(value);
        } else {
          current.delete(value);
        }
        return { ...prev, permissions: Array.from(current) };
      });
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "role" && !editUser) {
        next.permissions = getDefaultPermissions(value);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSubmitting(true);
    const loadingId = startActionLoading(editUser ? "Mise a jour de l'utilisateur..." : "Creation de l'utilisateur...");

    try {
      if (!editUser && !autoPassword && !form.password) {
        setStatus({ error: "Mot de passe obligatoire pour un nouvel utilisateur.", success: "" });
        setSubmitting(false);
        stopActionLoading(loadingId);
        return;
      }
      if (editUser) {
        const response = await api.users.update(editUser.id, {
          name: form.name,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
          permissions: form.permissions,
        });
        setStatus({ error: "", success: "Utilisateur mis à jour." });
        setGeneratedPassword("");
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? response.user : u)));
      } else {
        const response = await api.users.create({
          name: form.name,
          email: form.email,
          role: form.role,
          password: autoPassword ? undefined : form.password || undefined,
          permissions: form.permissions,
        });
        setStatus({
          error: "",
          success: autoPassword ? "Utilisateur créé. Mot de passe généré." : "Utilisateur créé.",
        });
        setGeneratedPassword(autoPassword ? response.initialPassword || "" : "");
        setUsers((prev) => [...prev, response.user]);
      }

      setSubmitting(false);
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      setStatus({ error: error.message || "Impossible d'enregistrer l'utilisateur.", success: "" });
      setSubmitting(false);
    } finally {
      stopActionLoading(loadingId);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = await confirmAction({
      title: "Supprimer l'utilisateur",
      message: "Voulez-vous vraiment supprimer cet utilisateur ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    const loadingId = startActionLoading("Suppression de l'utilisateur...");

    try {
      await api.users.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStatus({ error: "", success: "Utilisateur supprimé." });
    } catch (error) {
      setStatus({ error: error.message || "Impossible de supprimer l'utilisateur.", success: "" });
    } finally {
      stopActionLoading(loadingId);
    }
  };

  if (!canManageUsers) {
    return (
      <section className="card">
        <h2>Gestion des utilisateurs</h2>
        <p className="muted">Seuls les administrateurs peuvent gérer les comptes utilisateurs.</p>
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <header className="card-head">
          <div>
            <h2>Gestion des utilisateurs</h2>
            <p className="muted">Invitez des collègues, attribuez des rôles et gérez les accès.</p>
          </div>
          <button className="btn" type="button" onClick={openCreateModal}>
            Ajouter un utilisateur
          </button>
        </header>

        {status.error ? <p className="error">{status.error}</p> : null}
        {status.success ? <p>{status.success}</p> : null}

        <div className="inline row-between" style={{ marginTop: 16, alignItems: "center", gap: 16 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Catégories utilisateur</h3>
            <p className="muted" style={{ marginTop: 0 }}>Gérer les catégories de rôles.</p>
          </div>
          <Link className="btn secondary" to="/users/categories">
            Gérer les catégories
          </Link>
        </div>

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
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Permissions</th>
                <th>Créé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Chargement...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{roleOptions.find((opt) => opt.value === normalizeRoleValue(u.role))?.label || u.role}</td>
                    <td>
                      {(u.permissions || []).slice(0, 3).map((p) => (
                        <span key={p} className="badge badge-sm" style={{ marginRight: 4 }}>
                          {PERMISSION_LIST.find((perm) => perm.key === p)?.label || p}
                        </span>
                      ))}
                      {(u.permissions || []).length > 3 ? (
                        <span className="badge badge-sm">+{(u.permissions || []).length - 3}</span>
                      ) : null}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="table-actions">
                      <div className="inline" style={{ flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          className="icon-action-btn icon-action-btn-sm"
                          onClick={() => openEditModal(u)}
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
                        {u.id !== user.id ? (
                          <button
                            type="button"
                            className="icon-action-btn icon-action-btn-sm danger"
                            onClick={() => handleDelete(u.id)}
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
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title={editUser ? "Modifier un utilisateur" : "Ajouter un utilisateur"} onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Nom"
            value={form.name}
            onChange={handleFormChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleFormChange}
            required={!editUser}
            disabled={!!editUser}
          />
          <select name="role" value={form.role} onChange={handleFormChange}>
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {!editUser ? (
            <label className="checkbox-label" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                checked={autoPassword}
                onChange={(event) => {
                  const next = event.target.checked;
                  setAutoPassword(next);
                  if (next) {
                    setForm((prev) => ({ ...prev, password: "" }));
                  }
                }}
              />
              Generer automatiquement le mot de passe
            </label>
          ) : null}

          <input
            type="password"
            name="password"
            placeholder={
              editUser
                ? "Laisser vide pour ne pas changer"
                : autoPassword
                  ? "Mot de passe genere automatiquement"
                  : "Mot de passe (min 6 caracteres)"
            }
            value={form.password}
            onChange={handleFormChange}
            autoComplete="new-password"
            required={!editUser && !autoPassword}
            disabled={!editUser && autoPassword}
          />

          <div className="permissions-grid">
            <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>Permissions</p>
            <div className="permissions-list">
              {PERMISSION_LIST.map((perm) => (
                <label key={perm.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm.key}
                    checked={(form.permissions || []).includes(perm.key)}
                    onChange={handleFormChange}
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          {status.error ? <p className="error">{status.error}</p> : null}
          {status.success ? <p>{status.success}</p> : null}
          {generatedPassword ? (
            <div className="password-reveal">
              <span className="muted">Mot de passe généré</span>
              <div className="inline" style={{ gap: 8 }}>
                <input type="text" readOnly value={generatedPassword} />
                <button type="button" className="btn secondary" onClick={handleCopyPassword}>
                  Copier
                </button>
              </div>
              {copyStatus ? <span className="muted">{copyStatus}</span> : null}
            </div>
          ) : null}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : editUser ? "Enregistrer" : "Créer"}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default UsersPage;

