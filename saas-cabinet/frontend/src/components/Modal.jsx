import { useEffect } from "react";

const Modal = ({
  open,
  title,
  eyebrow = null,
  subtitle = null,
  onClose,
  children,
  width = "1280px",
  headerActions = null,
  headerCenter = null,
  maxHeight = "96vh",
  zIndex = 90,
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        className="modal-shell"
        style={{ width: `min(96vw, ${width})`, maxWidth: width, maxHeight }}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-head">
          <div className="modal-title-stack">
            {eyebrow ? <p className="modal-eyebrow">{eyebrow}</p> : null}
            <h3>{title}</h3>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          {headerCenter ? <div className="modal-head-center">{headerCenter}</div> : null}
          <div className="modal-head-actions">
            {headerActions}
            <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer" title="Fermer">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
};

export default Modal;
