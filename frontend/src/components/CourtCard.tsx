"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Facility } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { getFacilityPrimaryImage, getSportMeta } from "@/lib/ui-helpers";
import { SportBadge, SportIcon } from "./ui/Primitives";
import { MapPin, Users, Heart, Edit3, Trash2 } from "lucide-react";

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
    <article className="group bg-white rounded-xl border border-[#E2DFD7] hover:border-[#B8B3A6] shadow-soft hover:shadow-card transition-all duration-200 flex flex-col overflow-hidden">
      {/* Image Container with fixed aspect ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFECE6]">
        {!imgError && primaryImg ? (
          <img
            src={primaryImg}
            alt={facility.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
            className="bg-white/95 border-[#D2CEC3] shadow-soft"
          />
        </div>

        {/* Top Right: Favorite Heart Button */}
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
            className={`absolute top-2.5 right-2.5 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center border transition-colors duration-150 ${
              isFavorite
                ? "bg-white border-[#E8C8C3] text-[#992B1E] shadow-soft"
                : "bg-white/90 border-[#D2CEC3] text-[#4A4F4B] hover:bg-white hover:text-[#992B1E] shadow-soft"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? "fill-[#992B1E] text-[#992B1E]" : ""
              }`}
            />
          </button>
        )}

        {/* Bottom Left: Availability Status Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/95 text-[#143628] border border-[#D2CEC3] shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-[#143628] shrink-0" />
            <span>{t("ว่างวันนี้", "Available Today")}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={detailHref} className="block focus:outline-none">
            <h3 className="text-base sm:text-lg font-semibold text-[#181A18] group-hover:text-[#143628] transition-colors line-clamp-1">
              {facility.name}
            </h3>
          </Link>

          <div className="space-y-1.5 text-xs sm:text-sm text-[#4A4F4B]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#767B76] shrink-0" />
              <span className="line-clamp-1">{facility.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#767B76] shrink-0" />
              <span>
                {t("รองรับสูงสุด", "Up to")}{" "}
                <strong className="font-semibold text-[#181A18] tabular-price">
                  {facility.capacity}
                </strong>{" "}
                {t("คน", "players")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Price & Book CTA */}
        <div className="pt-3.5 border-t border-[#EFECE6] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#767B76] block">
              {t("อัตราค่าบริการ", "Rate")}
            </span>
            <div className="text-lg font-semibold text-[#143628] tabular-price">
              ฿{facility.hourlyRate.toLocaleString()}
              <span className="text-xs font-normal text-[#767B76]">
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
                  aria-label={t(
                    `แก้ไข ${facility.name}`,
                    `Edit ${facility.name}`
                  )}
                  className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#F6F5F0] hover:text-[#181A18] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adminActions.onDelete(facility)}
                  aria-label={t(
                    `ลบ ${facility.name}`,
                    `Delete ${facility.name}`
                  )}
                  className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#FAF0EE] hover:text-[#992B1E] hover:border-[#E8C8C3] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <Link
              href={detailHref}
              className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-[#143628] hover:bg-[#1B4534] active:bg-[#0E271D] text-white text-sm font-medium transition-colors shadow-soft"
            >
              {t("จองสนาม", "Book Court")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
