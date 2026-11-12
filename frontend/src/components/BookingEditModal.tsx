"use client";

import React, { useState, useEffect } from "react";
import { Booking, Facility, BookingInput, AvailabilitySlot } from "@/types";
import { api, formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatBookingCode,
  getSportName,
} from "@/lib/ui-helpers";
import { Modal } from "./ui/Overlays";
import { Button, DatePicker, Select } from "./ui/Primitives";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface BookingEditModalProps {
  isOpen: boolean;
  booking: Booking | null;
  facilities: Facility[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<BookingInput>) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: 0.5, labelTH: "0.5 ชม. (30 นาที)", labelEN: "0.5 hr (30 mins)" },
  { value: 1, labelTH: "1.0 ชม.", labelEN: "1.0 hr" },
  { value: 1.5, labelTH: "1.5 ชม.", labelEN: "1.5 hrs" },
  { value: 2, labelTH: "2.0 ชม. (สูงสุด)", labelEN: "2.0 hrs (Max)" },
];

const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // 06:00 to 21:30
  return formatMinutesToTime(totalMinutes);
});

export default function BookingEditModal({
  isOpen,
  booking,
  facilities,
  onClose,
  onSave,
}: BookingEditModalProps) {
  const { lang, t } = useLanguage();
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
  const bookingCode = formatBookingCode(booking._id);

  const [sh, sm] = (startTime || "00:00").split(":").map(Number);
  const proposedStart = sh * 60 + sm;
  const proposedEnd = proposedStart + durationHours * 60;

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
          "วันที่จองต้องเป็นวันนี้หรือวันล่วงหน้าเท่านั้น",
          "Booking date cannot be in the past"
        )
      );
      return;
    }

    if (durationHours <= 0 || durationHours > 2) {
      setError(
        t(
          "จองได้ตั้งแต่ 0.5 ถึง 2 ชั่วโมงต่อรายการ",
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
      setError(
        err instanceof Error ? err.message : t("ไม่สามารถบันทึกการแก้ไขได้", "Failed to update booking")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("แก้ไขวันและเวลาการจอง", "Reschedule Booking")}
      subtitle={`${t("หมายเลขการจอง", "Booking Ref")}: ${bookingCode}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t("ยกเลิก", "Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            {t("บันทึกการเปลี่ยนแปลง", "Save Changes")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Select
          label={t("สนามกีฬา", "Court / Facility")}
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          options={facilities.map((f) => ({
            value: f._id,
            label: `${f.name} (${getSportName(f.sportType, lang)}) — ฿${f.hourlyRate}/${t("ชม.", "hr")}`,
          }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label={t("วันที่เข้าใช้สนาม", "Booking Date")}
            min={todayUtc}
            required
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />

          <Select
            label={t("เวลาเริ่มต้น", "Start Time")}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            options={TIME_SLOTS.map((slot) => ({
              value: slot,
              label: `${slot} ${t("น.", "")}`,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-800">
            {t("ระยะเวลาใช้งาน (0.5 - 2 ชั่วโมง)", "Duration (0.5 - 2 hours)")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDurationHours(opt.value)}
                className={`min-h-[44px] px-3 py-2 rounded-control text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 tabular-price ${
                  durationHours === opt.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t(opt.labelTH, opt.labelEN)}</span>
              </button>
            ))}
          </div>
        </div>

        {conflictingSlot ? (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#946B22] mt-0.5" />
            <span>
              {t(
                `ช่วงเวลา ${startTime} - ${formatMinutesToTime(
                  proposedEnd
                )} น. มีผู้จองแล้ว (${conflictingSlot.startTime} - ${formatMinutesToTime(
                  conflictingSlot.endMinutes
                )} น.) กรุณาเลือกเวลาอื่น`,
                `Time ${startTime} - ${formatMinutesToTime(
                  proposedEnd
                )} overlaps with an existing booking (${conflictingSlot.startTime} - ${formatMinutesToTime(
                  conflictingSlot.endMinutes
                )}).`
              )}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-[#EBF2EE] border border-[#C5D9CE] text-[#143628] text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#143628] shrink-0" />
              <span>
                {t("เวลาใหม่:", "New Slot:")}{" "}
                <strong className="tabular-price">
                  {startTime} - {formatMinutesToTime(proposedEnd)}
                </strong>{" "}
                ({durationHours} {t("ชม.", "hrs")})
              </span>
            </span>
            {selectedFacility && (
              <span className="font-semibold text-sm text-[#143628] tabular-price">
                ฿{(selectedFacility.hourlyRate * durationHours).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
