import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, dismissToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className={"toast" + (toast.tone === "error" ? " toastError" : "")}>{toast.message}</div>
  );
}
