import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

export const Modal: React.FC<BaseProps & { children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const inner = (
    <div
      ref={backdropRef}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii-pop dark:shadow-kawaii-dark-pop overflow-hidden text-neutral-900 dark:text-neutral-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-kawaii-ink dark:border-white bg-kawaii-subtle dark:bg-kawaii-darkSubtle">
          <h2 className="text-base font-black font-heading text-kawaii-ink dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm text-kawaii-ink dark:text-white hover:bg-kawaii-pink hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
        <div className="p-6 text-sm text-neutral-800 dark:text-neutral-200">{children}</div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") return createPortal(inner, document.body);
  return inner;
};

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Konfirmasi",
  variant = "primary",
  loading
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex gap-3 items-start">
          {variant === "danger" ? (
            <div className="p-2 rounded-2xl bg-kawaii-pink text-white border-2 border-kawaii-ink shadow-kawaii-sm shrink-0">
              <AlertTriangle className="h-5 w-5 stroke-[2.5]" />
            </div>
          ) : (
            <div className="p-2 rounded-2xl bg-kawaii-blue text-kawaii-ink border-2 border-kawaii-ink shadow-kawaii-sm shrink-0">
              <Info className="h-5 w-5 stroke-[2.5]" />
            </div>
          )}
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pt-1">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={!!loading}
            className="flex-1 py-3 bg-kawaii-card dark:bg-kawaii-darkCard hover:bg-neutral-100 dark:hover:bg-neutral-800 text-kawaii-ink dark:text-white border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm rounded-2xl text-sm font-black active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!!loading}
            className={`flex-1 py-3 rounded-2xl text-sm font-black border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60 transition-all ${
              variant === "danger"
                ? "bg-kawaii-pink text-white hover:bg-kawaii-pinkDark"
                : "bg-kawaii-peach text-kawaii-ink hover:bg-kawaii-peachDark"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "success" | "error" | "info";
}

export const AlertModal: React.FC<AlertModalProps> = ({ open, onClose, title, message, variant = "info" }) => {
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertTriangle : Info;
  const cls =
    variant === "success"
      ? "bg-kawaii-green/30 dark:bg-kawaii-green/20 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100"
      : variant === "error"
        ? "bg-kawaii-pink/20 dark:bg-kawaii-pink/20 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100"
        : "bg-kawaii-blue/20 dark:bg-kawaii-blue/20 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className={`p-4 rounded-2xl border-3 shadow-kawaii-sm dark:shadow-kawaii-dark-sm flex gap-3.5 items-start ${cls}`}>
          <Icon className="h-5 w-5 shrink-0 mt-0.5 stroke-[2.5]" />
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-kawaii-peach hover:bg-kawaii-peachDark border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm rounded-2xl text-sm font-black text-kawaii-ink active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
};
