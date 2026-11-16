"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Booking, Facility, BookingInput, AvailabilitySlot } from "@/types";
import { api, formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatBookingCode,
  formatReadableDate,
} from "@/lib/ui-helpers";
import TimeSlotGrid, { TIME_SLOTS_30M } from "./TimeSlotGrid";
import { Modal } from "./ui/Overlays";
import { Button, DatePicker, SportBadge } from "./ui/Primitives";
import { AlertCircle, CheckCircle2, MapPin, Lock } from "lucide-react";

interface BookingEditModalProps {
  isOpen: boolean;
  booking: Booking | null;
  facilities: Facility[];
  onClose: () => void;
  onSave: (id: string, payload: Partial<BookingInput>) => Promise<void>;
}

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
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
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
    Promise.all([
      api.getFacilityAvailability(facilityId, bookingDate),
      api.getBookings().catch(() => ({ data: [] as Booking[] })),
    ])
      .then(([availRes, bookRes]) => {
        setAvailability(availRes.data || []);
        setUserBookings(bookRes.data || []);
      })
      .catch(() => {
        setAvailability([]);
      });
  }, [isOpen, facilityId, bookingDate]);

  const bookingOwnerId = useMemo(() => {
    if (!booking) return undefined;
    return typeof booking.user === "object"
      ? booking.user._id || booking.user.id
      : booking.user;
  }, [booking]);

  // Exclude the current booking being edited so its own slot remains selectable
  const otherFacilityAvailability = useMemo(
    () =>
      booking
        ? availability.filter((slot) => slot._id !== booking._id)
        : availability,
    [availability, booking]
  );

  // Other bookings owned by the same user on the selected date (across other courts)
  const ownerOtherBookingsSameDate = useMemo(() => {
    if (!booking || !bookingOwnerId) return [];
    return userBookings.filter((b) => {
      if (b._id === booking._id) return false;
      const bOwner =
        typeof b.user === "object" ? b.user._id || b.user.id : b.user;
      return (
        bOwner === bookingOwnerId &&
        b.bookingDate.slice(0, 10) === bookingDate
      );
    });
  }, [booking, bookingOwnerId, userBookings, bookingDate]);

  // If user switches to a date where the current startTime is in the past or occupied, auto-pick first available slot
  useEffect(() => {
    if (!isOpen || !booking || !bookingDate) return;
    const todayUtc = getTodayUtcString();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (startTime || "10:00").split(":").map(Number);
    const curStart = sh * 60 + sm;
    const curEnd = curStart + durationHours * 60;

    const isCurrentSlotPast =
      bookingDate === todayUtc && curStart <= currentMinutes;
    const isCurrentSlotTaken =
      otherFacilityAvailability.some(
        (s) => s.startMinutes < curEnd && s.endMinutes > curStart
      ) ||
      ownerOtherBookingsSameDate.some(
        (b) => b.startMinutes < curEnd && b.endMinutes > curStart
      );

    if (isCurrentSlotPast || isCurrentSlotTaken) {
      const candidate = TIME_SLOTS_30M.find((slot) => {
        const fitDur =
          slot.startMin + durationHours * 60 <= 22 * 60 ? durationHours : 0.5;
        const slotEnd = slot.startMin + fitDur * 60;
        if (bookingDate === todayUtc && slot.startMin <= currentMinutes) {
          return false;
        }
        const facConflict = otherFacilityAvailability.some(
          (s) => s.startMinutes < slotEnd && s.endMinutes > slot.startMin
        );
        const usrConflict = ownerOtherBookingsSameDate.some(
          (b) => b.startMinutes < slotEnd && b.endMinutes > slot.startMin
        );
        return !facConflict && !usrConflict;
      });
      if (candidate) {
        setStartTime(candidate.label);
        if (candidate.startMin + durationHours * 60 > 22 * 60) {
          setDurationHours(0.5);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingDate, otherFacilityAvailability, ownerOtherBookingsSameDate]);

  if (!isOpen || !booking) return null;

  const populatedFacility =
    typeof booking.facility === "object" ? booking.facility : null;
  const selectedFacility =
    facilities.find((f) => f._id === facilityId) || populatedFacility;

  const todayUtc = getTodayUtcString();
  const bookingCode = formatBookingCode(booking._id);
  const now = new Date();
  const currentLocalMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = (startTime || "00:00").split(":").map(Number);
  const proposedStart = sh * 60 + sm;
  const proposedEnd = proposedStart + durationHours * 60;

  const isPastDate = bookingDate < todayUtc;
  const isPastTimeToday =
    bookingDate === todayUtc && proposedStart <= currentLocalMinutes;
  const exceedsOperatingDay = proposedStart < 360 || proposedEnd > 1320;

  const conflictingSlot = otherFacilityAvailability.find(
    (slot) =>
      slot.startMinutes < proposedEnd && slot.endMinutes > proposedStart
  );

  const memberConflictSlot = ownerOtherBookingsSameDate.find(
    (b) => b.startMinutes < proposedEnd && b.endMinutes > proposedStart
  );

  const hasInvalidSelection =
    isPastDate ||
    isPastTimeToday ||
    exceedsOperatingDay ||
    Boolean(conflictingSlot) ||
    Boolean(memberConflictSlot);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPastDate) {
      setError(
        t(
          "วันที่จองต้องเป็นวันนี้หรือวันล่วงหน้าเท่านั้น",
          "Booking date cannot be in the past"
        )
      );
      return;
    }

    if (isPastTimeToday) {
      setError(
        t(
          "ไม่สามารถเลือกเวลาที่ผ่านไปแล้วของวันนี้ได้ กรุณาเลือกเวลาถัดไป",
          "Cannot select a time slot that has already passed today"
        )
      );
      return;
    }

    if (durationHours < 0.5 || durationHours > 2) {
      setError(
        t(
          "จองได้ตั้งแต่ 0.5 ถึง 2 ชั่วโมงต่อรายการ",
          "Booking duration must be between 0.5 and 2 hours"
        )
      );
      return;
    }

    if (exceedsOperatingDay) {
      setError(
        t(
          "เวลาจองต้องอยู่ภายในเวลาเปิดทำการ (06:00 - 22:00 น.)",
          "Booking must be within operating hours (06:00 - 22:00)"
        )
      );
      return;
    }

    if (conflictingSlot || memberConflictSlot) {
      setError(
        t(
          "ช่วงเวลาที่เลือกไม่ว่าง กรุณาเลือกช่วงเวลาสีขาวที่ยังว่างอยู่",
          "Selected time slot is unavailable. Please choose an open slot."
        )
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSave(booking._id, {
        bookingDate,
        startTime,
        durationHours,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถบันทึกการแก้ไขได้", "Failed to update booking")
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
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t("ยกเลิก", "Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={hasInvalidSelection}
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

        {/* Locked Court / Sport Type Display (Read-Only) */}
        <div className="p-3.5 rounded-card bg-[#F6F5F0] border border-[#E2DFD7] flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedFacility && (
                <SportBadge sportType={selectedFacility.sportType} />
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#767B76]">
                <Lock className="w-3 h-3" />
                <span>
                  {t(
                    "ไม่สามารถเปลี่ยนสนามหรือประเภทกีฬาได้",
                    "Court & sport type are locked"
                  )}
                </span>
              </span>
            </div>
            <div className="text-sm font-semibold text-[#181A18] truncate">
              {selectedFacility?.name || t("สนามกีฬา", "Sports Court")}
            </div>
            {selectedFacility?.location && (
              <div className="text-xs text-[#767B76] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{selectedFacility.location}</span>
              </div>
            )}
          </div>
          {selectedFacility && (
            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-[#143628] tabular-price">
                ฿{selectedFacility.hourlyRate.toLocaleString()}
              </span>
              <span className="text-xs text-[#767B76] block">
                / {t("ชม.", "hr")}
              </span>
            </div>
          )}
        </div>

        {/* Date Picker */}
        <DatePicker
          label={t("1. เลือกวันที่เข้าใช้สนาม", "1. Select Date")}
          min={todayUtc}
          required
          value={bookingDate}
          onChange={(e) => {
            setError(null);
            setBookingDate(e.target.value);
          }}
        />

        {/* Interactive Available TimeSlotGrid */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[#181A18]">
              {t(
                "2. เลือกช่วงเวลาที่ว่าง (0.5 - 2 ชั่วโมง)",
                "2. Select Available Time Slot (0.5 - 2 hours)"
              )}
            </span>
            <span className="text-xs text-[#767B76]">
              {formatReadableDate(bookingDate, lang)}
            </span>
          </div>

          <TimeSlotGrid
            bookingDate={bookingDate}
            startTime={startTime}
            durationHours={durationHours}
            onSelectRange={(newStart, newDur) => {
              setError(null);
              setStartTime(newStart);
              setDurationHours(newDur);
            }}
            availability={otherFacilityAvailability}
            myBookingsSameDate={ownerOtherBookingsSameDate}
            currentUserId={bookingOwnerId}
          />
        </div>

        {/* Status Banner */}
        {conflictingSlot ? (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#946B22] mt-0.5" />
            <span>
              {t(
                `ช่วงเวลา ${startTime} - ${formatMinutesToTime(
                  proposedEnd
                )} น. มีผู้จองแล้ว (${conflictingSlot.startTime} - ${formatMinutesToTime(
                  conflictingSlot.endMinutes
                )} น.) กรุณาเลือกช่องเวลาสีขาวที่ว่างอยู่`,
                `Time ${startTime} - ${formatMinutesToTime(
                  proposedEnd
                )} overlaps with an existing booking (${conflictingSlot.startTime} - ${formatMinutesToTime(
                  conflictingSlot.endMinutes
                )}). Please select an open slot.`
              )}
            </span>
          </div>
        ) : memberConflictSlot ? (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#946B22] mt-0.5" />
            <span>
              {t(
                "คุณมีรายการจองสนามอื่นในช่วงเวลานี้อยู่แล้ว กรุณาเลือกเวลาอื่น",
                "You already have another booking during this time slot."
              )}
            </span>
          </div>
        ) : isPastTimeToday ? (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#946B22] mt-0.5" />
            <span>
              {t(
                "ช่วงเวลาที่เลือกผ่านไปแล้วในวันนี้ กรุณาเลือกช่วงเวลาว่างถัดไปหรือเปลี่ยนวัน",
                "Selected time has already passed today. Please pick a later slot or another date."
              )}
            </span>
          </div>
        ) : exceedsOperatingDay ? (
          <div className="p-3.5 rounded-lg bg-[#FBF6EC] border border-[#E8D7B4] text-[#7C5819] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#946B22] mt-0.5" />
            <span>
              {t(
                "เวลาสิ้นสุดต้องไม่เกินเวลาปิดสนาม 22:00 น.",
                "Booking must end by 22:00 closing time."
              )}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-[#EBF2EE] border border-[#C5D9CE] text-[#143628] text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#143628] shrink-0" />
              <span>
                {t("เวลาใหม่ที่เลือก:", "New Slot:")}{" "}
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
