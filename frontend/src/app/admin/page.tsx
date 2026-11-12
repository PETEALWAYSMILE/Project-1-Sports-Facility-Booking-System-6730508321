"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Booking, BookingInput, Facility, FacilityInput } from "@/types";
import { api, formatMinutesToTime, getTodayUtcString } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_SPORT_KEYS,
  SPORT_META_MAP,
  SportKey,
  formatBookingCode,
  formatReadableDate,
  getBookingComputedStatus,
  getCancelledBookings,
  getFacilityPrimaryImage,
  getSportName,
  resolveSportKey,
  saveCancelledBooking,
  setCustomFacilityImage,
} from "@/lib/ui-helpers";
import FacilityModal from "@/components/FacilityModal";
import BookingEditModal from "@/components/BookingEditModal";
import BookingPassModal from "@/components/BookingPassModal";
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Select,
  Skeleton,
  SportBadge,
  SportIcon,
  StatusPill,
} from "@/components/ui/Primitives";
import { ConfirmDialog, Drawer, Toast } from "@/components/ui/Overlays";
import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  Building2,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  FileText,
  XCircle,
  ShieldAlert,
  TrendingUp,
  Clock,
  CalendarCheck,
  Activity,
  Menu,
  ExternalLink,
  CheckCircle2,
  MapPin,
  User as UserIcon,
} from "lucide-react";

type AdminSection =
  | "dashboard"
  | "timeline"
  | "bookings"
  | "facilities"
  | "users"
  | "settings";

