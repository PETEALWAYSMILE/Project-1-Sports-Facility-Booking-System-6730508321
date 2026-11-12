"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Check,
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

// 2. SportBadge — Unified Deep Forest & Warm Stone badge
export function SportBadge({
  sportType,
  size = "sm",
  showIcon = true,
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
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border bg-[#F3F1EC] text-[#143628] border-[#DCD8CE] ${sizeClass} ${className}`}
    >
      {showIcon ? (
        <SportIcon sportType={sportType} className="w-3.5 h-3.5 text-[#143628] shrink-0" />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#143628]"
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

// 3. StatusPill — Muted editorial tones (color + icon + text)
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
      style: "bg-[#FBF6EC] text-[#7C5819] border-[#E8D7B4]",
      icon: <Clock className="w-3.5 h-3.5 text-[#946B22] shrink-0" />,
    },
    confirmed: {
      labelTH: "ยืนยันแล้ว",
      labelEN: "Confirmed",
      style: "bg-[#EBF2EE] text-[#143628] border-[#C5D9CE]",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#143628] shrink-0" />,
    },
    completed: {
      labelTH: "เสร็จสิ้น",
      labelEN: "Completed",
      style: "bg-[#EFECE6] text-[#4A4F4B] border-[#DCD8CE]",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#4A4F4B] shrink-0" />,
    },
    cancelled: {
      labelTH: "ยกเลิก",
      labelEN: "Cancelled",
      style: "bg-[#FAF0EE] text-[#8B2E22] border-[#E8C8C3]",
      icon: <XCircle className="w-3.5 h-3.5 text-[#A1382B] shrink-0" />,
    },
  };

  const item = config[status] || config.confirmed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${item.style} ${className}`}
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
      "bg-[#143628] hover:bg-[#1B4534] active:bg-[#0E271D] text-white border border-transparent shadow-soft",
    secondary:
      "bg-white hover:bg-[#F6F5F0] active:bg-[#EFECE6] text-[#181A18] border border-[#D2CEC3] hover:border-[#B8B3A6] shadow-soft",
    ghost:
      "bg-transparent hover:bg-[#EFECE6] active:bg-[#E2DFD7] text-[#4A4F4B] hover:text-[#181A18] border border-transparent",
    danger:
      "bg-[#992B1E] hover:bg-[#822318] active:bg-[#6B1C13] text-white border border-transparent shadow-soft",
  };

  const sizeClasses = {
    sm: "min-h-[38px] px-3.5 py-1.5 text-xs",
    md: "min-h-[44px] px-4 py-2 text-sm",
    lg: "min-h-[48px] px-6 py-2.5 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none ${
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
          className="block text-xs sm:text-sm font-medium text-[#181A18]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#767B76] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full min-h-[44px] rounded-lg border bg-white text-sm text-[#181A18] placeholder:text-[#8C908C] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#143628]/20 focus:border-[#143628] disabled:bg-[#F3F1EC] disabled:text-[#767B76] ${
            leftIcon ? "pl-10" : "px-3.5"
          } ${rightElement ? "pr-11" : "pr-3.5"} ${
            error
              ? "border-[#C24132] focus:ring-[#C24132]/20 focus:border-[#C24132]"
              : "border-[#D2CEC3] hover:border-[#B8B3A6]"
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
        <p className="text-xs font-medium text-[#992B1E]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#767B76]">{hint}</p>
      ) : null}
    </div>
  );
}

// 6. Custom Select Dropdown (Replaces native OS <select> bevel button)
export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  error?: string | null;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  onValueChange?: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  onValueChange,
  id,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}: SelectProps) {
  const selectId = id || React.useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (val: string) => {
    onChange?.({ target: { value: val } });
    onValueChange?.(val);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label
          id={`${selectId}-label`}
          htmlFor={selectId}
          className="block text-xs sm:text-sm font-medium text-[#181A18]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel || label}
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border bg-white text-left text-sm font-medium text-[#181A18] transition-colors duration-150 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#143628]/20 focus:border-[#143628] disabled:bg-[#F3F1EC] disabled:text-[#767B76] ${
            open
              ? "border-[#143628] ring-2 ring-[#143628]/15"
              : error
              ? "border-[#C24132]"
              : "border-[#D2CEC3] hover:border-[#B8B3A6]"
          } ${className}`}
        >
          <span className="flex items-center gap-2.5 truncate">
            {selectedOption?.icon && (
              <span className="text-[#143628] shrink-0">
                {selectedOption.icon}
              </span>
            )}
            <span className="truncate">{selectedOption?.label || ""}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#767B76] shrink-0 transition-transform duration-150 ${
              open ? "rotate-180 text-[#143628]" : ""
            }`}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className="absolute left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-[#D2CEC3] bg-white py-1.5 shadow-elevated z-50"
          >
            {options.map((opt) => {
              const isSelected = opt.value === selectedOption?.value;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3.5 py-2.5 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? "bg-[#EBF2EE] text-[#143628] font-semibold"
                        : "text-[#181A18] hover:bg-[#F6F5F0]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {opt.icon && (
                        <span
                          className={`shrink-0 ${
                            isSelected ? "text-[#143628]" : "text-[#767B76]"
                          }`}
                        >
                          {opt.icon}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#143628] shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-[#992B1E]" role="alert">
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
          className="block text-xs sm:text-sm font-medium text-[#181A18]"
        >
          {label}
        </label>
      )}
      <input
        id={dateId}
        type="date"
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border bg-white text-sm text-[#181A18] tabular-price transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#143628]/20 focus:border-[#143628] ${
          error
            ? "border-[#C24132]"
            : "border-[#D2CEC3] hover:border-[#B8B3A6]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-[#992B1E]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// 8. Skeleton & CardSkeleton
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#E6E3DC] ${className}`}
      aria-hidden="true"
    />
  );
}

