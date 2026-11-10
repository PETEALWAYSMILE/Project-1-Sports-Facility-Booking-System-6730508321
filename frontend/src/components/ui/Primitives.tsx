"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Trophy,
  Flame,
  Loader2,
} from "lucide-react";
import {
  BookingStatusType,
  SportKey,
  getSportMeta,
  resolveSportKey,
} from "@/lib/ui-helpers";
import { useLanguage } from "@/context/LanguageContext";

// 1. Sport Icon helper (Lucide only, no emojis)
export function SportIcon({
  sportType,
  className = "w-4 h-4",
}: {
  sportType?: string;
  className?: string;
}) {
  const key: SportKey = resolveSportKey(sportType);
  switch (key) {
    case "badminton":
      return <Flame className={className} />;
    case "tennis":
      return <CircleDot className={className} />;
    case "futsal":
      return <Trophy className={className} />;
    case "basketball":
      return <Activity className={className} />;
    case "fitness":
      return <Dumbbell className={className} />;
  }
}

// 2. SportBadge
export function SportBadge({
  sportType,
  size = "sm",
  showIcon = false,
  className = "",
}: {
  sportType?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}) {
  const { lang } = useLanguage();
  const meta = getSportMeta(sportType);
  const label = lang === "TH" ? meta.labelTH : meta.labelEN;

  const sizeClass =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${sizeClass} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor}`}
        aria-hidden="true"
      />
      {showIcon && <SportIcon sportType={sportType} className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </span>
  );
}

// 3. StatusPill (color + icon + text, never color alone)
export function StatusPill({
  status,
  className = "",
}: {
  status: BookingStatusType;
  className?: string;
}) {
  const { t } = useLanguage();

  const config: Record<
    BookingStatusType,
    {
      labelTH: string;
      labelEN: string;
      style: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      labelTH: "รอชำระเงิน",
      labelEN: "Pending Payment",
      style: "bg-amber-50 text-amber-800 border-amber-200",
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
    },
    confirmed: {
      labelTH: "ยืนยันแล้ว",
      labelEN: "Confirmed",
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
    },
    completed: {
      labelTH: "เสร็จสิ้น",
      labelEN: "Completed",
      style: "bg-sky-50 text-sky-800 border-sky-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
    },
    cancelled: {
      labelTH: "ยกเลิก",
      labelEN: "Cancelled",
      style: "bg-rose-50 text-rose-800 border-rose-200",
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
    },
  };

  const item = config[status] || config.confirmed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.style} ${className}`}
    >
      {item.icon}
      <span>{t(item.labelTH, item.labelEN)}</span>
    </span>
  );
}

// 4. Button
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white border border-transparent shadow-[0_1px_2px_rgba(0,113,227,0.2)] active:scale-[0.98]",
    secondary:
      "bg-white/90 hover:bg-white active:bg-slate-100 text-slate-800 border border-slate-300/80 hover:border-slate-400 shadow-sm active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-black/5 active:bg-black/10 text-slate-700 border border-transparent active:scale-[0.98]",
    danger:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-transparent shadow-sm active:scale-[0.98]",
  };

  const sizeClasses = {
    sm: "min-h-[40px] px-4 py-1.5 text-xs",
    md: "min-h-[44px] px-5 py-2 text-sm",
    lg: "min-h-[48px] px-7 py-2.5 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none tracking-tight ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

// 5. Input
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full min-h-[44px] rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3] disabled:bg-slate-100 disabled:text-slate-500 ${
            leftIcon ? "pl-10" : "px-3.5"
          } ${rightElement ? "pr-11" : "pr-3.5"} ${
            error
              ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
              : "border-slate-200/90 hover:border-slate-300"
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

// 6. Select
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border bg-white text-sm text-slate-900 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3] ${
          error ? "border-rose-400" : "border-slate-200/90 hover:border-slate-300"
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// 7. DatePicker
export interface DatePickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export function DatePicker({
  label,
  error,
  id,
  className = "",
  ...props
}: DatePickerProps) {
  const dateId = id || React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={dateId}
          className="block text-sm font-medium text-slate-800 tracking-tight"
        >
          {label}
        </label>
      )}
      <input
        id={dateId}
        type="date"
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border bg-white text-sm text-slate-900 tabular-price transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3] ${
          error ? "border-rose-400" : "border-slate-200/90 hover:border-slate-300"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// 8. Skeleton & CardSkeleton (No full-screen spinner)
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CourtCardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-slate-200 overflow-hidden shadow-soft">
      <div className="aspect-[16/10] w-full bg-slate-200/80 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-11 w-28 rounded-control" />
        </div>
      </div>
    </div>
  );
}

// 9. EmptyState
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="bg-white rounded-card border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-4 shadow-soft">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
        {icon || <Trophy className="w-6 h-6" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// 10. ErrorState
export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="bg-white rounded-card border border-rose-200 p-6 sm:p-8 text-center max-w-lg mx-auto my-4 shadow-soft"
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        {title || t("เกิดข้อผิดพลาดในการโหลดข้อมูล", "Unable to load data")}
      </h3>
      <p className="text-sm text-slate-600 mt-1">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
            {t("ลองใหม่อีกครั้ง", "Try Again")}
          </Button>
        </div>
      )}
    </div>
  );
}

// 11. Breadcrumb
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs sm:text-sm text-slate-500">
      <ol className="flex items-center flex-wrap gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-medium text-slate-900 truncate max-w-[220px] sm:max-w-xs"
                      : ""
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// 12. Tabs
export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: {
  tabs: { id: T; label: string; count?: number; icon?: React.ReactNode }[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs tabular-price ${
                  active
                    ? "bg-primary-light text-primary font-semibold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 13. Pagination
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t("ก่อนหน้า", "Previous")}</span>
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-w-[44px] min-h-[44px] rounded-control text-sm font-medium tabular-price transition-colors ${
              page === currentPage
                ? "bg-primary text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>{t("ถัดไป", "Next")}</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}
