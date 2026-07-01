import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { DEFAULT_THEME_KEY, THEME_OPTIONS, resolveThemeKey } from "../../theme/palettes";
import { defaultAppLogo } from "../../assets/branding";

const applyThemePreview = (themeKey) => {
  const resolved = resolveThemeKey(themeKey || DEFAULT_THEME_KEY);
  document.documentElement.setAttribute("data-theme", resolved);
};

const OrganizationPage = () => {
  const { token, organization, setOrganization } = useAuth();

  const [form, setForm] = useState({
    name: "",
    themeKey: DEFAULT_THEME_KEY,
    address: "",
    phone: "",
    email: "",
  });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || "",
        themeKey: resolveThemeKey(organization.themeKey || organization.theme_key || DEFAULT_THEME_KEY),
        address: organization.address || "",
        phone: organization.phone || "",
        email: organization.email || "",
      });
      return;
    }

    const loadOrganization = async () => {
      try {
        const response = await api.getOrganization(token);
        const org = response.organization;

        setOrganization(org);
        setForm({
          name: org.name || "",
          themeKey: resolveThemeKey(org.themeKey || org.theme_key || DEFAULT_THEME_KEY),
          address: org.address || "",
          phone: org.phone || "",
          email: org.email || "",
        });
      } catch (apiError) {
        setStatus({ error: apiError.message, success: "" });
      }
    };

    if (token) {
      loadOrganization();
    }
  }, [organization, token, setOrganization]);

  const selectedTheme = useMemo(
    () => THEME_OPTIONS.find((theme) => theme.key === form.themeKey) || THEME_OPTIONS[0],
    [form.themeKey]
  );
  const contactCompleteness = [form.address, form.phone, form.email].filter((value) => String(value || "").trim()).length;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleThemeSelect = (themeKey) => {
    applyThemePreview(themeKey);
    setForm((prev) => ({ ...prev, themeKey }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSubmitting(true);

    try {
      const updateResponse = await api.updateOrganization(token, {
        name: form.name,
        themeKey: form.themeKey,
        address: form.address,
        phone: form.phone,
        email: form.email,
      });

      setOrganization(updateResponse.organization);
      setStatus({ error: "", success: "Paramètres cabinet enregistrés." });
    } catch (apiError) {
      setStatus({ error: apiError.message, success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="card organization-settings-card">
        <div className="organization-settings-hero">
          <div className="organization-settings-hero-copy">
            <p className="organization-section-kicker">Gouvernance du cabinet</p>
            <h2>Paramètres du cabinet</h2>
            <p className="muted organization-hero-lead">Structurez l'identité du cabinet, ses coordonnées et son ambiance visuelle depuis un panneau plus statutaire.</p>
          </div>
          <div className="organization-theme-chip" style={{ background: `linear-gradient(135deg, ${selectedTheme.brand}, ${selectedTheme.strong})` }}>
            {selectedTheme.label}
          </div>
        </div>

        <div className="organization-overview-strip">
          <article className="organization-overview-card">
            <span>Identité</span>
            <strong>Logo plateforme</strong>
            <em>{form.name || "Nom du cabinet à renseigner"}</em>
          </article>
          <article className="organization-overview-card">
            <span>Coordonnées</span>
            <strong>{contactCompleteness}/3</strong>
            <em>Adresse, téléphone et email</em>
          </article>
          <article className="organization-overview-card">
            <span>Thème actif</span>
            <strong>{selectedTheme.label}</strong>
            <em>Palette institutionnelle appliquée</em>
          </article>
        </div>

        <form className="organization-settings-layout" onSubmit={handleSubmit}>
          <aside className="organization-brand-panel">
            <div className="organization-brand-preview">
              <div className="organization-brand-stage" style={{ background: `linear-gradient(145deg, ${selectedTheme.soft}, #ffffff 55%, ${selectedTheme.soft})` }}>
                <img src={defaultAppLogo} alt="Logo JuriGabon" className="logo-preview organization-logo-preview" />
                <div className="organization-brand-meta">
                  <strong>{form.name || "Nom du cabinet"}</strong>
                  <span>{selectedTheme.label}</span>
                </div>
                <p className="organization-brand-caption">Signature visuelle du cabinet sur les écrans internes et les documents générés.</p>
              </div>
                <span className="organization-upload-help">PNG, JPG ou WEBP, jusqu’à 2MB</span>
            </div>
          </aside>

          <div className="organization-settings-main">
            <section className="organization-settings-section organization-info-section">
              <div className="organization-section-head">
                <h3>Informations générales</h3>
                <p className="muted">Les coordonnées visibles dans le cabinet et sur les écrans partagés.</p>
              </div>
              <div className="organization-fields-grid">
                <label className="organization-field-card">
                  <span className="organization-field-label">Nom du cabinet</span>
                  <span className="organization-field-hint">Intitulé principal affiché dans la navigation et les écrans d'accueil.</span>
                  <input
                    name="name"
                    placeholder="Nom du cabinet"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="organization-field-card organization-field-card-wide">
                  <span className="organization-field-label">Adresse</span>
                  <span className="organization-field-hint">Adresse de référence du siège ou du bureau principal.</span>
                  <input
                    name="address"
                    placeholder="Adresse"
                    value={form.address}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="organization-field-card">
                  <span className="organization-field-label">Téléphone</span>
                  <span className="organization-field-hint">Numéro principal communiqué aux clients.</span>
                  <input
                    name="phone"
                    placeholder="Téléphone"
                    value={form.phone}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="organization-field-card">
                  <span className="organization-field-label">Email</span>
                  <span className="organization-field-hint">Adresse officielle utilisée pour les échanges et notifications.</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
            </section>

            <section className="organization-settings-section organization-theme-section">
              <div className="organization-section-head">
                <h3>Palette de la plateforme</h3>
                <p className="muted">Choisissez une ambiance visuelle complète plutôt qu’un simple point de couleur.</p>
              </div>
              <div className="organization-theme-grid" role="radiogroup" aria-label="Choix de couleur">
                {THEME_OPTIONS.map((theme) => {
                  const active = form.themeKey === theme.key;

                  return (
                    <button
                      type="button"
                      key={theme.key}
                      className={`organization-theme-card ${active ? "active" : ""}`}
                      onClick={() => handleThemeSelect(theme.key)}
                      aria-label={theme.label}
                      aria-checked={active}
                      role="radio"
                    >
                      <span
                        className="organization-theme-banner"
                        style={{
                          background: `linear-gradient(135deg, ${theme.brand}, ${theme.strong})`,
                        }}
                      />
                      <span className="organization-theme-samples">
                        <span style={{ background: theme.sideA }} />
                        <span style={{ background: theme.sideB }} />
                        <span style={{ background: theme.sideC }} />
                      </span>
                      <span className="organization-theme-content">
                        <strong>{theme.label}</strong>
                        <span>{active ? "Palette active" : "Appliquer cette palette"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="organization-actions-row">
              <div className="organization-status-stack">
                {status.error ? <p className="error">{status.error}</p> : null}
                {status.success ? <p>{status.success}</p> : null}
              </div>
              <button className="btn organization-save-btn" type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
};

export default OrganizationPage;