export function CourtCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E2DFD7] overflow-hidden shadow-soft">
      <div className="aspect-[16/10] w-full bg-[#E6E3DC] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 flex items-center justify-between border-t border-[#EFECE6]">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-28 rounded-lg" />
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
    <div className="bg-white rounded-xl border border-[#E2DFD7] p-8 sm:p-12 text-center max-w-lg mx-auto my-4 shadow-soft">
      <div className="w-12 h-12 rounded-lg bg-[#EFECE6] text-[#143628] flex items-center justify-center mx-auto mb-4">
        {icon || <Trophy className="w-6 h-6" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[#181A18]">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#767B76] mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#143628] hover:bg-[#1B4534] text-white text-sm font-medium transition-colors"
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
      className="bg-white rounded-xl border border-[#E8C8C3] p-6 sm:p-8 text-center max-w-lg mx-auto my-4 shadow-soft"
      role="alert"
    >
      <div className="w-12 h-12 rounded-lg bg-[#FAF0EE] text-[#992B1E] flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#181A18]">
        {title || t("เกิดข้อผิดพลาดในการโหลดข้อมูล", "Unable to load data")}
      </h3>
      <p className="text-sm text-[#4A4F4B] mt-1">{message}</p>
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
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-xs sm:text-sm text-[#767B76]"
    >
      <ol className="flex items-center flex-wrap gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[#767B76] shrink-0"
                  aria-hidden="true"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[#143628] transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-medium text-[#181A18] truncate max-w-[220px] sm:max-w-xs"
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
      className={`flex items-center gap-1 border-b border-[#E2DFD7] overflow-x-auto no-scrollbar ${className}`}
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
                ? "border-[#143628] text-[#143628] font-semibold"
                : "border-transparent text-[#4A4F4B] hover:text-[#181A18] hover:border-[#D2CEC3]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-2 py-0.5 rounded-md text-xs tabular-price ${
                  active
                    ? "bg-[#EBF2EE] text-[#143628] font-semibold"
                    : "bg-[#EFECE6] text-[#4A4F4B]"
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
      className="flex items-center justify-between gap-2 pt-4 border-t border-[#E2DFD7]"
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
            className={`min-w-[40px] min-h-[40px] rounded-lg text-sm font-medium tabular-price transition-colors ${
              page === currentPage
                ? "bg-[#143628] text-white"
                : "text-[#4A4F4B] hover:bg-[#EFECE6]"
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
