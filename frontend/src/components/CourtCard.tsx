"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Facility } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import {
  getFacilityPrimaryImage,
  getSportMeta,
} from "@/lib/ui-helpers";
import { SportBadge, SportIcon } from "./ui/Primitives";
import { MapPin, Users, Heart, CheckCircle2, Edit3, Trash2 } from "lucide-react";

interface CourtCardProps {
  facility: Facility;
  isFavorite?: boolean;
  onToggleFavorite?: (facilityId: string) => void;
  selectedDate?: string;
  adminActions?: {
    onEdit: (facility: Facility) => void;
    onDelete: (facility: Facility) => void;
  };
}

export default function CourtCard({
  facility,
  isFavorite = false,
  onToggleFavorite,
  selectedDate,
  adminActions,
}: CourtCardProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const primaryImg = getFacilityPrimaryImage(facility);
  const sportMeta = getSportMeta(facility.sportType);

  const detailHref = selectedDate
    ? `/facilities/${facility._id}?date=${encodeURIComponent(selectedDate)}`
    : `/facilities/${facility._id}`;

  return (
    <article className="group bg-white rounded-2xl border border-black/5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container with fixed aspect ratio to prevent layout shift */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {!imgError && primaryImg ? (
          <img
            src={primaryImg}
            alt={facility.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center gap-2 ${sportMeta.fallbackBg} ${sportMeta.fallbackIconText}`}
          >
            <SportIcon sportType={facility.sportType} className="w-10 h-10" />
            <span className="text-xs font-medium">
              {t(sportMeta.labelTH, sportMeta.labelEN)}
            </span>
          </div>
        )}

        {/* Top Left: Sport Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <SportBadge
            sportType={facility.sportType}
            className="shadow-soft bg-white/95"
          />
        </div>

        {/* Top Right: Favorite Heart Button (min 44x44px touch target) */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(facility._id);
            }}
            aria-label={
              isFavorite
                ? t(
                    `นำ ${facility.name} ออกจากรายการโปรด`,
                    `Remove ${facility.name} from favorites`
                  )
                : t(
                    `เพิ่ม ${facility.name} ในรายการโปรด`,
                    `Add ${facility.name} to favorites`
                  )
            }
            aria-pressed={isFavorite}
            className={`absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors duration-150 ${
              isFavorite
                ? "bg-white text-rose-600 shadow-soft"
                : "bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600 shadow-soft"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </button>
        )}

        {/* Bottom Left: Availability Status Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/95 text-emerald-800 border border-emerald-200 shadow-soft">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{t("ว่างวันนี้", "Available Today")}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link href={detailHref} className="block focus:outline-none">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
              {facility.name}
            </h3>
          </Link>

          <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{facility.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {t("รองรับสูงสุด", "Up to")}{" "}
                <strong className="font-medium text-slate-800 tabular-price">
                  {facility.capacity}
                </strong>{" "}
                {t("คน", "players")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Price & Book CTA */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">
              {t("ราคาเริ่มต้น", "Rate")}
            </span>
            <div className="text-lg font-semibold text-primary tabular-price">
              ฿{facility.hourlyRate.toLocaleString()}
              <span className="text-xs font-normal text-slate-500">
                {" "}
                / {t("ชม.", "hr")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {adminActions && (
              <>
                <button
                  type="button"
                  onClick={() => adminActions.onEdit(facility)}
                  aria-label={t(`แก้ไข ${facility.name}`, `Edit ${facility.name}`)}
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adminActions.onDelete(facility)}
                  aria-label={t(`ลบ ${facility.name}`, `Delete ${facility.name}`)}
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <Link
              href={detailHref}
              className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-sm font-medium transition-all shadow-[0_1px_2px_rgba(0,113,227,0.25)] active:scale-95"
            >
              {t("จองเลย", "Book Now")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
