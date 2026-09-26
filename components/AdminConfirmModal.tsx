"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminBusy } from "@/components/AdminBusy";

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("admin-modal-open");
    titleRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("admin-modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="admin-modal-root" role="presentation">
      <button
        type="button"
        className="admin-modal-backdrop"
        aria-label="Fermer"
        onClick={onCancel}
        disabled={loading}
      />
      <div
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        aria-describedby="admin-modal-message"
      >
        <div className="admin-modal-icon" aria-hidden>
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h2 id="admin-modal-title" tabIndex={-1} ref={titleRef} className="admin-modal-title">
          {title}
        </h2>
        <div id="admin-modal-message" className="admin-modal-message">
          {message}
        </div>
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-btn ghost admin-btn--inline admin-modal-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--inline admin-modal-btn admin-modal-btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <AdminBusy label="Suppression…" inline /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
