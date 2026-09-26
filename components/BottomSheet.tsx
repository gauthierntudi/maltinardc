"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ContestMechanic } from "@/components/ContestMechanic";

type BottomSheetProps = {
  open: boolean;
  variant: "success" | "error";
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
};

export function BottomSheet({
  open,
  variant,
  title,
  message,
  actionLabel = "Fermer",
  onClose,
}: BottomSheetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("sheet-open");
    titleRef.current?.focus();
    return () => {
      document.body.classList.remove("sheet-open");
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="sheet-root" role="presentation">
      <button type="button" className="sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div
        className={`sheet panel-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby={variant === "success" ? "sheet-mechanic" : "sheet-message"}
      >
        <div className={`sheet-icon ${variant}`} aria-hidden="true">
          {variant === "success" ? (
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M5 12.5 9.5 17 19 7.5"
                fill="none"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M12 8v5m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <h2 id="sheet-title" tabIndex={-1} ref={titleRef}>
          {title}
        </h2>
        <p id="sheet-message" className="sheet-message">
          {message}
        </p>

        {variant === "success" ? (
          <div id="sheet-mechanic">
            <ContestMechanic />
          </div>
        ) : null}

        <button type="button" className="sheet-action" onClick={onClose}>
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
