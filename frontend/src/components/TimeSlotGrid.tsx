"use client";

import React, { useState } from "react";
import { AvailabilitySlot, Booking } from "@/types";
import { formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { AlertCircle, Check } from "lucide-react";

export const TIME_SLOTS_30M = Array.from({ length: 32 }, (_, i) => {
  const startMin = 6 * 60 + i * 30; // 06:00 to 21:30 (ends 22:00)
  return {
    startMin,
    endMin: startMin + 30,
    label: formatMinutesToTime(startMin),
    endLabel: formatMinutesToTime(startMin + 30),
  };
});

export type SlotVisualState =
  | "AVAILABLE"
  | "SELECTED"
  | "BOOKED"
  | "MY_BOOKING"
  | "MY_CONFLICT"
  | "PAST";

interface TimeSlotGridProps {
  bookingDate: string;
  startTime: string;
  durationHours: number;
  onSelectRange: (newStartTime: string, newDurationHours: number) => void;
  availability: AvailabilitySlot[];
  myBookingsSameDate?: Booking[];
  currentUserId?: string;
}

export default function TimeSlotGrid({
  bookingDate,
  startTime,
  durationHours,
  onSelectRange,
  availability,
  myBookingsSameDate = [],
  currentUserId,
}: TimeSlotGridProps) {
  const { t } = useLanguage();
  const [rangeNotice, setRangeNotice] = useState<string | null>(null);

  const todayUtc = getTodayUtcString();
  const isToday = bookingDate === todayUtc;
  const now = new Date();
  const currentLocalMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = (startTime || "10:00").split(":").map(Number);
  const selectedStartMin =
    (Number.isFinite(sh) ? sh : 10) * 60 + (Number.isFinite(sm) ? sm : 0);
  const selectedEndMin = selectedStartMin + Number(durationHours) * 60;

  const getSlotState = (slotStart: number, slotEnd: number): SlotVisualState => {
    // 1. Check if booked on this facility
    const facilityBooking = availability.find(
      (b) => b.startMinutes < slotEnd && b.endMinutes > slotStart
    );
    if (facilityBooking) {
      if (currentUserId && facilityBooking.user === currentUserId) {
        return "MY_BOOKING";
      }
      return "BOOKED";
    }

    // 2. Check if user has a booking on another facility at the same time
    const otherConflict = myBookingsSameDate.find(
      (b) => b.startMinutes < slotEnd && b.endMinutes > slotStart
    );
    if (otherConflict) {
      return "MY_CONFLICT";
    }

    // 3. Check if slot is in the past (only when bookingDate is before today, or today and slot has already started/passed)
    if (bookingDate < todayUtc) {
      return "PAST";
    }
    if (isToday && slotEnd <= currentLocalMinutes) {
      return "PAST";
    }

    // 4. Check if currently selected
    if (selectedStartMin < slotEnd && selectedEndMin > slotStart) {
      return "SELECTED";
    }

    return "AVAILABLE";
  };

  const handleSlotClick = (slotStartMin: number, slotEndMin: number, label: string) => {
    setRangeNotice(null);

    // If user clicks a slot after the current start time, check if they want to extend continuous range
    if (slotStartMin > selectedStartMin) {
      const candidateDurationHours = (slotEndMin - selectedStartMin) / 60;

      if (candidateDurationHours <= 2) {
        // Check if any slot between selectedStartMin and slotEndMin is booked
        const hasBlockerInRange =
          availability.some(
            (b) => b.startMinutes < slotEndMin && b.endMinutes > selectedStartMin
          ) ||
          myBookingsSameDate.some(
            (b) => b.startMinutes < slotEndMin && b.endMinutes > selectedStartMin
          );

        if (hasBlockerInRange) {
          setRangeNotice(
            t(
              "ไม่สามารถเลือกข้ามช่วงเวลาที่มีผู้จองแล้วได้ ระบบจึงเปลี่ยนเวลาเริ่มเป็นช่องที่คลิกแทน",
              "Cannot span across an already booked slot. Start time updated to the clicked slot."
            )
          );
          onSelectRange(label, 1);
          return;
        }

        onSelectRange(startTime, candidateDurationHours);
        return;
      } else if (candidateDurationHours <= 3.5) {
        // User clicked slightly beyond 2 hours -> show clear rule notice & set new start time
        setRangeNotice(
          t(
            "จองได้สูงสุด 2 ชั่วโมงต่อรายการ (0.5 - 2 ชม.) ระบบจึงตั้งเวลาเริ่มต้นใหม่ที่ช่องนี้",
            "Maximum booking duration is 2 hours per booking (0.5 - 2 hrs). Set as new start time."
          )
        );
      }
    }

    // If clicking the exact start slot that's already selected with >0.5h, shrink to 0.5h
    if (slotStartMin === selectedStartMin && durationHours !== 0.5) {
      onSelectRange(label, 0.5);
      return;
    }

    // Default: set new start time, keep current duration if it fits within 22:00 and doesn't overlap, otherwise 0.5 or 1 hr
    const targetDuration =
      slotStartMin + durationHours * 60 <= 22 * 60 ? durationHours : 0.5;
    onSelectRange(label, targetDuration);
  };

  return (
    <div className="space-y-4">
      {/* Legend (Color + Text/Symbol) */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#4A4F4B] bg-[#F6F5F0] p-3 rounded-lg border border-[#E2DFD7]"
        aria-label={t("คำอธิบายสัญลักษณ์ตารางเวลา", "Time slot status legend")}
      >
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-white border border-[#D2CEC3] inline-block" />
          <span>{t("ว่าง", "Available")}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#143628] inline-flex items-center justify-center text-white">
            <Check className="w-2.5 h-2.5" />
          </span>
          <span className="font-medium text-[#181A18]">
            {t("กำลังเลือก", "Selected")}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#E6E3DC] border border-[#D2CEC3] inline-block" />
          <span>{t("จองแล้ว", "Booked")}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-[#EFECE6] border border-dashed border-[#D2CEC3] opacity-60 inline-block" />
          <span>{t("ช่วงที่ผ่านมาแล้ว", "Past")}</span>
        </div>
      </div>

      {/* Helper instruction + Duration Quick Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className="text-xs text-[#767B76]">
          {t(
            "คลิกช่องแรกเพื่อเลือกเวลาเริ่ม และคลิกช่องถัดไปเพื่อเลือกช่วงต่อเนื่อง (0.5 - 2 ชม.)",
            "Click a slot to set start time, or click a subsequent slot to select a continuous range (0.5 - 2 hrs)."
          )}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-[#767B76] mr-1">
            {t("ระยะเวลา:", "Duration:")}
          </span>
          {[0.5, 1, 1.5, 2].map((hr) => {
            const active = Number(durationHours) === hr;
            const exceedsDay = selectedStartMin + hr * 60 > 22 * 60;
            return (
              <button
                key={hr}
                type="button"
                disabled={exceedsDay}
                onClick={() => {
                  setRangeNotice(null);
                  onSelectRange(startTime, hr);
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium tabular-price border transition-colors ${
                  active
                    ? "bg-[#143628] text-white border-[#143628]"
                    : "bg-white text-[#4A4F4B] border-[#D2CEC3] hover:bg-[#F6F5F0] disabled:opacity-40 disabled:pointer-events-none"
                }`}
              >
                {hr} {t("ชม.", "hr")}
              </button>
            );
          })}
        </div>
      </div>

      {rangeNotice && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 text-[#946B22] shrink-0 mt-0.5" />
          <span>{rangeNotice}</span>
        </div>
      )}

      {/* 30-Minute Time Slot Grid */}
      <div
        role="group"
        aria-label={t("ตารางเลือกช่วงเวลาทีละ 30 นาที", "30-minute time slots")}
        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
      >
        {TIME_SLOTS_30M.map((slot) => {
          const state = getSlotState(slot.startMin, slot.endMin);
          const isDisabled =
            state === "BOOKED" ||
            state === "MY_BOOKING" ||
            state === "MY_CONFLICT" ||
            state === "PAST";

          let btnStyle =
            "bg-white hover:bg-[#EBF2EE] hover:border-[#143628] text-[#181A18] border-[#D2CEC3]";
          let statusLabel = t("ว่าง", "Open");

          if (state === "SELECTED") {
            btnStyle =
              "bg-[#143628] text-white border-[#143628] shadow-soft ring-2 ring-[#143628]/20";
            statusLabel = t("เลือกอยู่", "Selected");
          } else if (state === "BOOKED") {
            btnStyle =
              "bg-[#EFECE6] text-[#8C908C] border-[#E2DFD7] cursor-not-allowed";
            statusLabel = t("จองแล้ว", "Booked");
          } else if (state === "MY_BOOKING") {
            btnStyle =
              "bg-[#EBF2EE] text-[#143628] border-[#C5D9CE] cursor-not-allowed";
            statusLabel = t("คิวของคุณ", "Yours");
          } else if (state === "MY_CONFLICT") {
            btnStyle =
              "bg-[#FBF6EC] text-[#7C5819] border-[#E8D7B4] cursor-not-allowed";
            statusLabel = t("คิวชน", "Busy");
          } else if (state === "PAST") {
            btnStyle =
              "bg-[#F6F5F0] text-[#B8B3A6] border-dashed border-[#E2DFD7] opacity-65 cursor-not-allowed";
            statusLabel = t("ผ่านแล้ว", "Past");
          }

          return (
            <button
              key={slot.label}
              type="button"
              disabled={isDisabled}
              aria-pressed={state === "SELECTED"}
              aria-label={`${slot.label} - ${slot.endLabel} (${statusLabel})`}
              onClick={() =>
                handleSlotClick(slot.startMin, slot.endMin, slot.label)
              }
              className={`min-h-[48px] px-2.5 py-2 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${btnStyle}`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs sm:text-sm font-semibold tabular-price">
                  {slot.label}
                </span>
                {state === "SELECTED" && (
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between gap-1 w-full mt-0.5">
                <span
                  className={`text-[11px] tabular-price ${
                    state === "SELECTED" ? "text-[#C5D9CE]" : "opacity-75"
                  }`}
                >
                  - {slot.endLabel}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    state === "SELECTED"
                      ? "text-white"
                      : state === "AVAILABLE"
                      ? "text-[#143628]"
                      : ""
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
