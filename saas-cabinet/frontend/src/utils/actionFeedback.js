export const ACTION_STATUS_EVENT = "app:action-status";
export const ACTION_LOADING_EVENT = "app:action-loading";
export const ACTION_CONFIRM_EVENT = "app:action-confirm";

const dispatchWindowEvent = (eventName, detail) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

export const notifyActionStatus = (status, message) => {
  dispatchWindowEvent(ACTION_STATUS_EVENT, {
    status: status === "error" ? "error" : "success",
    message,
  });
};

export const startActionLoading = (message = "Traitement en cours...") => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  dispatchWindowEvent(ACTION_LOADING_EVENT, {
    type: "start",
    id,
    message,
  });
  return id;
};

export const stopActionLoading = (id) => {
  if (!id) {
    return;
  }

  dispatchWindowEvent(ACTION_LOADING_EVENT, {
    type: "stop",
    id,
  });
};

export const confirmAction = ({
  title = "Confirmer l'action",
  message = "Voulez-vous poursuivre cette action ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
} = {}) =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(true);
      return;
    }

    dispatchWindowEvent(ACTION_CONFIRM_EVENT, {
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
