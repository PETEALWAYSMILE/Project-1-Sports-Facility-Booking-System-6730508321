"use client";

import React from "react";
import { Booking } from "@/types";
import { formatMinutesToTime } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatBookingCode,
  formatReadableDate,
  getBookingComputedStatus,
} from "@/lib/ui-helpers";
import { SportBadge, StatusPill, Button } from "./ui/Primitives";
import { Modal } from "./ui/Overlays";
import {
  QrCode,
  Printer,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  CalendarPlus,
} from "lucide-react";

interface BookingPassModalProps {
  booking: (Booking & { isCancelled?: boolean }) | null;
  onClose: () => void;
}

export default function BookingPassModal({
  booking,
  onClose,
}: BookingPassModalProps) {
  const { lang, t } = useLanguage();
  if (!booking) return null;

  const facility =
    typeof booking.facility === "object" ? booking.facility : null;
  const bookedUser = typeof booking.user === "object" ? booking.user : null;
  const totalCost = facility ? facility.hourlyRate * booking.durationHours : 0;
  const endTime = formatMinutesToTime(booking.endMinutes);
  const bookingCode = formatBookingCode(booking._id);
  const computedStatus = getBookingComputedStatus(booking);

  const handleAddToCalendar = () => {
    const dateClean = booking.bookingDate.slice(0, 10).replace(/-/g, "");
    const startClean = booking.startTime.replace(":", "") + "00";
    const endClean = endTime.replace(":", "") + "00";
    const title = encodeURIComponent(
      `${facility?.name || "SportArenaHub"} (${bookingCode})`
    );
    const details = encodeURIComponent(
      `${t("รหัสการจอง", "Booking Ref")}: ${bookingCode}`
    );
    const location = encodeURIComponent(facility?.location || "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateClean}T${startClean}/${dateClean}T${endClean}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title={t("รายละเอียดใบจองสนามกีฬา", "Booking Confirmation Pass")}
      subtitle={`${t("หมายเลขการจอง", "Booking No.")} ${bookingCode}`}
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddToCalendar}
            >
              <CalendarPlus className="w-4 h-4 text-primary" />
              <span>{t("เพิ่มลงปฏิทิน", "Add to Calendar")}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              <span>{t("พิมพ์", "Print")}</span>
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {t("ปิดหน้าต่าง", "Done")}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Facility & Status Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1.5">
            {facility && <SportBadge sportType={facility.sportType} />}
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              {facility?.name || t("สนามกีฬา", "Sports Court")}
            </h3>
            {facility?.location && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{facility.location}</span>
              </p>
            )}
          </div>
          <StatusPill status={computedStatus} />
        </div>

        {/* Reference Code & QR Box */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-card p-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 block">
              {t("เลขที่การจอง", "Booking Reference")}
            </span>
            <span className="text-lg font-semibold text-slate-900 tabular-price">
              {bookingCode}
            </span>
            <span className="text-xs text-slate-500 block">
              {t(
                "แสดงรหัสนี้ต่อเจ้าหน้าที่หน้าสนาม",
                "Present this pass at the venue reception"
              )}
            </span>
          </div>
          <div className="w-16 h-16 rounded-control bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 shadow-soft">
            <QrCode className="w-11 h-11 text-slate-800" />
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{t("วันที่เข้าใช้สนาม", "Date")}</span>
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {formatReadableDate(booking.bookingDate, lang)}
            </div>
          </div>

          <div className="p-3.5 rounded-control bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{t("ช่วงเวลา", "Time")}</span>
            </div>
            <div className="font-semibold text-slate-900 text-sm tabular-price">
              {booking.startTime} - {endTime} {t("น.", "")}
            </div>
            <div className="text-slate-500 tabular-price">
              ({booking.durationHours} {t("ชั่วโมง", "hrs")})
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="pt-3 border-t border-slate-200 space-y-2 text-xs sm:text-sm">
          {bookedUser && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                {t("ชื่อผู้จอง", "Booked by")}
              </span>
              <span className="font-medium text-slate-900">
                {bookedUser.name}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-600">
            <span>{t("อัตราค่าบริการ", "Court Rate")}</span>
            <span className="tabular-price">
              ฿{facility?.hourlyRate?.toLocaleString() || 0} ×{" "}
              {booking.durationHours} {t("ชม.", "hrs")}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-semibold text-slate-900">
            <span>{t("ราคารวมทั้งสิ้น", "Total Amount")}</span>
            <span className="text-lg text-primary tabular-price">
              ฿{totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
