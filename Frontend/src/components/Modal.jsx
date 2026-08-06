import { useEffect } from "react";

export default function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modalOverlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modalWide" : ""}`}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="modalClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer && <div className="modalFoot">{footer}</div>}
      </div>
    </div>
  );
}
