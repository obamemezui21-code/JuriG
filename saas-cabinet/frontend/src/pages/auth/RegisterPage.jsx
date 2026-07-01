import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ORG_NAME_STORAGE_KEY, useAuth } from "../../context/AuthContext";
import { defaultAppLogo } from "../../assets/branding";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    orgName: "",
    name: "",
    email: "",
    password: "",
  });
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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card form-grid" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <img className="top-logo" src={defaultAppLogo} alt="Logo JuriGabon" />
          <p className="auth-brand-name">{storedOrgName || "Cabinet"}</p>
        </div>

        <div className="auth-intro">
          <p className="auth-eyebrow">Mise en service</p>
          <h1>Creer l'espace du cabinet</h1>
          <p className="muted auth-lead">Installez votre cockpit de travail avec une base plus élégante, plus aérée et prête pour l'activité de l'équipe.</p>
        </div>

        <label className="auth-field">
          <span>Nom du cabinet</span>
          <input type="text" name="orgName" placeholder="Nom du cabinet" value={form.orgName} onChange={handleChange} required />
        </label>

        <label className="auth-field">
          <span>Administrateur principal</span>
          <input
            type="text"
            name="name"
            placeholder="Nom complet de l'administrateur"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="auth-field">
          <span>E-mail administrateur</span>
          <input type="email" name="email" placeholder="E-mail administrateur" value={form.email} onChange={handleChange} required />
        </label>

        <label className="auth-field">
          <span>Mot de passe</span>
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creation..." : "S'inscrire"}
        </button>

        <p className="muted auth-helper">
          Vous avez déjà un compte  <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
