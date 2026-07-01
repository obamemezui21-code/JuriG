import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ORG_NAME_STORAGE_KEY, useAuth } from "../context/AuthContext";

const SupportFloatingButton = () => {
  const { organization } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const organizationName =
    organization?.name ||
    localStorage.getItem(ORG_NAME_STORAGE_KEY) ||
    "Cabinet";
  const supportEmail = organization?.email || "";
  const isLoginRoute = location.pathname === "/login";

  const helpMessage = useMemo(() => {
    if (isLoginRoute) {
      return "Besoin d'aide pour vous connecter ou récupérer votre accès ?";
    }
    return "Besoin d'aide pour utiliser l'application ou joindre le support ?";
  }, [isLoginRoute]);

  return (
    <div className="support-fab-wrap" ref={panelRef}>
      {open ? (
        <section className="support-fab-panel" aria-label="Service support">
          <div className="support-fab-panel-head">
            <div>
              <p className="support-fab-kicker">Service support</p>
              <h3>{organizationName}</h3>
            </div>
            <button type="button" className="support-fab-close" onClick={() => setOpen(false)} aria-label="Fermer l'assistance">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="support-fab-text">{helpMessage}</p>

          <div className="support-fab-actions">
            {isLoginRoute ? (
              <Link className="support-fab-link" to="/forgot-password">
                Mot de passe oublié
              </Link>
            ) : null}

            {supportEmail ? (
              <a
                className="support-fab-link support-fab-link-primary"
                href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Demande d'assistance - ${organizationName}`)}`}
              >
                Contacter le support
              </a>
            ) : (
              <span className="support-fab-note">Ajoutez un email dans Mon cabinet pour activer le contact direct.</span>
            )}
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="support-fab-button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Ouvrir le service support"
        title="Service support"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 4a7 7 0 0 0-7 7v2.4a2.6 2.6 0 0 0 2.6 2.6H8v-5H6.5V11a5.5 5.5 0 1 1 11 0v.01H16v5h1.3a2.7 2.7 0 0 1-2.55 1.84H12v1.65h2.75A4.35 4.35 0 0 0 19 15.17a2.58 2.58 0 0 0 1-2.07V11a8 8 0 0 0-8-8Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
};

export default SupportFloatingButton;