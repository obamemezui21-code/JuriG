import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = await resetPassword(token, password);
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card form-grid" onSubmit={handleSubmit}>
        <div className="auth-intro">
          <p className="auth-eyebrow">Reinitialisation</p>
          <h1>Reinitialiser le mot de passe</h1>
          <p className="muted auth-lead">Définissez un nouveau mot de passe pour retrouver l'accès à votre cockpit professionnel.</p>
        </div>

        <label className="auth-field">
          <span>Nouveau mot de passe</span>
          <input
            type="password"
            name="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span>Confirmation</span>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {message ? <p style={{ color: "green" }}>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </button>

        <p className="muted auth-helper">
          Retour à la <Link to="/login">connexion</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;