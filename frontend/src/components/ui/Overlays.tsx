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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181A18]/50 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-xl border border-[#D2CEC3] shadow-elevated w-full ${maxWidth} overflow-hidden my-auto max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E2DFD7] shrink-0">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-[#181A18] tracking-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#767B76] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ปิดหน้าต่าง", "Close modal")}
            className="min-w-[36px] min-h-[36px] -mr-1 -mt-1 inline-flex items-center justify-center rounded-lg text-[#767B76] hover:text-[#181A18] hover:bg-[#F3F1EC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-[#F6F5F0] border-t border-[#E2DFD7] flex items-center justify-end gap-2.5 shrink-0">
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
      className="fixed inset-0 z-50 flex bg-[#181A18]/50"
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
            ? "mt-auto w-full bg-white rounded-t-xl border-t border-[#D2CEC3] shadow-elevated max-h-[85vh] flex flex-col"
            : "ml-auto w-full max-w-md bg-white h-full border-l border-[#D2CEC3] shadow-elevated flex flex-col"
        }
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E2DFD7] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#181A18]">{title}</h2>
            {subtitle && (
              <p className="text-xs text-[#767B76] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ปิดหน้าต่าง", "Close drawer")}
            className="min-w-[40px] min-h-[40px] -mr-2 -mt-1 inline-flex items-center justify-center rounded-lg text-[#767B76] hover:text-[#181A18] hover:bg-[#F3F1EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 bg-[#F6F5F0] border-t border-[#E2DFD7] flex items-center justify-end gap-2.5 shrink-0">
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
          <div className="w-10 h-10 rounded-lg bg-[#FAF0EE] text-[#992B1E] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-[#4A4F4B] leading-relaxed pt-1">
            {description}
          </p>
        </div>

        {policyNotice && (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-xs text-[#7C5819] space-y-1">
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
    success: "bg-[#EBF2EE] border-[#C5D9CE] text-[#143628]",
    error: "bg-[#FAF0EE] border-[#E8C8C3] text-[#8B2E22]",
    info: "bg-[#F3F1EC] border-[#D2CEC3] text-[#181A18]",
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#992B1E] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#143628] shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)] sm:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-elevated text-sm font-medium ${styles[type]}`}
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
