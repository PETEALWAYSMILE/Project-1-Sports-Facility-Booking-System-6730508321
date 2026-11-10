"use client";

import React, { useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "./Primitives";
import { useLanguage } from "@/context/LanguageContext";

// 1. Modal / Dialog
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-3xl border border-black/5 shadow-elevated w-full ${maxWidth} overflow-hidden my-auto max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#86868b] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ปิดหน้าต่าง", "Close modal")}
            className="min-w-[36px] min-h-[36px] -mr-1 -mt-1 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#1d1d1f] hover:bg-black/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Drawer (Right Slide-Over on Desktop, Bottom Sheet on Mobile if desired)
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = "right",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: "right" | "bottom";
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBottom = position === "bottom";

  return (
    <div
      className="fixed inset-0 z-50 flex bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={
          isBottom
            ? "mt-auto w-full bg-white rounded-t-2xl border-t border-slate-200 shadow-elevated max-h-[85vh] flex flex-col"
            : "ml-auto w-full max-w-md bg-white h-full border-l border-slate-200 shadow-elevated flex flex-col"
        }
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ปิดหน้าต่าง", "Close drawer")}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 inline-flex items-center justify-center rounded-control text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. ConfirmDialog (for irreversible actions: Cancel Booking, Delete Facility)
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  policyNotice,
  confirmLabel,
  cancelLabel,
  loading = false,
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  policyNotice?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}) {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel || t("กลับไปก่อน", "Keep It")}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel || t("ยืนยันการดำเนินการ", "Confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed pt-1">
            {description}
          </p>
        </div>

        {policyNotice && (
          <div className="p-3.5 rounded-control bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-semibold">
              {t("เงื่อนไขการดำเนินการ:", "Cancellation & Action Policy:")}
            </div>
            <p className="leading-relaxed">{policyNotice}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 4. Toast Notification Banner
export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string | null;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}) {
  const { t } = useLanguage();
  if (!message) return null;

  const styles = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-900",
    error: "bg-rose-50 border-rose-300 text-rose-900",
    info: "bg-sky-50 border-sky-300 text-sky-900",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)] sm:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-card border shadow-elevated text-sm font-medium ${styles[type]}`}
    >
      <div className="flex items-center gap-2.5">
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("ปิดการแจ้งเตือน", "Dismiss notification")}
          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg hover:bg-black/5 text-current"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
