"use client";

import React from "react";
import { Booking } from "@/types";
import { formatMinutesToTime } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  QrCode,
  Printer,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";

interface BookingPassModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export default function BookingPassModal({
  booking,
  onClose,
}: BookingPassModalProps) {
  const { t } = useLanguage();
  if (!booking) return null;

  const facility =
    typeof booking.facility === "object" ? booking.facility : null;
  const bookedUser = typeof booking.user === "object" ? booking.user : null;
  const totalCost = facility ? facility.hourlyRate * booking.durationHours : 0;
  const endTime = formatMinutesToTime(booking.endMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4" />
            {t("บัตรผ่านเข้าใช้งานสนามกีฬา", "Confirmed Sports Facility Pass")}
          </div>
          <h3 className="text-xl font-bold leading-snug">
            {facility?.name || "Sports Facility"}
          </h3>
          <p className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {facility?.location || "-"}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          {/* QR & Reference */}
          <div className="flex items-center justify-between bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {t("รหัสอ้างอิงการจอง (Booking ID)", "Booking Reference ID")}
              </div>
              <div className="font-mono text-xs font-bold text-slate-800 mt-0.5 break-all">
                {booking._id}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {facility?.sportType || "Sport"} •{" "}
                {t("ความจุ", "Cap")} {facility?.capacity || "-"}
              </div>
            </div>
            <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-2 shrink-0 shadow-sm">
              <QrCode className="w-12 h-12 text-slate-800" />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                VERIFIED
              </span>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {t("วันที่ใช้งาน", "Booking Date")}
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {booking.bookingDate.slice(0, 10)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {t("ช่วงเวลา", "Time Slot")}
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {booking.startTime} - {endTime}
              </div>
              <div className="text-[11px] text-slate-500">
                ({booking.durationHours} {t("ชั่วโมง", "hrs")})
              </div>
            </div>
          </div>

          {/* User & Cost */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            {bookedUser && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {t("ผู้จอง:", "Booked By:")}
                </span>
                <span className="font-semibold text-slate-800">
                  {bookedUser.name} ({bookedUser.email})
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-600">
              <span>{t("อัตราค่าบริการ:", "Hourly Rate:")}</span>
              <span>฿{facility?.hourlyRate?.toLocaleString() || 0} / hr</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>{t("ยอดชำระสุทธิ (Estimated Total):", "Estimated Total:")}</span>
              <span className="text-lg text-emerald-600">
                ฿{totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Printer className="w-4 h-4" />
              {t("พิมพ์ใบจอง / PDF", "Print Pass")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition"
            >
              {t("ปิดหน้าต่าง", "Done")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
