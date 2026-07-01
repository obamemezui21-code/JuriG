import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ORG_NAME_STORAGE_KEY, useAuth } from "../../context/AuthContext";
import { defaultAppLogo } from "../../assets/branding";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storedOrgName = localStorage.getItem(ORG_NAME_STORAGE_KEY) || "Cabinet";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      {submitting ? (
        <div className="auth-loader-overlay" aria-live="polite" aria-busy="true">
          <div className="auth-loader-card">
            <div className="spinner-lg" />
            <p>Connexion en cours...</p>
          </div>
        </div>
      ) : null}
      <form className="auth-card form-grid" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <img className="top-logo" src={defaultAppLogo} alt="Logo JuriGabon" />
          <p className="auth-brand-name">{storedOrgName || "Cabinet"}</p>
        </div>

        <div className="auth-intro">
          <p className="auth-eyebrow">Acces securise</p>
          <div className="auth-login-head">
            <h1>Connexion au cabinet</h1>
            <button type="button" className="login-blink-btn" aria-label="Assistant IA bientôt disponible" />
          </div>
          <p className="muted auth-lead">Accedez a votre espace de travail, vos dossiers et vos flux financiers dans une interface plus calme et plus premium.</p>
        </div>

        <label className="auth-field">
          <span>Adresse e-mail</span>
          <input type="email" name="email" placeholder="Adresse e-mail" value={form.email} onChange={handleChange} required />
        </label>

        <label className="auth-field">
          <span>Mot de passe</span>
          <div className="auth-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-4 4.8M6.1 6.1C3.6 7.8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.1-.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="btn-loader">
              <span className="spinner-sm" />
              Connexion...
            </span>
          ) : (
            "Se connecter"
          )}
        </button>

        <p className="muted auth-helper">
          Pas encore de compte  <Link to="/register">Creer un compte</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
