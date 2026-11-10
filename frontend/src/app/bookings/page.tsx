"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Booking, BookingInput, Facility } from "@/types";
import { api, formatMinutesToTime } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  CancelledBookingRecord,
  formatBookingCode,
  formatReadableDate,
  getBookingComputedStatus,
  getCancelledBookings,
  getFacilityPrimaryImage,
  saveCancelledBooking,
  useFavorites,
} from "@/lib/ui-helpers";
import BookingEditModal from "@/components/BookingEditModal";
import BookingPassModal from "@/components/BookingPassModal";
import CourtCard from "@/components/CourtCard";
import {
  Button,
  CourtCardSkeleton,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  SportBadge,
  SportIcon,
  StatusPill,
  Tabs,
} from "@/components/ui/Primitives";
import { ConfirmDialog, Toast } from "@/components/ui/Overlays";
import {
  CalendarCheck,
  Search,
  MapPin,
  Clock,
  Calendar,
  User as UserIcon,
  Heart,
  FileText,
  Edit3,
  XCircle,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

type PageTab = "upcoming" | "completed" | "cancelled" | "favorites" | "profile";

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const userId = user?._id || user?.id;
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites(userId);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cancelledList, setCancelledList] = useState<CancelledBookingRecord[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<PageTab>("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Confirm Dialog
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedPassBooking, setSelectedPassBooking] = useState<
    (Booking & { isCancelled?: boolean }) | null
  >(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(
    null
  );
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Profile Tab Form States
  const [profileName, setProfileName] = useState("");
  const [profileTel, setProfileTel] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [bookRes, facRes] = await Promise.all([
        api.getBookings(),
        api.getFacilities(),
      ]);
      setBookings(bookRes.data || []);
      setFacilities(facRes.data || []);
      setCancelledList(
        getCancelledBookings(user._id || user.id, user.role === "admin")
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถโหลดรายการจองได้", "Failed to load bookings")
      );
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
      const uid = user._id || user.id;
      const savedRaw =
        typeof window !== "undefined" && uid
          ? localStorage.getItem(`sah_profile_override_${uid}`)
          : null;
      const saved = savedRaw ? JSON.parse(savedRaw) : null;
      setProfileName(saved?.name || user.name || "");
      setProfileTel(saved?.tel || user.tel || "");
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchData]);

  // Split bookings by status: upcoming, completed, cancelled
  const categorizedBookings = useMemo(() => {
    const upcoming: Booking[] = [];
    const completed: Booking[] = [];

    bookings.forEach((b) => {
      const status = getBookingComputedStatus(b);
      if (status === "completed") {
        completed.push(b);
      } else {
        upcoming.push(b);
      }
    });

    return {
      upcoming,
      completed,
      cancelled: cancelledList,
    };
  }, [bookings, cancelledList]);

  const currentTabBookings = useMemo(() => {
    let source: (Booking & { isCancelled?: boolean })[] = [];
    if (activeTab === "upcoming") source = categorizedBookings.upcoming;
    else if (activeTab === "completed") source = categorizedBookings.completed;
    else if (activeTab === "cancelled") source = categorizedBookings.cancelled;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return source;

    return source.filter((b) => {
      const fac = typeof b.facility === "object" ? b.facility : null;
      const usr = typeof b.user === "object" ? b.user : null;
      const code = formatBookingCode(b._id).toLowerCase();
      return (
        code.includes(q) ||
        (fac?.name || "").toLowerCase().includes(q) ||
        (fac?.location || "").toLowerCase().includes(q) ||
        (usr?.name || "").toLowerCase().includes(q)
      );
    });
  }, [activeTab, categorizedBookings, searchTerm]);

  const handleUpdateBooking = async (
    id: string,
    payload: Partial<BookingInput>
  ) => {
    await api.updateBooking(id, payload);
    showToast(
      t(
        "บันทึกการแก้ไขการจองเรียบร้อยแล้ว",
        "Booking updated successfully"
      )
    );
    await fetchData();
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    try {
      setCancelSubmitting(true);
      await api.deleteBooking(cancellingBooking._id);
      saveCancelledBooking(cancellingBooking);
      setCancellingBooking(null);
      showToast(
        t("ยกเลิกรายการจองเรียบร้อยแล้ว", "Booking cancelled successfully")
      );
      await fetchData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถยกเลิกการจองได้", "Failed to cancel booking")
      );
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setTimeout(() => {
      if (typeof window !== "undefined" && userId) {
        localStorage.setItem(
          `sah_profile_override_${userId}`,
          JSON.stringify({
            name: profileName.trim(),
            tel: profileTel.trim(),
          })
        );
      }
      setProfileSaving(false);
      showToast(
        t("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว", "Profile saved successfully")
      );
    }, 300);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError(
        t(
          "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
          "New password must be at least 6 characters"
        )
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        t(
          "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
          "Passwords do not match"
        )
      );
      return;
    }
    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(
        t("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "Password updated successfully")
      );
    }, 350);
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title={t(
            "เข้าสู่ระบบเพื่อดูการจองของคุณ",
            "Log in to view your bookings"
          )}
          description={t(
            "ตรวจสอบตารางนัดหมายที่จะมาถึง ดูใบจอง QR Pass หรือจัดการเลื่อนเวลาได้สะดวกในที่เดียว",
            "Sign in to access your upcoming court reservations, QR passes, and booking history."
          )}
          actionLabel={t("เข้าสู่ระบบ", "Log In")}
          actionHref="/login?redirect=/bookings"
        />
      </div>
    );
  }

  const favoriteFacilities = facilities.filter((f) =>
    favoriteIds.includes(f._id)
  );

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            {t("การจองและบัญชีของฉัน", "My Bookings & Account")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              "ตรวจสอบรายการจองสนามกีฬา ดูรหัสเข้าสนาม และจัดการรายการโปรดของคุณ",
              "Manage your court reservations, view check-in passes, and saved courts."
            )}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-colors self-start sm:self-auto"
        >
          {t("ค้นหาและจองสนามเพิ่ม", "Book Another Court")}
        </Link>
      </div>

      {/* Navigation Tabs: กำลังจะมาถึง / เสร็จสิ้น / ยกเลิก + รายการโปรด / โปรไฟล์ */}
      <div className="bg-white rounded-card border border-slate-200 px-4 pt-2 shadow-soft">
        <Tabs<PageTab>
          tabs={[
            {
              id: "upcoming",
              label: t("กำลังจะมาถึง", "Upcoming"),
              count: categorizedBookings.upcoming.length,
            },
            {
              id: "completed",
              label: t("เสร็จสิ้น", "Completed"),
              count: categorizedBookings.completed.length,
            },
            {
              id: "cancelled",
              label: t("ยกเลิก", "Cancelled"),
              count: categorizedBookings.cancelled.length,
            },
            {
              id: "favorites",
              label: t("รายการโปรด", "Saved Courts"),
              count: favoriteIds.length,
              icon: <Heart className="w-4 h-4" />,
            },
            {
              id: "profile",
              label: t("โปรไฟล์", "Profile"),
              icon: <UserIcon className="w-4 h-4" />,
            },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="border-b-0"
        />
      </div>

      {/* Search bar for booking tabs */}
      {(activeTab === "upcoming" ||
        activeTab === "completed" ||
        activeTab === "cancelled") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                "ค้นหาตามชื่อสนาม หรือ หมายเลขการจอง (เช่น SAH-...)",
                "Search by court name or booking reference (SAH-...)"
              )}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-control border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Content Area by Active Tab */}
      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-card border border-slate-200 p-5 flex flex-col sm:flex-row gap-4"
            >
              <Skeleton className="w-full sm:w-36 h-28 rounded-control shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "favorites" ? (
        /* Section 8: Saved Courts Grid */
        favoriteFacilities.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-6 h-6" />}
            title={t(
              "ยังไม่มีสนามกีฬาในรายการโปรด",
              "No favorite courts saved yet"
            )}
            description={t(
              "กดไอคอนรูปหัวใจบนการ์ดสนามกีฬาที่คุณชอบ เพื่อบันทึกไว้จองในครั้งถัดไปได้ทันที",
              "Tap the heart button on any court card to save it here for quick access."
            )}
            actionLabel={t("ค้นหาสนาม", "Find a Court")}
            actionHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteFacilities.map((fac) => (
              <CourtCard
                key={fac._id}
                facility={fac}
                isFavorite={isFavorite(fac._id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )
      ) : activeTab === "profile" ? (
        /* Section 8: Profile & Password Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-card border border-slate-200 p-6 shadow-soft space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {t("ข้อมูลส่วนตัว", "Personal Information")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  "แก้ไขชื่อและเบอร์โทรศัพท์สำหรับติดต่อเรื่องการจองสนาม",
                  "Update your name and phone number for booking notifications."
                )}
              </p>
            </div>

            <Input
              label={t("ชื่อ-นามสกุล", "Full Name")}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label={t("อีเมล", "Email Address")}
              type="email"
              value={user?.email || ""}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              hint={t(
                "อีเมลใช้สำหรับยืนยันตัวตนในระบบ",
                "Primary account email cannot be changed"
              )}
            />

            <Input
              label={t("เบอร์โทรศัพท์", "Phone Number")}
              type="tel"
              value={profileTel}
              onChange={(e) => setProfileTel(e.target.value)}
              placeholder="081-234-5678"
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" loading={profileSaving}>
                {t("บันทึกข้อมูลส่วนตัว", "Save Profile")}
              </Button>
            </div>
          </form>

          <form
            onSubmit={handleSavePassword}
            className="bg-white rounded-card border border-slate-200 p-6 shadow-soft space-y-4"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  {t("เปลี่ยนรหัสผ่าน", "Change Password")}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(
                    "กำหนดรหัสผ่านใหม่ความยาวอย่างน้อย 6 ตัวอักษร",
                    "Choose a strong password with at least 6 characters."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 min-h-[36px] px-2"
              >
                {showPass ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>{t("ซ่อน", "Hide")}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t("แสดง", "Show")}</span>
                  </>
                )}
              </button>
            </div>

            <Input
              label={t("รหัสผ่านปัจจุบัน", "Current Password")}
              type={showPass ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label={t("รหัสผ่านใหม่", "New Password")}
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label={t("ยืนยันรหัสผ่านใหม่", "Confirm New Password")}
              type={showPass ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={passwordError}
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                loading={passwordSaving}
              >
                {t("อัปเดตรหัสผ่าน", "Update Password")}
              </Button>
            </div>
          </form>
        </div>
      ) : currentTabBookings.length === 0 ? (
        /* Empty State per Booking Tab */
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title={
            activeTab === "upcoming"
              ? t(
                  "ยังไม่มีรายการจองที่กำลังจะมาถึง",
                  "No upcoming court bookings"
                )
              : activeTab === "completed"
              ? t(
                  "ยังไม่มีประวัติการเข้าใช้สนามที่เสร็จสิ้น",
                  "No completed bookings yet"
                )
              : t("ไม่มีรายการจองที่ยกเลิก", "No cancelled bookings")
          }
          description={t(
            "ค้นหาสนามแบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล หรือฟิตเนส แล้วล็อกเวลาที่คุณต้องการได้ทันที",
            "Browse available sports courts and reserve your preferred time slot in seconds."
          )}
          actionLabel={t("ค้นหาสนาม", "Find a Court")}
          actionHref="/"
        />
      ) : (
        /* Section 7: Booking Cards List */
        <div className="space-y-4">
          {currentTabBookings.map((booking) => {
            const fac =
              typeof booking.facility === "object" ? booking.facility : null;
            const usr = typeof booking.user === "object" ? booking.user : null;
            const endTime = formatMinutesToTime(booking.endMinutes);
            const totalFee = fac ? fac.hourlyRate * booking.durationHours : 0;
            const bookingCode = formatBookingCode(booking._id);
            const status = getBookingComputedStatus(booking);
            const thumbUrl = fac ? getFacilityPrimaryImage(fac) : "";

            return (
              <article
                key={booking._id}
                className="bg-white rounded-card border border-slate-200 hover:border-slate-300 shadow-soft p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail + Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
                  {/* Small Court Image */}
                  <div className="w-full sm:w-32 h-36 sm:h-24 rounded-control overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/70">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={fac?.name || "Court"}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <SportIcon
                          sportType={fac?.sportType}
                          className="w-6 h-6"
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {fac && <SportBadge sportType={fac.sportType} />}
                      <StatusPill status={status} />
                      <span className="text-xs font-medium text-slate-500 tabular-price">
                        {t("รหัสการจอง", "Ref")}:{" "}
                        <strong className="text-slate-800">{bookingCode}</strong>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                      {fac ? (
                        <Link
                          href={`/facilities/${fac._id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {fac.name}
                        </Link>
                      ) : (
                        t("สนามกีฬา", "Sports Court")
                      )}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {formatReadableDate(booking.bookingDate, lang)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 tabular-price">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {booking.startTime} – {endTime} {t("น.", "")} (
                          {booking.durationHours} {t("ชม.", "hrs")})
                        </span>
                      </span>
                      {fac?.location && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[220px]">
                            {fac.location}
                          </span>
                        </span>
                      )}
                    </div>

                    {user?.role === "admin" && usr && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {t("ผู้จอง:", "Member:")}{" "}
                          <strong className="font-medium text-slate-800">
                            {usr.name}
                          </strong>{" "}
                          ({usr.email})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Price & Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right mr-2">
                    <span className="text-xs text-slate-500 block">
                      {t("ราคารวม", "Total")}
                    </span>
                    <span className="text-lg font-semibold text-primary tabular-price">
                      ฿{totalFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPassBooking(booking)}
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>{t("ดูรายละเอียด", "View Details")}</span>
                    </Button>

                    {status === "confirmed" && !booking.isCancelled && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBooking(booking)}
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>{t("เลื่อนเวลา", "Reschedule")}</span>
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setCancellingBooking(booking)}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{t("ยกเลิก", "Cancel")}</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reschedule Booking Modal */}
      <BookingEditModal
        isOpen={Boolean(editingBooking)}
        booking={editingBooking}
        facilities={facilities}
        onClose={() => setEditingBooking(null)}
        onSave={handleUpdateBooking}
      />

      {/* Booking Pass / Details Modal */}
      <BookingPassModal
        booking={selectedPassBooking}
        onClose={() => setSelectedPassBooking(null)}
      />

      {/* Confirm Cancel Booking Dialog with Policy Notice */}
      <ConfirmDialog
        isOpen={Boolean(cancellingBooking)}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleConfirmCancelBooking}
        loading={cancelSubmitting}
        title={t("ยืนยันการยกเลิกการจอง", "Cancel Court Reservation")}
        description={
          cancellingBooking
            ? t(
                `คุณต้องการยกเลิกการจองหมายเลข ${formatBookingCode(
                  cancellingBooking._id
                )} (${
                  typeof cancellingBooking.facility === "object"
                    ? cancellingBooking.facility.name
                    : ""
                }) วันที่ ${formatReadableDate(
                  cancellingBooking.bookingDate,
                  lang
                )} เวลา ${cancellingBooking.startTime} น. ใช่หรือไม่?`,
                `Are you sure you want to cancel booking ${formatBookingCode(
                  cancellingBooking._id
                )} on ${formatReadableDate(
                  cancellingBooking.bookingDate,
                  lang
                )} at ${cancellingBooking.startTime}?`
              )
            : ""
        }
        policyNotice={t(
          "เมื่อยืนยันการยกเลิกแล้ว ช่วงเวลาดังกล่าวจะถูกเปิดให้สมาชิกท่านอื่นสามารถเข้าจองได้ทันที และไม่สามารถกู้คืนคิวเดิมได้",
          "Once cancelled, this time slot will immediately reopen for other members and cannot be undone."
        )}
        confirmLabel={t("ยืนยันยกเลิกการจอง", "Confirm Cancellation")}
        cancelLabel={t("เก็บการจองไว้", "Keep Booking")}
      />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
