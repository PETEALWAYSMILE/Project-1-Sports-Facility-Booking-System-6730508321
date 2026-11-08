"use client";

import React, { useState, useEffect } from "react";
import { Booking, Facility, BookingInput, AvailabilitySlot } from "@/types";
import { api, formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { X, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface BookingEditModalProps {
  isOpen: boolean;
  booking: Booking | null;
  facilities: Facility[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<BookingInput>) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: 0.5, labelTH: "30 นาที (0.5 ชม.)", labelEN: "30 mins (0.5 hr)" },
  { value: 1, labelTH: "1 ชั่วโมง (1.0 ชม.)", labelEN: "1 hour (1.0 hr)" },
  { value: 1.5, labelTH: "1 ชั่วโมง 30 นาที (1.5 ชม.)", labelEN: "1.5 hours (1.5 hrs)" },
  { value: 2, labelTH: "2 ชั่วโมง (สูงสุด)", labelEN: "2 hours (Max)" },
];

const TIME_SLOTS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // 06:00 to 22:00
  return formatMinutesToTime(totalMinutes);
});

export default function BookingEditModal({
  isOpen,
  booking,
  facilities,
  onClose,
  onSave,
}: BookingEditModalProps) {
  const { t } = useLanguage();
  const [facilityId, setFacilityId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      const fId =
        typeof booking.facility === "object"
          ? booking.facility._id
          : booking.facility;
      setFacilityId(fId);
      setBookingDate(booking.bookingDate.slice(0, 10));
      setStartTime(booking.startTime);
      setDurationHours(booking.durationHours);
      setError(null);
    }
  }, [booking, isOpen]);

  useEffect(() => {
    if (!isOpen || !facilityId || !bookingDate) return;
    api
      .getFacilityAvailability(facilityId, bookingDate)
      .then((res) => setAvailability(res.data || []))
      .catch(() => setAvailability([]));
  }, [isOpen, facilityId, bookingDate]);

  if (!isOpen || !booking) return null;

  const selectedFacility = facilities.find((f) => f._id === facilityId);
  const todayUtc = getTodayUtcString();

  // Calculate proposed start & end minutes
  const [sh, sm] = (startTime || "00:00").split(":").map(Number);
  const proposedStart = sh * 60 + sm;
  const proposedEnd = proposedStart + durationHours * 60;

  // Check if overlaps with another booking on this facility (excluding current booking._id)
  const conflictingSlot = availability.find(
    (slot) =>
      slot._id !== booking._id &&
      slot.startMinutes < proposedEnd &&
      slot.endMinutes > proposedStart
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (bookingDate < todayUtc) {
      setError(
        t(
          "วันที่จองต้องไม่เป็นวันก่อนหน้าวันปัจจุบัน (Booking date cannot be in the past)",
          "Booking date cannot be in the past"
        )
      );
      return;
    }

    if (durationHours <= 0 || durationHours > 2) {
      setError(
        t(
          "จองได้สูงสุดไม่เกิน 2 ชั่วโมงต่อ 1 การจอง",
          "Booking duration must be between 0.5 and 2 hours"
        )
      );
      return;
    }

    if (proposedEnd > 1440) {
      setError(
        t(
          "การจองต้องสิ้นสุดภายในวันเดียวกัน (ไม่เกิน 24:00 น.)",
          "Booking must end on the same day"
        )
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSave(booking._id, {
        facility: facilityId,
        bookingDate,
        startTime,
        durationHours,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              {t("แก้ไขข้อมูลการจอง", "Edit Facility Booking")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-mono">
            Booking ID: {booking._id}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("เลือกสนามกีฬา (Sports Facility) *", "Sports Facility *")}
            </label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.sportType}) — ฿{f.hourlyRate}/hr
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("วันที่ใช้งาน (Booking Date) *", "Booking Date *")}
              </label>
              <input
                type="date"
                min={todayUtc}
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("เวลาเริ่มต้น (Start Time - 24h) *", "Start Time (HH:mm) *")}
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} น.
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t(
                "ระยะเวลาใช้งาน (สูงสุดไม่เกิน 2 ชั่วโมง) *",
                "Duration (Max 2 hours per booking) *"
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationHours(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                    durationHours === opt.value
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t(opt.labelTH, opt.labelEN)}
                </button>
              ))}
            </div>
          </div>

          {/* Live Slot Conflict Check */}
          {conflictingSlot ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {t(
                  `คำเตือน: ช่วงเวลา ${startTime} - ${formatMinutesToTime(
                    proposedEnd
                  )} มีการจองอื่นอยู่แล้ว (${conflictingSlot.startTime} - ${formatMinutesToTime(
                    conflictingSlot.endMinutes
                  )})`,
                  `Warning: Slot ${startTime} - ${formatMinutesToTime(
                    proposedEnd
                  )} overlaps with an existing booking (${conflictingSlot.startTime} - ${formatMinutesToTime(
                    conflictingSlot.endMinutes
                  )})`
                )}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t("ช่วงเวลาที่เลือก:", "Selected Time:")} {startTime} -{" "}
                {formatMinutesToTime(proposedEnd)} ({durationHours}{" "}
                {t("ชม.", "hrs")})
              </span>
              {selectedFacility && (
                <span className="font-bold text-sm text-emerald-700">
                  ฿
                  {(
                    selectedFacility.hourlyRate * durationHours
                  ).toLocaleString()}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t("ยกเลิก", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition"
            >
              {submitting
                ? t("กำลังบันทึก...", "Saving...")
                : t("บันทึกการแก้ไข", "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
