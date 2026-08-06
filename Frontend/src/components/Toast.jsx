import { useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, dismissToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 3000);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className={`toast toast${toast.tone[0].toUpperCase()}${toast.tone.slice(1)}`} key={toast.id}>
      <span>{toast.message}</span>
      <button className="toastClose" onClick={dismissToast} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
