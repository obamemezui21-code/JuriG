import { useEffect, useState } from "react";
import Modal from "./Modal";
import { ACTION_CONFIRM_EVENT } from "../utils/actionFeedback";

const ActionConfirmDialog = () => {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const handleConfirmEvent = (event) => {
      setDialog(event.detail || null);
    };

    window.addEventListener(ACTION_CONFIRM_EVENT, handleConfirmEvent);
    return () => window.removeEventListener(ACTION_CONFIRM_EVENT, handleConfirmEvent);
  }, []);

  const closeDialog = () => {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    setDialog(null);
  };

  const confirmDialog = () => {
    if (dialog?.onConfirm) {
      dialog.onConfirm();
    }
    setDialog(null);
  };

  return (
    <Modal
      open={Boolean(dialog)}
      title={dialog?.title || "Confirmer l'action"}
      onClose={closeDialog}
      width="520px"
      maxHeight="auto"
      zIndex={160}
    >
      <div className="confirm-dialog">
        <p className="confirm-dialog-message">{dialog?.message || "Voulez-vous poursuivre cette action ?"}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn secondary" onClick={closeDialog}>
            {dialog?.cancelLabel || "Annuler"}
          </button>
          <button
            type="button"
            className={`btn${dialog?.tone === "danger" ? " danger-solid" : ""}`}
            onClick={confirmDialog}
          >
            {dialog?.confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ActionConfirmDialog;
