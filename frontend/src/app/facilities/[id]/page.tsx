"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AvailabilitySlot,
  Booking,
  Facility,
  FacilityInput,
} from "@/types";
import { api, formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import FacilityModal from "@/components/FacilityModal";
import BookingPassModal from "@/components/BookingPassModal";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Edit3,
  Trash2,
  Sparkles,
  LogIn,
  Calculator,
} from "lucide-react";

const TIME_SLOTS_30M = Array.from({ length: 32 }, (_, i) => {
  const startMin = 6 * 60 + i * 30; // 06:00 to 21:30
  return {
    startMin,
    endMin: startMin + 30,
    label: formatMinutesToTime(startMin),
  };
});

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.id as string;

  const { user } = useAuth();
  const { t } = useLanguage();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const todayUtc = getTodayUtcString();
  const [bookingDate, setBookingDate] = useState<string>(todayUtc);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [allowRawBackendTest, setAllowRawBackendTest] = useState(false);

  // Admin Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadFacilityAndSlots = useCallback(async () => {
    if (!facilityId) return;
    try {
      setLoading(true);
      const [facRes, availRes] = await Promise.all([
        api.getFacility(facilityId),
        api.getFacilityAvailability(facilityId, bookingDate),
      ]);
      setFacility(facRes.data);
      setAvailability(availRes.data || []);

      if (user) {
        const myRes = await api.getBookings();
        setMyBookings(myRes.data || []);
      } else {
        setMyBookings([]);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load facility details"
      );
    } finally {
      setLoading(false);
    }
  }, [facilityId, bookingDate, user]);

  useEffect(() => {
    loadFacilityAndSlots();
  }, [loadFacilityAndSlots]);

  if (loading && !facility) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse p-8" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          {error || t("ไม่พบข้อมูลสนามกีฬา", "Facility Not Found")}
        </h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("กลับหน้าหลัก", "Back to Facilities")}
        </Link>
      </div>
    );
  }

  // Parse selected time range
  const [sh, sm] = (startTime || "00:00").split(":").map(Number);
  const selectedStartMin = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const selectedEndMin = selectedStartMin + Number(durationHours) * 60;
  const totalPrice = facility.hourlyRate * Number(durationHours);

  // My bookings on the same date (across ANY facility) to detect member self-overlap
  const myBookingsSameDate = myBookings.filter(
    (b) => b.bookingDate.slice(0, 10) === bookingDate
  );

  // Check slot status for the 30-min visual grid
  const getSlotStatus = (slotStart: number, slotEnd: number) => {
    const currentUserId = user?._id || user?.id;

    // 1. Is booked on THIS facility?
    const facilityBooking = availability.find(
      (b) => b.startMinutes < slotEnd && b.endMinutes > slotStart
    );
    if (facilityBooking) {
      if (currentUserId && facilityBooking.user === currentUserId) {
        return "MY_BOOKING_HERE";
      }
      return "BOOKED_BY_OTHER";
    }

    // 2. Does current member have a booking on ANOTHER facility at this time?
    const otherFacilityConflict = myBookingsSameDate.find(
      (b) => b.startMinutes < slotEnd && b.endMinutes > slotStart
    );
    if (otherFacilityConflict) {
      return "MY_CONFLICT_OTHER_FACILITY";
    }

    // 3. Is currently selected in the form?
    if (selectedStartMin < slotEnd && selectedEndMin > slotStart) {
      return "SELECTED";
    }

    return "AVAILABLE";
  };

  // Check if current selection has any conflict
  const hasFacilityOverlap = availability.some(
    (b) => b.startMinutes < selectedEndMin && b.endMinutes > selectedStartMin
  );
  const hasMemberSelfOverlap = myBookingsSameDate.some(
    (b) => b.startMinutes < selectedEndMin && b.endMinutes > selectedStartMin
  );

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!allowRawBackendTest) {
      if (bookingDate < todayUtc) {
        setBookingError(
          t(
            "เงื่อนไขที่ 1: วันที่จองต้องไม่เป็นวันก่อนหน้าวันปัจจุบัน",
            "Condition 1: Booking date cannot be in the past"
          )
        );
        return;
      }
      if (durationHours <= 0 || durationHours > 2) {
        setBookingError(
          t(
            "เงื่อนไขที่ 2: จองได้สูงสุดไม่เกิน 2 ชั่วโมงต่อ 1 การจอง (0.5 - 2 ชม.)",
            "Condition 2: Booking duration must be between 0.5 and 2 hours"
          )
        );
        return;
      }
      if (selectedEndMin > 1440) {
        setBookingError(
          t(
            "การจองต้องสิ้นสุดภายในวันเดียวกัน (ไม่เกิน 24:00 น.)",
            "Booking must end on the same day"
          )
        );
        return;
      }
      if (hasMemberSelfOverlap) {
        setBookingError(
          t(
            "เงื่อนไขที่ 3: คุณมีการจองในช่วงเวลานี้อยู่แล้ว ไม่สามารถจองเวลาซ้อนกันได้",
            "Condition 3: You already have a booking during this time slot"
          )
        );
        return;
      }
      if (hasFacilityOverlap) {
        setBookingError(
          t(
            "เงื่อนไขที่ 4: สนามกีฬานี้ถูกจองในช่วงเวลาที่เลือกแล้ว กรุณาเลือกเวลาอื่น",
            "Condition 4: This facility is already booked during the selected time"
          )
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.createBooking({
        facility: facility._id,
        bookingDate,
        startTime,
        durationHours: Number(durationHours),
      });
      setCreatedBooking(res.data);
      await loadFacilityAndSlots();
    } catch (err: unknown) {
      setBookingError(
        err instanceof Error ? err.message : "Failed to create booking"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFacility = async (input: FacilityInput) => {
    const res = await api.updateFacility(facility._id, input);
    setFacility(res.data);
  };

  const handleDeleteFacility = async () => {
    if (
      !window.confirm(
        t(
          `ยืนยันการลบสนาม "${facility.name}" ใช่หรือไม่?`,
          `Are you sure you want to delete "${facility.name}"?`
        )
      )
    )
      return;
    await api.deleteFacility(facility._id);
    router.push("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("กลับไปหน้ารายการสนามกีฬา", "Back to All Facilities")}
        </Link>

        {user?.role === "admin" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {t("แก้ไขข้อมูลสนาม", "Edit Facility")}
            </button>
            <button
              onClick={handleDeleteFacility}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("ลบสนาม", "Delete Facility")}
            </button>
          </div>
        )}
      </div>

      {/* Facility Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {facility.sportType}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Facility ID: {facility._id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {facility.name}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {facility.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              {t("ความจุสูงสุด:", "Capacity:")}{" "}
              <strong className="text-slate-900">
                {facility.capacity} {t("คน", "persons")}
              </strong>
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-right shrink-0">
          <div className="text-xs font-semibold text-emerald-700">
            {t("อัตราค่าบริการ", "Hourly Rate")}
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            ฿{facility.hourlyRate.toLocaleString()}
            <span className="text-sm font-medium text-emerald-600">
              {" "}
              / {t("ชม.", "hr")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Left = Visual Time-Slot Grid, Right = Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Availability Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                {t(
                  "ตารางตรวจสอบเวลาว่าง (Visual Time-Slot Grid)",
                  "Interactive Time-Slot Availability"
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "คลิกที่ช่องเวลาสีขาวเพื่อเลือกเวลาเริ่มต้นการจองได้ทันที",
                  "Click any available slot below to set your booking start time."
                )}
              </p>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                min={allowRawBackendTest ? undefined : todayUtc}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block" />
              <span className="text-slate-600">{t("ว่าง (Available)", "Available")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
              <span className="text-slate-600">
                {t("เวลาที่คุณกำลังเลือก", "Currently Selected")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-teal-100 border border-teal-400 inline-block" />
              <span className="text-slate-600">
                {t("การจองของคุณในสนามนี้", "Your Booking Here")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 inline-block" />
              <span className="text-slate-600">
                {t("คุณมีคิวจองสนามอื่น", "Your Conflict (Other Facility)")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300 inline-block" />
              <span className="text-slate-600">
                {t("ถูกจองแล้ว (Booked)", "Booked by Others")}
              </span>
            </div>
          </div>

          {/* 30-Min Time Blocks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TIME_SLOTS_30M.map((slot) => {
              const status = getSlotStatus(slot.startMin, slot.endMin);
              const isBooked =
                status === "BOOKED_BY_OTHER" ||
                status === "MY_BOOKING_HERE" ||
                status === "MY_CONFLICT_OTHER_FACILITY";

              let btnStyle =
                "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-400";
              let badgeText = t("ว่าง", "Open");

              if (status === "SELECTED") {
                btnStyle =
                  "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200";
                badgeText = t("เลือกอยู่", "Selected");
              } else if (status === "MY_BOOKING_HERE") {
                btnStyle = "bg-teal-50 text-teal-900 border-teal-300";
                badgeText = t("ของคุณ", "Yours");
              } else if (status === "MY_CONFLICT_OTHER_FACILITY") {
                btnStyle = "bg-amber-50 text-amber-900 border-amber-300";
                badgeText = t("ชนคิวคุณ", "Busy");
              } else if (status === "BOOKED_BY_OTHER") {
                btnStyle =
                  "bg-rose-50 text-rose-800 border-rose-200 opacity-80";
                badgeText = t("ไม่ว่าง", "Booked");
              }

              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => setStartTime(slot.label)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${btnStyle}`}
                >
                  <div>
                    <div className="text-xs font-bold">{slot.label}</div>
                    <div className="text-[10px] opacity-75">
                      - {formatMinutesToTime(slot.endMin)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      status === "SELECTED"
                        ? "bg-emerald-700 text-white"
                        : isBooked
                        ? "bg-black/5"
                        : "text-emerald-600 bg-emerald-50"
                    }`}
                  >
                    {badgeText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Existing Bookings List on Selected Date */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t(
                `รายการที่ถูกจองแล้วในวันที่ ${bookingDate} (${availability.length} รายการ)`,
                `Booked Slots on ${bookingDate} (${availability.length})`
              )}
            </h3>
            {availability.length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 font-medium">
                {t(
                  "ยังไม่มีผู้จองสนามนี้ในวันที่เลือก สามารถเลือกจองได้ทุกช่วงเวลา!",
                  "No bookings on this date yet — all slots are wide open!"
                )}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availability.map((slot) => {
                  const isMine =
                    user && (user._id === slot.user || user.id === slot.user);
                  return (
                    <div
                      key={slot._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        isMine
                          ? "bg-teal-50 text-teal-800 border-teal-300"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {slot.startTime} - {formatMinutesToTime(slot.endMinutes)} (
                      {slot.durationHours} {t("ชม.", "hrs")})
                      {isMine ? ` • ${t("ของคุณ", "Your Booking")}` : ""}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {t("สร้างรายการจองสนามกีฬา", "Create Facility Booking")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "ระบุวันที่ เวลาเริ่มต้น และระยะเวลาที่ต้องการใช้งาน (สูงสุด 2 ชั่วโมง)",
                  "Specify booking date, start time, and duration (up to 2 hours)."
                )}
              </p>
            </div>

            {!user ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                <ShieldAlert className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    {t(
                      "กรุณาเข้าสู่ระบบก่อนทำการจองสนาม",
                      "Please Log In to Book This Facility"
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t(
                      "ผู้ใช้งานทั่วไปสามารถดูข้อมูลสนามและตารางเวลาว่างได้ แต่ต้องเข้าสู่ระบบด้วยบัญชี Member เพื่อสร้างการจอง",
                      "Guests can view facilities and schedules. Log in with a Member account to create a booking."
                    )}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  {t("ไปหน้าเข้าสู่ระบบ (Login)", "Go to Login Page")}
                </Link>
              </div>
            ) : user.role === "admin" ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-xs text-amber-900">
                <div className="font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  {t(
                    "คุณกำลังเข้าสู่ระบบในฐานะ Admin",
                    "Logged in as Administrator"
                  )}
                </div>
                <p className="leading-relaxed">
                  {t(
                    "ตามข้อกำหนดของระบบ เฉพาะผู้ใช้ระดับ Member เท่านั้นที่สามารถสร้างการจองใหม่ได้ ส่วน Admin สามารถดู แก้ไข และลบการจองของผู้ใช้ทุกคนได้ในหน้าจัดการการจอง",
                    "Per system requirements, only Members can create new bookings. Admins can view, edit, and delete any user's booking."
                  )}
                </p>
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/bookings"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
                  >
                    {t("ไปหน้าจัดการการจองทั้งหมด", "Manage All Bookings")}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                {bookingError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Facility ID Reference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t("รหัสสนามกีฬา (Facility ID)", "Facility ID")}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={facility._id}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600"
                  />
                </div>

                {/* Booking Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("วันที่ใช้งาน (Booking Date) *", "Booking Date *")}
                  </label>
                  <input
                    type="date"
                    min={allowRawBackendTest ? undefined : todayUtc}
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t(
                      "เวลาเริ่มต้น (Start Time - รูปแบบ 24 ชั่วโมง) *",
                      "Start Time (HH:mm 24-hour) *"
                    )}
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Duration Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(
                      "ระยะเวลาใช้งาน (สูงสุดไม่เกิน 2 ชั่วโมงต่อการจอง) *",
                      "Duration (Max 2 hours per booking) *"
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0.5, 1, 1.5, 2].map((hr) => (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => setDurationHours(hr)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          Number(durationHours) === hr
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {hr} {t("ชม.", "hr")}
                      </button>
                    ))}
                  </div>
                  {allowRawBackendTest && (
                    <div className="mt-2">
                      <label className="block text-[11px] text-amber-700 font-medium mb-1">
                        {t(
                          "ทดสอบกรอกจำนวนชั่วโมงเอง (เช่น 3 ชม. เพื่อดู Error 400 จาก Backend):",
                          "Custom duration hours (e.g. 3 to test Backend 400 error):"
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={durationHours}
                        onChange={(e) =>
                          setDurationHours(Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/40 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Real-Time Price & Time Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    {t(
                      "สรุปรายละเอียดและคำนวณค่าบริการอัตโนมัติ",
                      "Booking Summary & Price Calculator"
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{t("ช่วงเวลาที่ใช้สนาม:", "Selected Time Slot:")}</span>
                    <span className="font-bold text-slate-900">
                      {startTime} - {formatMinutesToTime(selectedEndMin)} น.
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{t("การคำนวณ:", "Calculation:")}</span>
                    <span>
                      ฿{facility.hourlyRate.toLocaleString()} × {durationHours}{" "}
                      {t("ชม.", "hrs")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      {t("ค่าบริการรวมทั้งสิ้น:", "Estimated Total:")}
                    </span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      ฿{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Live Validation Status Indicator */}
                {(hasFacilityOverlap || hasMemberSelfOverlap) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {hasFacilityOverlap
                        ? t(
                            "ช่วงเวลาที่เลือกทับซ้อนกับการจองที่มีอยู่แล้วในสนามนี้",
                            "Selected time overlaps with an existing booking on this facility."
                          )
                        : t(
                            "คุณมีการจองสนามอื่นในช่วงเวลานี้อยู่แล้ว (ห้าม Member จองเวลาซ้อนกัน)",
                            "You already have another booking during this time slot."
                          )}
                    </span>
                  </div>
                )}

                {/* Toggle for Presentation Demo of Backend API Validation */}
                <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowRawBackendTest}
                    onChange={(e) => setAllowRawBackendTest(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>
                    {t(
                      "โหมดสาธิตส่งข้อมูลข้าม Frontend Validation ไปทดสอบ Backend API โดยตรง",
                      "Demo Mode: Bypass client checks to demonstrate Backend API validation directly"
                    )}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {submitting
                    ? t("กำลังดำเนินการจอง...", "Creating Booking...")
                    : t("ยืนยันการจองสนามกีฬา", "Confirm Facility Booking")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Admin Edit Facility Modal */}
      <FacilityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateFacility}
        initialData={facility}
      />

      {/* Digital QR Booking Pass Modal upon successful creation */}
      <BookingPassModal
        booking={createdBooking}
        onClose={() => setCreatedBooking(null)}
      />
    </div>
  );
}
