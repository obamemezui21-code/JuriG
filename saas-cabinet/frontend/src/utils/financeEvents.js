const FINANCE_UPDATE_EVENT = "finance:updated";

export const emitFinanceUpdate = (detail = {}) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(FINANCE_UPDATE_EVENT, { detail }));
};

export const onFinanceUpdate = (handler) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  const listener = (event) => {
    if (typeof handler === "function") {
      handler(event.detail || {});
    }
  };
  window.addEventListener(FINANCE_UPDATE_EVENT, listener);
  return () => window.removeEventListener(FINANCE_UPDATE_EVENT, listener);
};
