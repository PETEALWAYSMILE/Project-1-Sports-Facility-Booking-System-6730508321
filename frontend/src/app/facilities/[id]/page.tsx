"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
import {
  consumeBookingDraft,
  formatBookingCode,
  formatReadableDate,
  getFacilityGallery,
  getNext14Days,
  getSportMeta,
  getSportName,
  resolveSportKey,
  saveBookingDraft,
  setCustomFacilityImage,
  useFavorites,
} from "@/lib/ui-helpers";
import TimeSlotGrid from "@/components/TimeSlotGrid";
import CourtCard from "@/components/CourtCard";
import FacilityModal from "@/components/FacilityModal";
import {
  Breadcrumb,
  Button,
  ErrorState,
  Skeleton,
  SportBadge,
  SportIcon,
} from "@/components/ui/Primitives";
import { ConfirmDialog, Modal, Toast } from "@/components/ui/Overlays";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  Edit3,
  Trash2,
  Heart,
  ShieldCheck,
  QrCode,
  Building2,
  CalendarPlus,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

type CheckoutStep = 1 | 2 | 3;

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.id as string;

  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const userId = user?._id || user?.id;
  const { toggleFavorite, isFavorite } = useFavorites(userId);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Selected Photo in Gallery
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Booking Selection State
  const todayUtc = getTodayUtcString();
  const [bookingDate, setBookingDate] = useState<string>(todayUtc);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // 3-Step Booking Checkout Flow State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1);
  const [bookingNote, setBookingNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "venue">(
    "promptpay"
  );
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Admin Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bookingBoxRef = useRef<HTMLDivElement>(null);

  // Restore date query param or saved draft after login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const qDate = searchParams.get("date");
      if (qDate && qDate >= todayUtc) {
        setBookingDate(qDate);
      }
    }
    if (facilityId) {
      const draft = consumeBookingDraft(facilityId);
      if (draft) {
        if (draft.bookingDate >= todayUtc) setBookingDate(draft.bookingDate);
        if (draft.startTime) setStartTime(draft.startTime);
        if (draft.durationHours) setDurationHours(draft.durationHours);
      }
    }
  }, [facilityId, todayUtc]);

  const loadFacilityAndSlots = useCallback(async () => {
    if (!facilityId) return;
    try {
      setLoading(true);
      setError(null);
      const [facRes, availRes, allFacRes] = await Promise.all([
        api.getFacility(facilityId),
        api.getFacilityAvailability(facilityId, bookingDate),
        api.getFacilities().catch(() => ({ data: [] as Facility[] })),
      ]);
      setFacility(facRes.data);
      setAvailability(availRes.data || []);
      setAllFacilities(allFacRes.data || []);

      if (user) {
        const myRes = await api.getBookings().catch(() => ({ data: [] as Booking[] }));
        setMyBookings(myRes.data || []);
      } else {
        setMyBookings([]);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("ไม่พบข้อมูลสนามกีฬาที่ต้องการ", "Unable to load court details")
      );
    } finally {
      setLoading(false);
    }
  }, [facilityId, bookingDate, user, t]);

  useEffect(() => {
    loadFacilityAndSlots();
  }, [loadFacilityAndSlots]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  if (loading && !facility) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <Skeleton className="lg:col-span-2 aspect-[16/10] w-full rounded-card" />
          <div className="hidden lg:grid lg:col-span-2 grid-cols-2 gap-3">
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
            <Skeleton className="aspect-[16/10] w-full rounded-card" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="h-40 w-full rounded-card" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-96 w-full rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12">
        <ErrorState
          title={t("ไม่พบข้อมูลสนามกีฬา", "Court Not Found")}
          message={
            error ||
            t(
              "สนามกีฬานี้อาจถูกปิดให้บริการชั่วคราวหรือย้ายที่ตั้ง",
              "This sports facility is currently unavailable."
            )
          }
          onRetry={loadFacilityAndSlots}
        />
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t("กลับไปหน้าสนามทั้งหมด", "Back to All Courts")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const sportMeta = getSportMeta(facility.sportType);
  const galleryImages = getFacilityGallery(facility);
  const next14Days = getNext14Days();

  // Time & Price Calculation
  const [sh, sm] = (startTime || "10:00").split(":").map(Number);
  const selectedStartMin =
    (Number.isFinite(sh) ? sh : 10) * 60 + (Number.isFinite(sm) ? sm : 0);
  const selectedEndMin = selectedStartMin + Number(durationHours) * 60;
  const endTimeFormatted = formatMinutesToTime(selectedEndMin);
  const totalPrice = facility.hourlyRate * Number(durationHours);

  // Member bookings on the same date across any facility
  const myBookingsSameDate = myBookings.filter(
    (b) => b.bookingDate.slice(0, 10) === bookingDate
  );

  // Overlap checks
  const hasFacilityOverlap = availability.some(
    (b) => b.startMinutes < selectedEndMin && b.endMinutes > selectedStartMin
  );
  const hasMemberSelfOverlap = myBookingsSameDate.some(
    (b) => b.startMinutes < selectedEndMin && b.endMinutes > selectedStartMin
  );
  const isInvalidDuration = durationHours < 0.5 || durationHours > 2;
  const isPastDate = bookingDate < todayUtc;
  const exceedsOperatingDay = selectedEndMin > 22 * 60;

  const validateSelection = (): string | null => {
    if (isPastDate) {
      return t(
        "ไม่สามารถจองวันที่ผ่านมาแล้วได้ กรุณาเลือกตั้งแต่วันนี้เป็นต้นไป",
        "Cannot book past dates. Please select today or a future date."
      );
    }
    if (isInvalidDuration) {
      return t(
        "จองได้ตั้งแต่ 0.5 ถึง 2 ชั่วโมงต่อรายการเท่านั้น",
        "Booking duration must be between 0.5 and 2 hours."
      );
    }
    if (exceedsOperatingDay) {
      return t(
        "เวลาที่เลือกเกินเวลาปิดสนาม (22:00 น.) กรุณาปรับเวลาเริ่มหรือระยะเวลา",
        "Selected slot exceeds closing time (22:00). Please adjust your time."
      );
    }
    if (hasFacilityOverlap) {
      return t(
        "ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกช่วงเวลาว่างอื่น",
        "Selected time overlaps with an existing booking on this court."
      );
    }
    if (hasMemberSelfOverlap) {
      return t(
        "คุณมีรายการจองสนามในช่วงเวลานี้อยู่แล้ว ไม่สามารถจองเวลาซ้อนทับกันได้",
        "You already have another booking during this time slot."
      );
    }
    return null;
  };

  const handleStartBookingFlow = () => {
    setSelectionError(null);
    const validationMsg = validateSelection();
    if (validationMsg) {
      setSelectionError(validationMsg);
      return;
    }

    // If not logged in -> save draft and redirect to login
    if (!user) {
      saveBookingDraft({
        facilityId: facility._id,
        bookingDate,
        startTime,
        durationHours,
      });
      router.push(
        `/login?redirect=${encodeURIComponent(`/facilities/${facility._id}`)}`
      );
      return;
    }

    if (user.role === "admin") {
      setSelectionError(
        t(
          "บัญชีผู้ดูแลระบบใช้สำหรับจัดการตารางสนาม กรุณาเข้าสู่ระบบด้วยบัญชีสมาชิกเพื่อสร้างการจอง",
          "Administrator accounts manage schedules. Please sign in as a Member to book a court."
        )
      );
      return;
    }

    setCheckoutError(null);
    setCreatedBooking(null);
    setCheckoutStep(1);
    setIsCheckoutOpen(true);
  };

  const handleConfirmBookingSubmit = async () => {
    setCheckoutError(null);
    try {
      setSubmitting(true);
      const res = await api.createBooking({
        facility: facility._id,
        bookingDate,
        startTime,
        durationHours: Number(durationHours),
      });
      setCreatedBooking(res.data);
      setCheckoutStep(3);
      await loadFacilityAndSlots();
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error ? err.message : "Failed to create booking";
      const isConflict =
        rawMsg.toLowerCase().includes("overlap") ||
        rawMsg.toLowerCase().includes("409");
      setCheckoutError(
        isConflict
          ? t(
              "ขออภัย ช่วงเวลานี้เพิ่งถูกจองไปเมื่อสักครู่ กรุณากลับไปเลือกช่วงเวลาใหม่",
              "This time slot was just taken. Please pick another available time."
            )
          : rawMsg
      );
      await loadFacilityAndSlots();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCalendar = (booking: Booking) => {
    const code = formatBookingCode(booking._id);
    const dateClean = booking.bookingDate.slice(0, 10).replace(/-/g, "");
    const startClean = booking.startTime.replace(":", "") + "00";
    const endClean = formatMinutesToTime(booking.endMinutes).replace(":", "") + "00";
    const title = encodeURIComponent(`${facility.name} (${code})`);
    const details = encodeURIComponent(
      `${t("หมายเลขการจอง", "Booking Ref")}: ${code}${
        bookingNote ? `\n${t("หมายเหตุ", "Note")}: ${bookingNote}` : ""
      }`
    );
    const location = encodeURIComponent(facility.location);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateClean}T${startClean}/${dateClean}T${endClean}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateFacility = async (
    input: FacilityInput,
    customImageUrl?: string
  ) => {
    const res = await api.updateFacility(facility._id, input);
    if (customImageUrl !== undefined) {
      setCustomFacilityImage(facility._id, customImageUrl);
    }
    setFacility(res.data);
    showToast(
      t("อัปเดตข้อมูลสนามเรียบร้อยแล้ว", "Court details updated successfully")
    );
  };

  const handleDeleteFacility = async () => {
    try {
      setDeleting(true);
      await api.deleteFacility(facility._id);
      router.push("/");
    } catch (err: unknown) {
      setDeleting(false);
      setIsDeleteConfirmOpen(false);
      showToast(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถลบสนามได้", "Failed to delete court")
      );
    }
  };

  // Similar Facilities (same sport first, then others)
  const similarFacilities = allFacilities
    .filter((f) => f._id !== facility._id)
    .sort((a, b) => {
      const aSame =
        resolveSportKey(a.sportType) === resolveSportKey(facility.sportType)
          ? 0
          : 1;
      const bSame =
        resolveSportKey(b.sportType) === resolveSportKey(facility.sportType)
          ? 0
          : 1;
      return aSame - bSame;
    })
    .slice(0, 3);

  const fav = isFavorite(facility._id);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-28 lg:pb-12">
      {/* Top Row: Breadcrumb & Admin/Favorite Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: t("หน้าแรก", "Home"), href: "/" },
            {
              label: getSportName(facility.sportType, lang),
              href: `/?sport=${resolveSportKey(facility.sportType)}`,
            },
            { label: facility.name },
          ]}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(facility._id)}
            aria-pressed={fav}
            className={`inline-flex items-center gap-2 min-h-[42px] px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
              fav
                ? "bg-[#FAF0EE] border-[#E8C8C3] text-[#992B1E]"
                : "bg-white border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#F6F5F0]"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${fav ? "fill-[#992B1E] text-[#992B1E]" : ""}`}
            />
            <span>{fav ? t("บันทึกแล้ว", "Saved") : t("บันทึก", "Save")}</span>
          </button>

          {user?.role === "admin" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit3 className="w-4 h-4" />
                <span>{t("แก้ไขสนาม", "Edit")}</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                <span>{t("ลบสนาม", "Delete")}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Photo Gallery: 1 Large + 4 Small on Desktop / Horizontal Swipe Slider on Mobile */}
      <section aria-label={t("รูปภาพสนามกีฬา", "Court photo gallery")}>
        {/* Desktop 5-Photo Grid */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[380px] rounded-card overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveImageIdx(0)}
            className="col-span-2 row-span-2 relative group overflow-hidden bg-slate-100 focus:outline-none"
          >
            <img
              src={galleryImages[activeImageIdx] || galleryImages[0]}
              alt={facility.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/95 text-slate-800 text-xs font-medium shadow-soft">
              {t("ภาพสนามจริง", "Verified Arena")}
            </div>
          </button>

          {galleryImages.slice(1, 5).map((imgUrl, idx) => {
            const actualIdx = idx + 1;
            const isSelected = activeImageIdx === actualIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIdx(actualIdx)}
                className={`relative group overflow-hidden bg-slate-100 focus:outline-none ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${facility.name} ${actualIdx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </button>
            );
          })}
        </div>

        {/* Mobile Swipeable Carousel */}
        <div className="md:hidden space-y-2">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar rounded-card">
            {galleryImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="snap-center shrink-0 w-[88%] first:w-full aspect-[16/10] rounded-card overflow-hidden bg-slate-100 border border-slate-200 relative"
              >
                <img
                  src={imgUrl}
                  alt={`${facility.name} ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/70 text-white text-[11px] tabular-price">
                  {idx + 1} / {galleryImages.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Column Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Court Details, Amenities, Operating Hours, Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info Card */}
          <div className="bg-white rounded-card border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SportBadge sportType={facility.sportType} size="md" showIcon />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EBF2EE] text-[#143628] border border-[#C5D9CE]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#143628]" />
                  <span>{t("พร้อมให้บริการ", "Open for Booking")}</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-2xl font-semibold text-primary tabular-price">
                  ฿{facility.hourlyRate.toLocaleString()}
                </span>
                <span className="text-xs text-[#767B76]">
                  {" "}
                  / {t("ชั่วโมง", "hour")}
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {facility.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600 pt-1">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{facility.location}</span>
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {t("ความจุผู้เล่นสูงสุด", "Max Capacity")}:{" "}
                  <strong className="font-semibold text-slate-900 tabular-price">
                    {facility.capacity} {t("คน", "players")}
                  </strong>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="tabular-price">
                  {t("เปิดบริการ 06:00 - 22:00 น.", "Open 06:00 – 22:00")}
                </span>
              </span>
            </div>
          </div>

          {/* Description & Overview */}
          <div className="bg-white rounded-card border border-slate-200 p-5 sm:p-6 shadow-soft space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {t("รายละเอียดสนาม", "About This Court")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === "TH"
                ? sportMeta.descriptionTH
                : sportMeta.descriptionEN}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white rounded-card border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {t("สิ่งอำนวยความสะดวก", "Court Amenities & Features")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sportMeta.amenities.map((am) => (
                <div
                  key={am.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F6F5F0] border border-[#E2DFD7] text-sm text-[#181A18]"
                >
                  <div className="w-7 h-7 rounded-md bg-[#EBF2EE] text-[#143628] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-medium">
                    {lang === "TH" ? am.labelTH : am.labelEN}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Operating Schedule + Booking Rules */}
          <div className="bg-white rounded-card border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {t(
                "อัตราค่าบริการและข้อกำหนดการจอง",
                "Rates & Reservation Policy"
              )}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-control bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 block">
                  {t("วันจันทร์ - วันอาทิตย์ (ทุกช่วงเวลา)", "All Days (06:00 – 22:00)")}
                </span>
                <span className="text-lg font-semibold text-primary tabular-price">
                  ฿{facility.hourlyRate.toLocaleString()} / {t("ชั่วโมง", "hr")}
                </span>
                <span className="text-xs text-slate-500 block tabular-price">
                  (฿{(facility.hourlyRate / 2).toLocaleString()} / 30{" "}
                  {t("นาที", "mins")})
                </span>
              </div>

              <div className="p-4 rounded-control bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs text-slate-500 block">
                  {t("ระยะเวลาการจองต่อรายการ", "Booking Duration Limit")}
                </span>
                <span className="text-lg font-semibold text-slate-900 tabular-price">
                  0.5 – 2.0 {t("ชั่วโมง", "hours")}
                </span>
                <span className="text-xs text-slate-500 block">
                  {t(
                    "เลือกช่วงเวลาต่อเนื่องทีละ 30 นาที",
                    "30-minute continuous increments"
                  )}
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {t(
                    "จองล่วงหน้าได้ตั้งแต่วันนี้เป็นต้นไป ระบบล็อกคิวสนามให้ทันทีเมื่อยืนยันการจอง",
                    "Book from today onwards with instant real-time slot confirmation."
                  )}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {t(
                    "สามารถแก้ไขเวลาหรือยกเลิกการจองล่วงหน้าได้ผ่านเมนู 'การจองของฉัน'",
                    "Modify or cancel your upcoming reservation anytime via My Bookings."
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Sticky Booking Box (5 cols) */}
        <div ref={bookingBoxRef} className="lg:col-span-5 lg:sticky lg:top-20">
          <div className="bg-white rounded-card border border-slate-200 shadow-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  {t("เลือกวันและเวลาจองสนาม", "Select Date & Time Slot")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(
                    "ตารางเวลาอัปเดตแบบเรียลไทม์",
                    "Real-time availability schedule"
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-primary tabular-price">
                  ฿{facility.hourlyRate.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 block">
                  / {t("ชม.", "hr")}
                </span>
              </div>
            </div>

            {/* 1. 14-Day Horizontal Date Strip + Native Date Picker */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  {t("1. เลือกวันที่เข้าใช้สนาม", "1. Choose Date")}
                </label>
                <div className="relative flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <input
                    type="date"
                    min={todayUtc}
                    value={bookingDate}
                    onChange={(e) => {
                      setSelectionError(null);
                      setBookingDate(e.target.value);
                    }}
                    aria-label={t("เลือกวันที่จากปฏิทิน", "Pick date from calendar")}
                    className="text-xs font-medium text-primary bg-transparent border-0 p-0 focus:outline-none cursor-pointer tabular-price"
                  />
                </div>
              </div>

              <div
                role="listbox"
                aria-label={t("เลือกวันล่วงหน้า 14 วัน", "14-day date selector")}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
              >
                {next14Days.map((day) => {
                  const selected = bookingDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectionError(null);
                        setBookingDate(day.dateStr);
                      }}
                      className={`min-w-[62px] min-h-[64px] px-2.5 py-2 rounded-lg border text-center transition-colors shrink-0 flex flex-col items-center justify-center ${
                        selected
                          ? "bg-[#143628] text-white border-[#143628] shadow-soft"
                          : "bg-[#F6F5F0] hover:bg-white text-[#4A4F4B] border-[#D2CEC3]"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          selected ? "text-[#C5D9CE]" : "text-[#767B76]"
                        }`}
                      >
                        {lang === "TH" ? day.dayNameTH : day.dayNameEN}
                      </span>
                      <span className="text-base font-semibold tabular-price leading-tight my-0.5">
                        {day.dayNum}
                      </span>
                      <span
                        className={`text-[10px] ${
                          selected ? "text-[#C5D9CE]" : "text-[#767B76]"
                        }`}
                      >
                        {lang === "TH" ? day.monthTH : day.monthEN}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive 30-Min TimeSlotGrid */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {t(
                    "2. เลือกช่วงเวลา (0.5 - 2 ชม.)",
                    "2. Select Time Slot (0.5 - 2 hrs)"
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  {formatReadableDate(bookingDate, lang)}
                </span>
              </div>

              <TimeSlotGrid
                bookingDate={bookingDate}
                startTime={startTime}
                durationHours={durationHours}
                onSelectRange={(newStart, newDur) => {
                  setSelectionError(null);
                  setStartTime(newStart);
                  setDurationHours(newDur);
                }}
                availability={availability}
                myBookingsSameDate={myBookingsSameDate}
                currentUserId={userId}
              />
            </div>

            {/* 3. Conflict / Validation Warning */}
            {(selectionError ||
              hasFacilityOverlap ||
              hasMemberSelfOverlap ||
              exceedsOperatingDay) && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  {selectionError ||
                    (hasFacilityOverlap
                      ? t(
                          "ช่วงเวลาที่เลือกทับซ้อนกับคิวที่ถูกจองแล้ว กรุณาเลือกช่องเวลาสีขาวที่ว่างอยู่",
                          "Selected time overlaps with an existing booking. Please choose an open slot."
                        )
                      : hasMemberSelfOverlap
                      ? t(
                          "คุณมีคิวจองสนามอื่นในช่วงเวลานี้อยู่แล้ว ไม่สามารถจองเวลาซ้อนกันได้",
                          "You already have a booking on another court during this time."
                        )
                      : t(
                          "เวลาสิ้นสุดต้องไม่เกินเวลาปิดสนาม 22:00 น.",
                          "Booking must end by 22:00 closing time."
                        ))}
                </span>
              </div>
            )}

            {/* 4. Price Summary Box */}
            <div className="p-4 rounded-control bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("วันที่และเวลา", "Selected Slot")}</span>
                <span className="font-semibold text-slate-900 tabular-price">
                  {startTime} – {endTimeFormatted} {t("น.", "")}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("ระยะเวลาใช้งาน", "Duration")}</span>
                <span className="font-medium text-slate-900 tabular-price">
                  {durationHours} {t("ชั่วโมง", "hours")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                <span className="font-semibold text-slate-900">
                  {t("ราคารวมสุทธิ", "Total Price")}
                </span>
                <span className="text-xl font-semibold text-primary tabular-price">
                  ฿{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 5. Primary CTA Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={
                hasFacilityOverlap ||
                hasMemberSelfOverlap ||
                exceedsOperatingDay
              }
              onClick={handleStartBookingFlow}
            >
              <span>
                {!user
                  ? t("เข้าสู่ระบบเพื่อจองสนามนี้", "Log In to Book This Court")
                  : t("จองสนามนี้", "Book This Court")}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Similar Courts Section */}
      {similarFacilities.length > 0 && (
        <section
          aria-labelledby="similar-courts-heading"
          className="pt-8 border-t border-slate-200 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2
              id="similar-courts-heading"
              className="text-lg sm:text-xl font-semibold text-slate-900"
            >
              {t("สนามอื่นที่คล้ายกัน", "Similar Courts You Might Like")}
            </h2>
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-primary hover:text-primary-hover"
            >
              {t("ดูสนามทั้งหมด", "View all")}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarFacilities.map((sim) => (
              <CourtCard
                key={sim._id}
                facility={sim}
                selectedDate={bookingDate}
                isFavorite={isFavorite(sim._id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-elevated">
        <div>
          <div className="text-xs text-slate-500 tabular-price">
            {startTime} - {endTimeFormatted} ({durationHours} {t("ชม.", "hr")})
          </div>
          <div className="text-lg font-semibold text-primary tabular-price">
            ฿{totalPrice.toLocaleString()}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            const err = validateSelection();
            if (err) {
              bookingBoxRef.current?.scrollIntoView({ behavior: "smooth" });
              setSelectionError(err);
            } else {
              handleStartBookingFlow();
            }
          }}
        >
          {t("จองสนามนี้", "Book Now")}
        </Button>
      </div>

      {/* Section 5: 3-Step Booking Checkout Modal (ตรวจสอบรายการ > ชำระเงิน > ยืนยัน) */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => {
          if (!submitting) setIsCheckoutOpen(false);
        }}
        title={
          checkoutStep === 1
            ? t("ตรวจสอบรายการจอง", "Review Your Booking")
            : checkoutStep === 2
            ? t("เลือกวิธีชำระเงิน", "Payment Method")
            : t("จองสนามกีฬาสำเร็จ", "Booking Confirmed")
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-6">
          {/* 3-Step Stepper Indicator */}
          <ol
            aria-label={t("ขั้นตอนการจอง", "Booking progress")}
            className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-200 text-xs"
          >
            {[
              { step: 1, label: t("1. ตรวจสอบรายการ", "1. Review") },
              { step: 2, label: t("2. ชำระเงิน", "2. Payment") },
              { step: 3, label: t("3. ยืนยัน", "3. Confirmed") },
            ].map((item) => {
              const active = checkoutStep === item.step;
              const done = checkoutStep > item.step;
              return (
                <li
                  key={item.step}
                  className={`flex items-center gap-1.5 font-medium ${
                    active
                      ? "text-primary font-semibold"
                      : done
                      ? "text-[#143628]"
                      : "text-[#767B76]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0 tabular-price ${
                      active || done
                        ? "bg-primary text-white"
                        : "bg-[#EFECE6] text-[#767B76]"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.step}
                  </span>
                  <span className="truncate">{item.label}</span>
                </li>
              );
            })}
          </ol>

          {/* Conflict / Error Alert inside Checkout */}
          {checkoutError && (
            <div
              role="alert"
              className="p-4 rounded-control bg-rose-50 border border-rose-200 text-rose-800 space-y-3"
            >
              <div className="flex items-start gap-2.5 text-xs sm:text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCheckoutOpen(false)}
              >
                {t("กลับไปเลือกเวลาใหม่", "Pick Another Time Slot")}
              </Button>
            </div>
          )}

          {/* STEP 1: Review Details */}
          {checkoutStep === 1 && (
            <div className="space-y-4">
              {/* Court Summary Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-card bg-slate-50 border border-slate-200">
                <img
                  src={galleryImages[0]}
                  alt={facility.name}
                  className="w-20 h-16 rounded-lg object-cover shrink-0 bg-slate-200"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <SportBadge sportType={facility.sportType} />
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {facility.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {facility.location}
                  </p>
                </div>
              </div>

              {/* Date, Time & Price Breakdown Table */}
              <div className="rounded-card border border-slate-200 divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-500">
                    {t("วันที่เข้าใช้สนาม", "Booking Date")}
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatReadableDate(bookingDate, lang)}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-500">
                    {t("ช่วงเวลา", "Time Slot")}
                  </span>
                  <span className="font-medium text-slate-900 tabular-price">
                    {startTime} – {endTimeFormatted} {t("น.", "")} (
                    {durationHours} {t("ชม.", "hrs")})
                  </span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-500">
                    {t("ค่าบริการสนาม", "Court Fee")}
                  </span>
                  <span className="tabular-price text-slate-800">
                    ฿{facility.hourlyRate.toLocaleString()} × {durationHours}{" "}
                    {t("ชม.", "hrs")}
                  </span>
                </div>
                <div className="p-3.5 flex justify-between bg-slate-50/70 font-semibold text-slate-900">
                  <span>{t("ยอดชำระสุทธิ", "Total Amount")}</span>
                  <span className="text-base text-primary tabular-price">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Note Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="booking-note"
                  className="block text-xs font-medium text-slate-700"
                >
                  {t(
                    "หมายเหตุเพิ่มเติมถึงสนาม (ไม่บังคับ)",
                    "Additional Note (Optional)"
                  )}
                </label>
                <textarea
                  id="booking-note"
                  rows={2}
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder={t(
                    "เช่น ต้องการเช่าไม้แบด 2 อัน หรือแจ้งชื่อทีม...",
                    "e.g. Need 2 rental rackets or team name..."
                  )}
                  className="w-full p-3 rounded-control border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Cancellation Policy */}
              <div className="p-3 rounded-control bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  {t("นโยบายการเปลี่ยนแปลงและยกเลิก", "Cancellation Policy")}
                </div>
                <p>
                  {t(
                    "สามารถแก้ไขวัน-เวลา หรือยกเลิกการจองล่วงหน้าได้ฟรีผ่านหน้า 'การจองของฉัน' ก่อนถึงเวลาเข้าใช้สนาม",
                    "Free rescheduling or cancellation before your scheduled slot starts."
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  {t("ย้อนกลับ", "Back")}
                </Button>
                <Button variant="primary" onClick={() => setCheckoutStep(2)}>
                  <span>{t("ดำเนินการต่อ", "Continue to Payment")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Box */}
          {checkoutStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  className={`p-3.5 rounded-control border text-left transition-colors flex items-start gap-3 ${
                    paymentMethod === "promptpay"
                      ? "bg-primary-light border-primary text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold">
                      {t("สแกน QR พร้อมเพย์", "Thai QR PromptPay")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("ยืนยันยอดอัตโนมัติทันที", "Instant confirmation")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("venue")}
                  className={`p-3.5 rounded-control border text-left transition-colors flex items-start gap-3 ${
                    paymentMethod === "venue"
                      ? "bg-primary-light border-primary text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold">
                      {t("ชำระที่หน้าสนาม", "Pay at Venue")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("ชำระก่อนเข้าสนาม 15 นาที", "Pay at reception desk")}
                    </div>
                  </div>
                </button>
              </div>

              <div className="p-5 rounded-card bg-slate-50 border border-slate-200 text-center space-y-3">
                {paymentMethod === "promptpay" ? (
                  <>
                    <div className="w-32 h-32 mx-auto rounded-card bg-white border border-slate-200 flex items-center justify-center p-3 shadow-soft">
                      <QrCode className="w-24 h-24 text-slate-800" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500">
                        {t("ยอดชำระทั้งสิ้น", "Amount Due")}
                      </div>
                      <div className="text-2xl font-semibold text-primary tabular-price">
                        ฿{totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-3 space-y-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {t(
                        "ล็อกคิวสนามทันที และชำระเงินที่เคาน์เตอร์หน้าสนาม",
                        "Lock your court now and pay at the venue counter"
                      )}
                    </div>
                    <div className="text-xl font-semibold text-primary tabular-price">
                      ฿{totalPrice.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setCheckoutStep(1)}
                  disabled={submitting}
                >
                  {t("ย้อนกลับ", "Back")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmBookingSubmit}
                  loading={submitting}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("ยืนยันการจองสนาม", "Confirm Booking")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmed Success */}
          {checkoutStep === 3 && createdBooking && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 rounded-xl bg-[#EBF2EE] text-[#143628] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-slate-900">
                  {t("จองสนามกีฬาสำเร็จ!", "Court Reserved Successfully!")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t("หมายเลขการจองของคุณคือ", "Your booking reference is")}{" "}
                  <strong className="font-semibold text-slate-900 tabular-price">
                    {formatBookingCode(createdBooking._id)}
                  </strong>
                </p>
              </div>

              <div className="p-4 rounded-card bg-slate-50 border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("สนามกีฬา", "Court")}</span>
                  <span className="font-semibold text-slate-900">
                    {facility.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("วันที่", "Date")}</span>
                  <span className="font-medium text-slate-900">
                    {formatReadableDate(createdBooking.bookingDate, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("เวลา", "Time")}</span>
                  <span className="font-medium text-slate-900 tabular-price">
                    {createdBooking.startTime} –{" "}
                    {formatMinutesToTime(createdBooking.endMinutes)}{" "}
                    {t("น.", "")} ({createdBooking.durationHours}{" "}
                    {t("ชม.", "hrs")})
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold">
                  <span className="text-slate-900">
                    {t("ยอดรวมสุทธิ", "Total Paid")}
                  </span>
                  <span className="text-primary tabular-price">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <Button
                  variant="primary"
                  onClick={() => router.push("/bookings")}
                >
                  {t("ดูการจองของฉัน", "My Bookings")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleAddToCalendar(createdBooking)}
                >
                  <CalendarPlus className="w-4 h-4 text-primary" />
                  <span>{t("เพิ่มลงปฏิทิน", "Add Calendar")}</span>
                </Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  {t("จองสนามอื่น", "Browse More")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Admin Edit Modal */}
      <FacilityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateFacility}
        initialData={facility}
      />

      {/* Admin Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteFacility}
        loading={deleting}
        title={t("ยืนยันการลบสนามกีฬา", "Delete Sports Court")}
        description={t(
          `คุณแน่ใจหรือไม่ว่าต้องการลบ "${facility.name}" ออกจากระบบ?`,
          `Are you sure you want to delete "${facility.name}"?`
        )}
        policyNotice={t(
          "การลบสนามจะทำให้สนามนี้ไม่แสดงในหน้าค้นหาสำหรับสมาชิกอีกต่อไป",
          "Deleting this court removes it from public search and future bookings."
        )}
        confirmLabel={t("ยืนยันลบสนาม", "Delete Court")}
      />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