const TIMELINE_HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 06:00 to 21:00 (ends 22:00)

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Navigation & Layout State
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  // Timeline State
  const todayUtc = getTodayUtcString();
  const [timelineDate, setTimelineDate] = useState<string>(todayUtc);
  const [timelineDrawerBooking, setTimelineDrawerBooking] =
    useState<Booking | null>(null);
  const [emptySlotPrompt, setEmptySlotPrompt] = useState<{
    facility: Facility;
    hour: number;
  } | null>(null);

  // Bookings Management Table Filters & Pagination
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSportFilter, setBookingSportFilter] = useState("ALL");
  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");
  const [bookingSort, setBookingSort] = useState<"dateDesc" | "dateAsc" | "priceDesc">("dateDesc");
  const [bookingPage, setBookingPage] = useState(1);
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);

  // Facilities View Mode
  const [facilitySearch, setFacilitySearch] = useState("");

  // Modals & Confirmations
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [passBooking, setPassBooking] = useState<Booking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdminData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      setLoading(true);
      setError(null);
      const [facRes, bookRes] = await Promise.all([
        api.getFacilities(),
        api.getBookings(),
      ]);
      setFacilities(facRes.data || []);
      setBookings(bookRes.data || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้", "Failed to load admin data")
      );
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchAdminData]);

  // Combined bookings (active + locally cancelled history for full status visibility)
  const allCombinedBookings = useMemo<(Booking & { isCancelled?: boolean })[]>(() => {
    const cancelled = getCancelledBookings(undefined, true);
    const activeIds = new Set(bookings.map((b) => b._id));
    const uniqueCancelled = cancelled.filter((c) => !activeIds.has(c._id));
    return [...bookings, ...uniqueCancelled];
  }, [bookings]);

  // Dashboard Statistics (Strictly meaningful metrics from real data)
  const dashboardMetrics = useMemo(() => {
    const todayBookings = bookings.filter(
      (b) => b.bookingDate.slice(0, 10) === todayUtc
    );
    let todayRevenue = 0;
    let todayBookedHours = 0;

    todayBookings.forEach((b) => {
      todayBookedHours += b.durationHours;
      const fac = typeof b.facility === "object" ? b.facility : null;
      if (fac) todayRevenue += fac.hourlyRate * b.durationHours;
    });

    // Total available court hours today (each active facility open 16 hrs: 06:00 - 22:00)
    const totalAvailableHoursToday = Math.max(facilities.length * 16, 1);
    const utilizationPct = Math.min(
      100,
      Math.round((todayBookedHours / totalAvailableHoursToday) * 100)
    );

    const upcomingBookingsCount = bookings.filter(
      (b) => getBookingComputedStatus(b) === "confirmed"
    ).length;

    // 7-Day Weekly Chart (Today - 2 days to Today + 4 days)
    const weeklySeries: {
      dateStr: string;
      shortLabel: string;
      revenue: number;
      bookingsCount: number;
    }[] = [];

    for (let offset = -2; offset <= 4; offset++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + offset);
      const dStr = d.toISOString().slice(0, 10);
      const dayBookings = bookings.filter(
        (b) => b.bookingDate.slice(0, 10) === dStr
      );
      let rev = 0;
      dayBookings.forEach((b) => {
        const fac = typeof b.facility === "object" ? b.facility : null;
        if (fac) rev += fac.hourlyRate * b.durationHours;
      });
      weeklySeries.push({
        dateStr: dStr,
        shortLabel: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
        revenue: rev,
        bookingsCount: dayBookings.length,
      });
    }

    const maxWeeklyRevenue = Math.max(
      ...weeklySeries.map((s) => s.revenue),
      500
    );

    // Popular facilities ranking
    const facMap: Record<
      string,
      {
        facility: Facility;
        bookingsCount: number;
        hours: number;
        revenue: number;
      }
    > = {};
    facilities.forEach((f) => {
      facMap[f._id] = { facility: f, bookingsCount: 0, hours: 0, revenue: 0 };
    });
    bookings.forEach((b) => {
      const fac = typeof b.facility === "object" ? b.facility : null;
      if (fac && facMap[fac._id]) {
        facMap[fac._id].bookingsCount += 1;
        facMap[fac._id].hours += b.durationHours;
        facMap[fac._id].revenue += fac.hourlyRate * b.durationHours;
      }
    });

    const popularCourts = Object.values(facMap).sort(
      (a, b) => b.bookingsCount - a.bookingsCount || b.revenue - a.revenue
    );

    const recentBookings = [...bookings]
      .sort((a, b) =>
        (b.createdAt || b.bookingDate).localeCompare(
          a.createdAt || a.bookingDate
        )
      )
      .slice(0, 5);

    return {
      todayBookingsCount: todayBookings.length,
      todayRevenue,
      utilizationPct,
      todayBookedHours,
      upcomingBookingsCount,
      weeklySeries,
      maxWeeklyRevenue,
      popularCourts,
      recentBookings,
    };
  }, [bookings, facilities, todayUtc]);

  // Filtered & Paginated Bookings for Management Table
  const filteredBookingsTable = useMemo(() => {
    const q = (bookingSearch || globalSearch).trim().toLowerCase();

    return allCombinedBookings
      .filter((b) => {
        const fac = typeof b.facility === "object" ? b.facility : null;
        const usr = typeof b.user === "object" ? b.user : null;
        const status = getBookingComputedStatus(b);
        const bDate = b.bookingDate.slice(0, 10);
        const code = formatBookingCode(b._id).toLowerCase();

        const matchesQuery =
          !q ||
          code.includes(q) ||
          (fac?.name || "").toLowerCase().includes(q) ||
          (usr?.name || "").toLowerCase().includes(q) ||
          (usr?.email || "").toLowerCase().includes(q);

        const matchesStatus =
          bookingStatusFilter === "ALL" || status === bookingStatusFilter;

        const matchesSport =
          bookingSportFilter === "ALL" ||
          resolveSportKey(fac?.sportType) === bookingSportFilter;

        const matchesFrom = !bookingDateFrom || bDate >= bookingDateFrom;
        const matchesTo = !bookingDateTo || bDate <= bookingDateTo;

        return (
          matchesQuery &&
          matchesStatus &&
          matchesSport &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => {
        if (bookingSort === "priceDesc") {
          const fa = typeof a.facility === "object" ? a.facility : null;
          const fb = typeof b.facility === "object" ? b.facility : null;
          return (
            (fb?.hourlyRate || 0) * b.durationHours -
            (fa?.hourlyRate || 0) * a.durationHours
          );
        }
        if (bookingSort === "dateAsc") {
          return (
            a.bookingDate.localeCompare(b.bookingDate) ||
            a.startMinutes - b.startMinutes
          );
        }
        return (
          b.bookingDate.localeCompare(a.bookingDate) ||
          b.startMinutes - a.startMinutes
        );
      });
  }, [
    allCombinedBookings,
    bookingSearch,
    globalSearch,
    bookingStatusFilter,
    bookingSportFilter,
    bookingDateFrom,
    bookingDateTo,
    bookingSort,
  ]);

  const ITEMS_PER_PAGE = 8;
  const totalBookingPages = Math.max(
    1,
    Math.ceil(filteredBookingsTable.length / ITEMS_PER_PAGE)
  );
  const paginatedBookings = filteredBookingsTable.slice(
    (bookingPage - 1) * ITEMS_PER_PAGE,
    bookingPage * ITEMS_PER_PAGE
  );

  // Aggregated Users Directory from real bookings + current admin
  const memberDirectory = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        email: string;
        tel: string;
        role: string;
        bookingsCount: number;
        totalHours: number;
        totalSpend: number;
        lastBookingDate: string;
      }
    > = {};

    if (user) {
      map[user.email] = {
        name: user.name,
        email: user.email,
        tel: user.tel || "-",
        role: user.role,
        bookingsCount: 0,
        totalHours: 0,
        totalSpend: 0,
        lastBookingDate: "-",
      };
    }

    bookings.forEach((b) => {
      const usr = typeof b.user === "object" ? b.user : null;
      const fac = typeof b.facility === "object" ? b.facility : null;
      if (!usr || !usr.email) return;

      if (!map[usr.email]) {
        map[usr.email] = {
          name: usr.name || "-",
          email: usr.email,
          tel: usr.tel || "-",
          role: usr.role || "member",
          bookingsCount: 0,
          totalHours: 0,
          totalSpend: 0,
          lastBookingDate: b.bookingDate.slice(0, 10),
        };
      }
      map[usr.email].bookingsCount += 1;
      map[usr.email].totalHours += b.durationHours;
      if (fac) {
        map[usr.email].totalSpend += fac.hourlyRate * b.durationHours;
      }
      const bDate = b.bookingDate.slice(0, 10);
      if (
        map[usr.email].lastBookingDate === "-" ||
        bDate > map[usr.email].lastBookingDate
      ) {
        map[usr.email].lastBookingDate = bDate;
      }
    });

    return Object.values(map).sort((a, b) => b.bookingsCount - a.bookingsCount);
  }, [bookings, user]);

  // Handlers
  const handleSaveFacility = async (
    input: FacilityInput,
    customImageUrl?: string
  ) => {
    if (editingFacility) {
      const res = await api.updateFacility(editingFacility._id, input);
      if (customImageUrl !== undefined) {
        setCustomFacilityImage(res.data._id, customImageUrl);
      }
      showToast(
        t(
          `อัปเดตสนาม "${input.name}" เรียบร้อยแล้ว`,
          `Updated "${input.name}"`
        )
      );
    } else {
      const res = await api.createFacility(input);
      if (customImageUrl && res.data?._id) {
        setCustomFacilityImage(res.data._id, customImageUrl);
      }
      showToast(
        t(`เพิ่มสนาม "${input.name}" เรียบร้อยแล้ว`, `Added "${input.name}"`)
      );
    }
    await fetchAdminData();
  };

  const handleConfirmDeleteFacility = async () => {
    if (!deletingFacility) return;
    try {
      setSubmittingAction(true);
      await api.deleteFacility(deletingFacility._id);
      showToast(
        t(
          `ลบสนาม "${deletingFacility.name}" เรียบร้อยแล้ว`,
          `Deleted "${deletingFacility.name}"`
        )
      );
      setDeletingFacility(null);
      await fetchAdminData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถลบสนามได้", "Delete failed")
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateBooking = async (
    id: string,
    payload: Partial<BookingInput>
  ) => {
    await api.updateBooking(id, payload);
    showToast(
      t(
        "บันทึกการเปลี่ยนแปลงการจองเรียบร้อยแล้ว",
        "Booking updated successfully"
      )
    );
    await fetchAdminData();
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    try {
      setSubmittingAction(true);
      await api.deleteBooking(cancellingBooking._id);
      saveCancelledBooking(cancellingBooking);
      setCancellingBooking(null);
      setTimelineDrawerBooking(null);
      showToast(
        t("ยกเลิกรายการจองเรียบร้อยแล้ว", "Booking cancelled successfully")
      );
      await fetchAdminData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถยกเลิกรายการจองได้", "Cancel failed")
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  // Unauthorized Guard (403 style friendly state)
  if (!authLoading && (!user || user.role !== "admin")) {
    return (
      <div className="max-w-container mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          icon={<ShieldAlert className="w-6 h-6 text-amber-600" />}
          title={t(
            "ไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ",
            "Administrator Access Required"
          )}
          description={t(
            "หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลสนามกีฬา (Admin) กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อจัดการสนามและตารางการจอง",
            "Please sign in with a Venue Administrator account to manage courts and schedules."
          )}
          actionLabel={t("กลับหน้าแรก", "Back to Home")}
          actionHref="/"
        />
      </div>
    );
  }

  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "dashboard",
      label: t("แดชบอร์ด", "Dashboard"),
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: "timeline",
      label: t("ตารางการจอง", "Schedule Timeline"),
      icon: <CalendarRange className="w-4 h-4 shrink-0" />,
    },
    {
      id: "bookings",
      label: t("จัดการการจอง", "All Bookings"),
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      badge: bookings.length,
    },
    {
      id: "facilities",
      label: t("จัดการสนาม", "Manage Courts"),
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      badge: facilities.length,
    },
    {
      id: "users",
      label: t("ผู้ใช้", "Members"),
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: memberDirectory.length,
    },
    {
      id: "settings",
      label: t("ตั้งค่า", "Settings"),
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  // Group facilities by sport for the Timeline view
  const facilitiesBySport = ALL_SPORT_KEYS.map((sportKey) => ({
    sportKey,
    sportMeta: SPORT_META_MAP[sportKey],
    courts: facilities.filter(
      (f) => resolveSportKey(f.sportType) === sportKey
    ),
  })).filter((g) => g.courts.length > 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[#F6F5F0] pb-16 md:pb-0">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        aria-label={t("เมนูผู้ดูแลระบบ", "Admin sidebar navigation")}
        className={`hidden lg:flex flex-col bg-white border-r border-[#E2DFD7] transition-all duration-150 shrink-0 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!sidebarCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("ระบบจัดการสนาม", "Venue Control")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={
              sidebarCollapsed
                ? t("ขยายแถบเมนู", "Expand sidebar")
                : t("ย่อแถบเมนู", "Collapse sidebar")
            }
            className="min-w-[40px] min-h-[40px] rounded-control text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center mx-auto lg:mx-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-control text-sm font-medium transition-colors flex items-center justify-between ${
                  active
                    ? "bg-primary-light text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </span>
                {!sidebarCollapsed && typeof item.badge === "number" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs tabular-price ${
                      active
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title={t("เมนูผู้ดูแลระบบ", "Admin Menu")}
      >
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-control text-sm font-medium flex items-center justify-between ${
                  active
                    ? "bg-primary-light text-primary font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 tabular-price">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Drawer>

      {/* Main Right Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Topbar: Mobile Drawer Button, Search, Notifications, Profile */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={t("เปิดเมนูผู้ดูแลระบบ", "Open admin sidebar")}
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-control border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (activeSection === "dashboard") {
                    setActiveSection("bookings");
                  }
                }}
                placeholder={t(
                  "ค้นหาการจอง (SAH-...), ชื่อสมาชิก หรือสนาม...",
                  "Quick search booking, member, or court..."
                )}
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-control border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={t("การแจ้งเตือนการจองล่าสุด", "Recent booking notifications")}
                className="relative min-w-[40px] min-h-[40px] rounded-control border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600"
              >
                <Bell className="w-4 h-4" />
                {dashboardMetrics.todayBookingsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-card border border-slate-200 shadow-elevated p-3 z-40 space-y-2">
                  <div className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100">
                    {t("ความเคลื่อนไหววันนี้", "Today's Activity")}
                  </div>
                  <p className="text-xs text-slate-600">
                    {t(
                      `มีรายการจองวันนี้ทั้งหมด ${dashboardMetrics.todayBookingsCount} รายการ และคิวที่กำลังจะมาถึง ${dashboardMetrics.upcomingBookingsCount} รายการ`,
                      `${dashboardMetrics.todayBookingsCount} bookings scheduled today and ${dashboardMetrics.upcomingBookingsCount} upcoming reservations.`
                    )}
                  </p>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingFacility(null);
                setIsFacilityModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("เพิ่มสนาม", "Add Court")}
              </span>
            </Button>
          </div>
        </div>

        {/* Section Content Container */}
        <div className="p-4 sm:p-6 space-y-6 max-w-container w-full mx-auto">
          {error ? (
            <ErrorState message={error} onRetry={fetchAdminData} />
          ) : loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-card" />
                ))}
              </div>
              <Skeleton className="h-80 rounded-card" />
            </div>
          ) : activeSection === "dashboard" ? (
            /* ==================== 1. DASHBOARD ==================== */
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  {t("ภาพรวมศูนย์กีฬา", "Venue Operations Overview")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t(
                    `ข้อมูลประจำวันที่ ${formatReadableDate(todayUtc, lang)}`,
                    `Real-time metrics for ${formatReadableDate(todayUtc, lang)}`
                  )}
                </p>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-card border border-slate-200 p-4 sm:p-5 shadow-soft space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{t("การจองวันนี้", "Bookings Today")}</span>
                    <CalendarCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-price">
                    {dashboardMetrics.todayBookingsCount}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {t("รายการ", "slots")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 tabular-price">
                    {t("รวมเวลา", "Total")}: {dashboardMetrics.todayBookedHours}{" "}
                    {t("ชม.", "hrs")}
                  </div>
                </div>

                <div className="bg-white rounded-card border border-slate-200 p-4 sm:p-5 shadow-soft space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{t("รายได้วันนี้", "Revenue Today")}</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold text-primary tabular-price">
                    ฿{dashboardMetrics.todayRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t(
                      "คำนวณจากคิวจองวันนี้",
                      "From today's confirmed bookings"
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-card border border-slate-200 p-4 sm:p-5 shadow-soft space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{t("อัตราการใช้สนามวันนี้", "Court Utilization")}</span>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-price">
                    {dashboardMetrics.utilizationPct}%
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${dashboardMetrics.utilizationPct}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-card border border-slate-200 p-4 sm:p-5 shadow-soft space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>
                      {t("คิวจองที่กำลังจะมาถึง", "Upcoming Bookings")}
                    </span>
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-price">
                    {dashboardMetrics.upcomingBookingsCount}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {t("รายการ", "active")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 tabular-price">
                    {t("สนามที่เปิดบริการ", "Active courts")}:{" "}
                    {facilities.length}
                  </div>
                </div>
              </div>

              {/* Weekly Revenue & Bookings Bar Chart (Single Primary Color) + Popular Courts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Weekly Chart (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-card border border-slate-200 p-5 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {t(
                          "แนวโน้มรายได้และการจองรายสัปดาห์",
                          "7-Day Revenue & Booking Schedule"
                        )}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {t(
                          "เปรียบเทียบยอดจองแต่ละวันในช่วง 7 วัน",
                          "Daily booking volume and revenue across 7 days"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="h-48 pt-6 pb-2 px-2 flex items-end justify-between gap-3 border-b border-slate-100">
                    {dashboardMetrics.weeklySeries.map((day) => {
                      const heightPct =
                        day.revenue > 0
                          ? Math.max(
                              12,
                              Math.round(
                                (day.revenue /
                                  dashboardMetrics.maxWeeklyRevenue) *
                                  100
                              )
                            )
                          : 4;
                      const isTodayBar = day.dateStr === todayUtc;
                      return (
                        <div
                          key={day.dateStr}
                          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                        >
                          <span className="text-[11px] font-medium text-slate-700 tabular-price">
                            {day.revenue > 0
                              ? `฿${day.revenue.toLocaleString()}`
                              : "-"}
                          </span>
                          <div className="w-full max-w-[40px] h-28 flex items-end bg-slate-50 rounded-t-lg overflow-hidden">
                            <div
                              className={`w-full rounded-t-lg transition-all ${
                                isTodayBar ? "bg-primary" : "bg-primary/65"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs tabular-price ${
                              isTodayBar
                                ? "font-semibold text-primary"
                                : "text-slate-500"
                            }`}
                          >
                            {isTodayBar
                              ? t("วันนี้", "Today")
                              : day.shortLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Facilities (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-card border border-slate-200 p-5 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                      {t("สนามยอดนิยม", "Top Performing Courts")}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection("facilities")}
                      className="text-xs font-medium text-primary hover:text-primary-hover"
                    >
                      {t("จัดการสนาม", "Manage")}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dashboardMetrics.popularCourts.slice(0, 5).map((item) => (
                      <div
                        key={item.facility._id}
                        className="flex items-center justify-between gap-3 p-3 rounded-control bg-slate-50/80 border border-slate-200/70"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {item.facility.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 tabular-price">
                            <span>
                              {getSportName(item.facility.sportType, lang)}
                            </span>
                            <span>•</span>
                            <span>
                              {item.bookingsCount} {t("รายการ", "bookings")} (
                              {item.hours} {t("ชม.", "hrs")})
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold text-primary tabular-price">
                            ฿{item.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white rounded-card border border-slate-200 shadow-soft overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {t("รายการจองล่าสุด", "Recent Reservations")}
                    </h2>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveSection("bookings")}
                  >
                    {t("ดูทั้งหมด", "View All")}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                        <th className="py-3 px-4 font-medium">
                          {t("รหัสการจอง", "Ref No.")}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {t("สนามกีฬา", "Court")}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {t("ผู้จอง", "Member")}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {t("วันและเวลา", "Date & Time")}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {t("สถานะ", "Status")}
                        </th>
                        <th className="py-3 px-4 font-medium text-right">
                          {t("ยอดชำระ", "Amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboardMetrics.recentBookings.map((b) => {
                        const fac =
                          typeof b.facility === "object" ? b.facility : null;
                        const usr = typeof b.user === "object" ? b.user : null;
                        const fee = fac ? fac.hourlyRate * b.durationHours : 0;
                        return (
                          <tr
                            key={b._id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-price">
                              {formatBookingCode(b._id)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-900">
                                {fac?.name || "-"}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {usr?.name || "-"}
                            </td>
                            <td className="py-3.5 px-4 tabular-price text-slate-700">
                              {formatReadableDate(b.bookingDate, lang)} •{" "}
                              {b.startTime} -{" "}
                              {formatMinutesToTime(b.endMinutes)}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusPill
                                status={getBookingComputedStatus(b)}
                              />
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-primary tabular-price">
                              ฿{fee.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeSection === "timeline" ? (
            /* ==================== 2. TIMELINE SCHEDULE ==================== */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {t(
                      "ตารางการจองรายวัน (Timeline)",
                      "Court Schedule Timeline"
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {t(
                      "คลิกที่บล็อกการจองเพื่อดูรายละเอียดหรือแก้ไขในแถบด้านข้าง",
                      "Click any booking block to inspect or reschedule in the side drawer."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={timelineDate}
                    onChange={(e) => setTimelineDate(e.target.value)}
                    aria-label={t("เลือกวันที่สำหรับตารางเวลา", "Select timeline date")}
                    className="min-h-[44px] px-3.5 py-2 rounded-control border border-slate-200 bg-white text-sm font-medium text-slate-900 tabular-price"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTimelineDate(todayUtc)}
                  >
                    {t("วันนี้", "Today")}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-card border border-slate-200 shadow-soft overflow-x-auto">
                <div className="min-w-[920px]">
                  {/* Timeline Header Axis (06:00 - 22:00) */}
                  <div className="grid grid-cols-[220px_repeat(16,minmax(44px,1fr))] border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <div className="p-3 border-r border-slate-200">
                      {t("สนามกีฬา / เวลา", "Court / Hour")}
                    </div>
                    {TIMELINE_HOURS.map((hr) => (
                      <div
                        key={hr}
                        className="p-2 text-center border-r border-slate-100 tabular-price"
                      >
                        {String(hr).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  {/* Grouped by Sport Type */}
                  {facilitiesBySport.map((group) => (
                    <div key={group.sportKey}>
                      <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <SportBadge sportType={group.sportKey} />
                        <span>
                          ({group.courts.length} {t("สนาม", "courts")})
                        </span>
                      </div>

                      {group.courts.map((court) => {
                        const courtBookingsOnDate = bookings.filter((b) => {
                          const fId =
                            typeof b.facility === "object"
                              ? b.facility._id
                              : b.facility;
                          return (
                            fId === court._id &&
                            b.bookingDate.slice(0, 10) === timelineDate
                          );
                        });

                        return (
                          <div
                            key={court._id}
                            className="grid grid-cols-[220px_repeat(16,minmax(44px,1fr))] border-b border-slate-100 hover:bg-slate-50/40 relative"
                          >
                            {/* Court Name Cell */}
                            <div className="p-3 border-r border-slate-200 flex flex-col justify-center">
                              <div className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                {court.name}
                              </div>
                              <div className="text-[11px] text-slate-500 tabular-price">
                                ฿{court.hourlyRate}/{t("ชม.", "hr")}
                              </div>
                            </div>

                            {/* Hour Cells */}
                            {TIMELINE_HOURS.map((hr) => {
                              const cellStartMin = hr * 60;
                              const cellEndMin = (hr + 1) * 60;

                              const matchingBooking = courtBookingsOnDate.find(
                                (b) =>
                                  b.startMinutes < cellEndMin &&
                                  b.endMinutes > cellStartMin
                              );

                              if (matchingBooking) {
                                const usr =
                                  typeof matchingBooking.user === "object"
                                    ? matchingBooking.user
                                    : null;
                                const status =
                                  getBookingComputedStatus(matchingBooking);
                                return (
                                  <button
                                    key={hr}
                                    type="button"
                                    onClick={() =>
                                      setTimelineDrawerBooking(matchingBooking)
                                    }
                                    className={`p-1.5 border-r border-[#EFECE6] text-left transition-colors ${
                                      status === "completed"
                                        ? "bg-[#EFECE6] hover:bg-[#E2DFD7] text-[#4A4F4B]"
                                        : "bg-[#EBF2EE] hover:bg-[#DCE9E1] text-[#143628]"
                                    }`}
                                    title={`${formatBookingCode(
                                      matchingBooking._id
                                    )} (${matchingBooking.startTime}-${formatMinutesToTime(
                                      matchingBooking.endMinutes
                                    )})`}
                                  >
                                    <div className="px-1.5 py-1 rounded bg-primary text-white text-[10px] font-medium truncate tabular-price">
                                      {matchingBooking.startTime}
                                    </div>
                                    <div className="text-[10px] font-medium truncate mt-0.5 px-0.5">
                                      {usr?.name || t("สมาชิก", "Booked")}
                                    </div>
                                  </button>
                                );
                              }

                              return (
                                <button
                                  key={hr}
                                  type="button"
                                  onClick={() =>
                                    setEmptySlotPrompt({
                                      facility: court,
                                      hour: hr,
                                    })
                                  }
                                  aria-label={t(
                                    `ช่องว่าง ${court.name} เวลา ${hr}:00`,
                                    `Available slot on ${court.name} at ${hr}:00`
                                  )}
                                  className="min-h-[54px] border-r border-slate-100 hover:bg-primary-light/60 transition-colors group flex items-center justify-center"
                                >
                                  <Plus className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeSection === "bookings" ? (
            /* ==================== 3. MANAGE ALL BOOKINGS ==================== */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {t("จัดการรายการจองทั้งหมด", "Manage All Bookings")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 tabular-price">
                    {t(
                      `พบทั้งหมด ${filteredBookingsTable.length} รายการ`,
                      `Showing ${filteredBookingsTable.length} bookings`
                    )}
                  </p>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-card border border-[#E2DFD7] p-4 shadow-soft grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-4 relative">
                  <Search className="w-4 h-4 text-[#767B76] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => {
                      setBookingSearch(e.target.value);
                      setBookingPage(1);
                    }}
                    placeholder={t(
                      "ค้นหารหัส SAH-..., ชื่อผู้จอง, สนาม...",
                      "Search booking ref, member, court..."
                    )}
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-control border border-[#D2CEC3] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Select
                    aria-label={t("กรองตามสถานะ", "Filter by status")}
                    value={bookingStatusFilter}
                    onValueChange={(val) => {
                      setBookingStatusFilter(val);
                      setBookingPage(1);
                    }}
                    options={[
                      { value: "ALL", label: t("ทุกสถานะ", "All Statuses") },
                      { value: "confirmed", label: t("ยืนยันแล้ว", "Confirmed") },
                      { value: "completed", label: t("เสร็จสิ้น", "Completed") },
                      { value: "cancelled", label: t("ยกเลิก", "Cancelled") },
                    ]}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Select
                    aria-label={t("กรองตามประเภทกีฬา", "Filter by sport")}
                    value={bookingSportFilter}
                    onValueChange={(val) => {
                      setBookingSportFilter(val);
                      setBookingPage(1);
                    }}
                    options={[
                      { value: "ALL", label: t("กีฬาทั้งหมด", "All Sports") },
                      ...ALL_SPORT_KEYS.map((k: SportKey) => ({
                        value: k,
                        label:
                          lang === "TH"
                            ? SPORT_META_MAP[k].labelTH
                            : SPORT_META_MAP[k].labelEN,
                        icon: <SportIcon sportType={k} className="w-4 h-4" />,
                      })),
                    ]}
                  />
                </div>

                <div className="lg:col-span-2">
                  <input
                    type="date"
                    value={bookingDateFrom}
                    onChange={(e) => {
                      setBookingDateFrom(e.target.value);
                      setBookingPage(1);
                    }}
                    aria-label={t("ตั้งแต่วันที่", "From date")}
                    className="w-full min-h-[44px] px-3 py-2 rounded-control border border-[#D2CEC3] bg-white text-sm tabular-price focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Select
                    aria-label={t("เรียงลำดับ", "Sort order")}
                    value={bookingSort}
                    onValueChange={(val) =>
                      setBookingSort(
                        val as "dateDesc" | "dateAsc" | "priceDesc"
                      )
                    }
                    options={[
                      {
                        value: "dateDesc",
                        label: t("วันที่: ล่าสุดก่อน", "Date: Newest"),
                      },
                      {
                        value: "dateAsc",
                        label: t("วันที่: เก่าสุดก่อน", "Date: Oldest"),
                      },
                      {
                        value: "priceDesc",
                        label: t("ยอดชำระสูงสุด", "Highest Fee"),
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Bookings Data Table */}
              <div className="bg-white rounded-card border border-slate-200 shadow-soft overflow-visible">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                        <th className="py-3.5 px-4 font-medium">
                          {t("เลขที่การจอง", "Booking No.")}
                        </th>
                        <th className="py-3.5 px-4 font-medium">
                          {t("สนามกีฬา", "Court")}
                        </th>
                        <th className="py-3.5 px-4 font-medium">
                          {t("สมาชิกผู้จอง", "Member")}
                        </th>
                        <th className="py-3.5 px-4 font-medium">
                          {t("วันที่และเวลา", "Schedule")}
                        </th>
                        <th className="py-3.5 px-4 font-medium">
                          {t("สถานะ", "Status")}
                        </th>
                        <th className="py-3.5 px-4 font-medium text-right">
                          {t("ราคา", "Amount")}
                        </th>
                        <th className="py-3.5 px-4 font-medium text-right">
                          {t("จัดการ", "Actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.map((b) => {
                        const fac =
                          typeof b.facility === "object" ? b.facility : null;
                        const usr = typeof b.user === "object" ? b.user : null;
                        const fee = fac ? fac.hourlyRate * b.durationHours : 0;
                        const status = getBookingComputedStatus(b);
                        const isMenuOpen = openActionRowId === b._id;

                        return (
                          <tr
                            key={b._id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-price">
                              {formatBookingCode(b._id)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-900">
                                {fac?.name || "-"}
                              </div>
                              {fac && (
                                <div className="mt-0.5">
                                  <SportBadge sportType={fac.sportType} />
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-900">
                                {usr?.name || "-"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {usr?.email || "-"}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 tabular-price">
                              <div className="font-medium text-slate-900">
                                {formatReadableDate(b.bookingDate, lang)}
                              </div>
                              <div className="text-xs text-slate-500">
                                {b.startTime} –{" "}
                                {formatMinutesToTime(b.endMinutes)} (
                                {b.durationHours} {t("ชม.", "hrs")})
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusPill status={status} />
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-primary tabular-price">
                              ฿{fee.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenActionRowId(isMenuOpen ? null : b._id)
                                }
                                aria-label={t("เมนูจัดการรายการจอง", "Booking actions")}
                                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-control border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-4 mt-1 w-44 bg-white rounded-card border border-slate-200 shadow-elevated py-1 z-30 text-left">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionRowId(null);
                                      setPassBooking(b);
                                    }}
                                    className="w-full min-h-[40px] px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                    <span>
                                      {t("ดูรายละเอียด", "View Details")}
                                    </span>
                                  </button>

                                  {!b.isCancelled && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionRowId(null);
                                          setEditingBooking(b);
                                        }}
                                        className="w-full min-h-[40px] px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                          {t("แก้ไขวัน/เวลา", "Reschedule")}
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionRowId(null);
                                          setCancellingBooking(b);
                                        }}
                                        className="w-full min-h-[40px] px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>
                                          {t("ยกเลิกการจอง", "Cancel Booking")}
                                        </span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4">
                  <Pagination
                    currentPage={bookingPage}
                    totalPages={totalBookingPages}
                    onPageChange={setBookingPage}
                  />
                </div>
              </div>
            </div>
          ) : activeSection === "facilities" ? (
            /* ==================== 4. MANAGE FACILITIES ==================== */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {t("จัดการสนามกีฬา", "Manage Sports Courts")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {t(
                      "เพิ่ม แก้ไข หรือปรับสถานะการให้บริการของสนามกีฬาในระบบ",
                      "Add new courts, update hourly rates, or remove inactive facilities."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={facilitySearch}
                      onChange={(e) => setFacilitySearch(e.target.value)}
                      placeholder={t("ค้นหาชื่อสนาม...", "Search court...")}
                      className="min-h-[44px] pl-9 pr-3 py-2 rounded-control border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingFacility(null);
                      setIsFacilityModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("เพิ่มสนาม", "Add Court")}</span>
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-card border border-slate-200 shadow-soft overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                      <th className="py-3.5 px-4 font-medium">
                        {t("สนามกีฬา", "Court")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ประเภทกีฬา", "Sport")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ทำเลที่ตั้ง", "Location")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ความจุ", "Capacity")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ราคา / ชม.", "Rate / Hr")}
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        {t("จัดการ", "Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {facilities
                      .filter(
                        (f) =>
                          !facilitySearch.trim() ||
                          f.name
                            .toLowerCase()
                            .includes(facilitySearch.toLowerCase()) ||
                          f.location
                            .toLowerCase()
                            .includes(facilitySearch.toLowerCase())
                      )
                      .map((f) => (
                        <tr
                          key={f._id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getFacilityPrimaryImage(f)}
                                alt={f.name}
                                className="w-12 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                              />
                              <span className="font-semibold text-slate-900">
                                {f.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <SportBadge sportType={f.sportType} />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {f.location}
                          </td>
                          <td className="py-3.5 px-4 tabular-price text-slate-800">
                            {f.capacity} {t("คน", "players")}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-primary tabular-price">
                            ฿{f.hourlyRate.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/facilities/${f._id}`}
                                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-control border border-slate-200 text-slate-600 hover:bg-slate-50"
                                title={t("ดูหน้าสนาม", "View court page")}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFacility(f);
                                  setIsFacilityModalOpen(true);
                                }}
                                aria-label={t(`แก้ไข ${f.name}`, `Edit ${f.name}`)}
                                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-control border border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingFacility(f)}
                                aria-label={t(`ลบ ${f.name}`, `Delete ${f.name}`)}
                                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-control border border-slate-200 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSection === "users" ? (
            /* ==================== 5. MEMBERS DIRECTORY ==================== */
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  {t(
                    "รายชื่อสมาชิกและประวัติการใช้งาน",
                    "Members & Booking Activity"
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t(
                    "ข้อมูลสมาชิกและสรุปประวัติการจองสนามกีฬาจากรายการจองในระบบ",
                    "Member directory aggregated from active venue reservations."
                  )}
                </p>
              </div>

              <div className="bg-white rounded-card border border-slate-200 shadow-soft overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                      <th className="py-3.5 px-4 font-medium">
                        {t("ชื่อ-นามสกุล", "Member Name")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("อีเมล / เบอร์โทรศัพท์", "Contact")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ประเภทบัญชี", "Role")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("จำนวนครั้งที่จอง", "Total Bookings")}
                      </th>
                      <th className="py-3.5 px-4 font-medium">
                        {t("ชั่วโมงรวม", "Hours Reserved")}
                      </th>
                      <th className="py-3.5 px-4 font-medium text-right">
                        {t("ยอดใช้บริการรวม", "Total Spend")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberDirectory.map((m) => (
                      <tr key={m.email} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {m.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{m.email}</div>
                          <div className="text-xs text-slate-500 tabular-price">
                            {m.tel}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              m.role === "admin"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-primary-light text-primary"
                            }`}
                          >
                            {m.role === "admin"
                              ? t("ผู้ดูแลระบบ", "Admin")
                              : t("สมาชิก", "Member")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 tabular-price font-medium text-slate-900">
                          {m.bookingsCount} {t("ครั้ง", "bookings")}
                        </td>
                        <td className="py-3.5 px-4 tabular-price text-slate-700">
                          {m.totalHours} {t("ชม.", "hrs")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-primary tabular-price">
                          ฿{m.totalSpend.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ==================== 6. SETTINGS ==================== */
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  {t(
                    "ตั้งค่าและกฎการจองสนามกีฬา",
                    "System Booking Rules & Configuration"
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t(
                    "ข้อกำหนดมาตรฐานที่บังคับใช้ในการตรวจสอบการจองทุกครั้ง",
                    "Active validation policies enforced by the SportArenaHub booking engine."
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-card border border-slate-200 p-6 shadow-soft space-y-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    {t("ข้อกำหนดระยะเวลาและวันจอง", "Duration & Date Limits")}
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3.5 rounded-control bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-600">
                        {t("ระยะเวลาขั้นต่ำต่อรายการ", "Minimum Booking Duration")}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-price">
                        0.5 {t("ชั่วโมง (30 นาที)", "Hours (30 mins)")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-control bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-600">
                        {t("ระยะเวลาสูงสุดต่อรายการ", "Maximum Booking Duration")}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-price">
                        2.0 {t("ชั่วโมง", "Hours")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-control bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-600">
                        {t("ช่วงเวลาเปิดให้บริการมาตรฐาน", "Operating Hours")}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-price">
                        06:00 – 22:00 {t("น.", "")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-card border border-slate-200 p-6 shadow-soft space-y-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    {t(
                      "ระบบป้องกันการจองซ้อนทับ",
                      "Conflict & Access Protection"
                    )}
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        {t(
                          "ป้องกันการจองเวลาทับซ้อนในสนามเดียวกันแบบเรียลไทม์",
                          "Real-time facility time-slot overlap prevention."
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        {t(
                          "ป้องกันสมาชิกคนเดิมจองหลายสนามในช่วงเวลาเดียวกัน",
                          "Prevents a single member from double-booking overlapping times across courts."
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>
                        {t(
                          "คำนวณค่าบริการอัตโนมัติตามอัตราค่าบริการรายชั่วโมงของแต่ละสนาม",
                          "Automated fee calculation based on each court's hourly rate."
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Booking Details Drawer */}
      <Drawer
        isOpen={Boolean(timelineDrawerBooking)}
        onClose={() => setTimelineDrawerBooking(null)}
        title={t("รายละเอียดการจอง", "Booking Details")}
        subtitle={
          timelineDrawerBooking
            ? `${t("หมายเลขการจอง", "Ref")}: ${formatBookingCode(
                timelineDrawerBooking._id
              )}`
            : ""
        }
        footer={
          timelineDrawerBooking && (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancellingBooking(timelineDrawerBooking)}
              >
                <XCircle className="w-4 h-4" />
                <span>{t("ยกเลิกการจอง", "Cancel Booking")}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const bk = timelineDrawerBooking;
                  setTimelineDrawerBooking(null);
                  setEditingBooking(bk);
                }}
              >
                <Edit3 className="w-4 h-4" />
                <span>{t("แก้ไขเวลา", "Reschedule")}</span>
              </Button>
            </div>
          )
        }
      >
        {timelineDrawerBooking && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {t("สถานะการจอง", "Booking Status")}
              </span>
              <StatusPill
                status={getBookingComputedStatus(timelineDrawerBooking)}
              />
            </div>

            <div className="p-4 rounded-card bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="font-semibold text-base text-slate-900">
                {typeof timelineDrawerBooking.facility === "object"
                  ? timelineDrawerBooking.facility.name
                  : "-"}
              </div>
              {typeof timelineDrawerBooking.facility === "object" && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{timelineDrawerBooking.facility.location}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">{t("วันที่", "Date")}</span>
                <span className="font-medium text-slate-900">
                  {formatReadableDate(timelineDrawerBooking.bookingDate, lang)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t("ช่วงเวลา", "Time")}</span>
                <span className="font-semibold text-slate-900 tabular-price">
                  {timelineDrawerBooking.startTime} –{" "}
                  {formatMinutesToTime(timelineDrawerBooking.endMinutes)} (
                  {timelineDrawerBooking.durationHours} {t("ชม.", "hrs")})
                </span>
              </div>
            </div>

            {typeof timelineDrawerBooking.user === "object" &&
              timelineDrawerBooking.user && (
                <div className="p-4 rounded-card bg-white border border-slate-200 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-primary" />
                    <span>{t("ข้อมูลสมาชิกผู้จอง", "Booked By Member")}</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {timelineDrawerBooking.user.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    {timelineDrawerBooking.user.email}
                  </div>
                  {timelineDrawerBooking.user.tel && (
                    <div className="text-xs text-slate-600 tabular-price">
                      {timelineDrawerBooking.user.tel}
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </Drawer>

      {/* Empty Slot Click Drawer on Timeline */}
      <Drawer
        isOpen={Boolean(emptySlotPrompt)}
        onClose={() => setEmptySlotPrompt(null)}
        title={t("ช่วงเวลาว่างพร้อมให้บริการ", "Available Time Slot")}
        footer={
          emptySlotPrompt && (
            <Link
              href={`/facilities/${emptySlotPrompt.facility._id}?date=${timelineDate}`}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium w-full"
            >
              {t("เปิดดูหน้าตารางเวลาสนามนี้", "Open Court Schedule Page")}
            </Link>
          )
        }
      >
        {emptySlotPrompt && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-card bg-slate-50 border border-slate-200 space-y-2">
              <SportBadge sportType={emptySlotPrompt.facility.sportType} />
              <div className="text-base font-semibold text-slate-900">
                {emptySlotPrompt.facility.name}
              </div>
              <div className="text-xs text-slate-600 tabular-price">
                {formatReadableDate(timelineDate, lang)} •{" "}
                {String(emptySlotPrompt.hour).padStart(2, "0")}:00 –{" "}
                {String(emptySlotPrompt.hour + 1).padStart(2, "0")}:00{" "}
                {t("น.", "")}
              </div>
              <div className="text-sm font-semibold text-primary tabular-price">
                ฿{emptySlotPrompt.facility.hourlyRate.toLocaleString()} /{" "}
                {t("ชม.", "hr")}
              </div>
            </div>

            <div className="p-4 rounded-control bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">
                {t(
                  "สิทธิ์การสร้างรายการจองใหม่",
                  "Member Reservation Policy"
                )}
              </div>
              <p className="leading-relaxed">
                {t(
                  "ตามกฎของระบบ การสร้างรายการจองใหม่ต้องทำผ่านบัญชีสมาชิก (Member) เท่านั้น ส่วนผู้ดูแลระบบสามารถดู แก้ไขเวลา หรือยกเลิกรายการจองของสมาชิกทุกคนได้",
                  "Per backend security rules, new bookings are created by Member accounts, while Administrators can reschedule or cancel any existing reservation."
                )}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modals & Confirmations */}
      <FacilityModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        onSubmit={handleSaveFacility}
        initialData={editingFacility}
      />

      <BookingEditModal
        isOpen={Boolean(editingBooking)}
        booking={editingBooking}
        facilities={facilities}
        onClose={() => setEditingBooking(null)}
        onSave={handleUpdateBooking}
      />

      <BookingPassModal
        booking={passBooking}
        onClose={() => setPassBooking(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingFacility)}
        onClose={() => setDeletingFacility(null)}
        onConfirm={handleConfirmDeleteFacility}
        loading={submittingAction}
        title={t("ยืนยันการลบสนามกีฬา", "Delete Sports Court")}
        description={t(
          `คุณต้องการลบสนาม "${deletingFacility?.name || ""}" ออกจากรายการที่เปิดให้บริการใช่หรือไม่?`,
          `Are you sure you want to delete "${deletingFacility?.name || ""}"?`
        )}
        policyNotice={t(
          "สนามที่ถูกลบจะถูกปรับสถานะเป็นปิดให้บริการและไม่แสดงในหน้าค้นหา",
          "Deleted courts are marked inactive and removed from public search."
        )}
        confirmLabel={t("ยืนยันลบสนาม", "Delete Court")}
      />

      <ConfirmDialog
        isOpen={Boolean(cancellingBooking)}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleConfirmCancelBooking}
        loading={submittingAction}
        title={t("ยืนยันการยกเลิกรายการจอง", "Cancel Member Booking")}
        description={
          cancellingBooking
            ? t(
                `ยืนยันการยกเลิกการจองหมายเลข ${formatBookingCode(
                  cancellingBooking._id
                )} ใช่หรือไม่?`,
                `Are you sure you want to cancel booking ${formatBookingCode(
                  cancellingBooking._id
                )}?`
              )
            : ""
        }
        policyNotice={t(
          "การยกเลิกจะคืนช่องเวลาว่างให้สนามทันทีและไม่สามารถเรียกคืนได้",
          "Cancelling immediately frees up the court time slot."
        )}
        confirmLabel={t("ยืนยันการยกเลิก", "Confirm Cancel")}
      />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
