import { useEffect, useMemo, useState } from "react";
import { ACTION_LOADING_EVENT, ACTION_STATUS_EVENT } from "../utils/actionFeedback";

const AUTO_CLOSE_MS = 3800;
const OVERLAY_MS = 1300;

const ActionStatusToast = () => {
  const [toasts, setToasts] = useState([]);
  const [overlay, setOverlay] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState([]);

  const playActionSound = useMemo(() => {
    let audioContext = null;
    return (status) => {
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        const frequency = status === "error" ? 220 : 540;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.36);
      } catch (_error) {
        // Ignore sound failures (autoplay or device restrictions).
      }
    };
  }, []);

  useEffect(() => {
    const handleStatusEvent = (event) => {
      const detail = event.detail || {};
      const nextToast = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: detail.status === "error" ? "error" : "success",
        message: detail.message || "Action terminee.",
      };
      setToasts((prev) => [...prev, nextToast]);
      setOverlay({ status: nextToast.status, message: nextToast.message });
      playActionSound(nextToast.status);
    };

    window.addEventListener(ACTION_STATUS_EVENT, handleStatusEvent);
    return () => window.removeEventListener(ACTION_STATUS_EVENT, handleStatusEvent);
  }, [playActionSound]);

  useEffect(() => {
    const handleLoadingEvent = (event) => {
      const detail = event.detail || {};
      if (detail.type === "start") {
        setLoadingEntries((prev) => [
          ...prev.filter((entry) => entry.id !== detail.id),
          { id: detail.id, message: detail.message || "Traitement en cours..." },
        ]);
        return;
      }

      if (detail.type === "stop") {
        setLoadingEntries((prev) => prev.filter((entry) => entry.id !== detail.id));
      }
    };

    window.addEventListener(ACTION_LOADING_EVENT, handleLoadingEvent);
    return () => window.removeEventListener(ACTION_LOADING_EVENT, handleLoadingEvent);
  }, []);

  const activeLoadingEntry = loadingEntries.length ? loadingEntries[loadingEntries.length - 1] : null;

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, AUTO_CLOSE_MS)
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [toasts]);

  useEffect(() => {
    if (!overlay) {
      return undefined;
    }
    const timer = window.setTimeout(() => setOverlay(null), OVERLAY_MS);
    return () => window.clearTimeout(timer);
  }, [overlay]);

  return (
    <>
      {overlay ? (
        <div className={`action-overlay action-${overlay.status}`} role="status" aria-live="assertive">
          <div className="action-overlay-circle">
            {overlay.status === "error" ? (
              <svg viewBox="0 0 24 24" width="42" height="42" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="42" height="42" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="action-overlay-text">
              {overlay.status === "error" ? "Échec" : "Succès"}
            </span>
          </div>
        </div>
      ) : null}
      {activeLoadingEntry ? (
        <div className="action-overlay action-loading" role="status" aria-live="polite" aria-busy="true">
          <div className="action-overlay-circle action-overlay-loading-circle">
            <span className="action-loader" aria-hidden="true" />
            <span className="action-overlay-text">{activeLoadingEntry.message}</span>
          </div>
        </div>
      ) : null}
      {toasts.length ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.status}`} role="status">
              <strong className="toast-title">{toast.status === "error" ? "Échec" : "Succès"}</strong>
              <p className="toast-message">{toast.message}</p>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default ActionStatusToast;
