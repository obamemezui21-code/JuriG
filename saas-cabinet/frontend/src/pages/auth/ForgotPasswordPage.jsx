import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
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
          <p className="auth-eyebrow">Recuperation</p>
          <h1>Mot de passe oublie</h1>
          <p className="muted auth-lead">Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre accès en toute sécurité.</p>
        </div>

        <label className="auth-field">
          <span>Adresse e-mail</span>
          <input
            type="email"
            name="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {message ? <p style={{ color: "green" }}>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer le lien de réinitialisation"}
        </button>

        <p className="muted auth-helper">
          Retour à la <Link to="/login">connexion</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;