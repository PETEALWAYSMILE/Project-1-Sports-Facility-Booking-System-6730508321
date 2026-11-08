"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Booking, BookingInput, Facility } from "@/types";
import { api, formatMinutesToTime } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import BookingEditModal from "@/components/BookingEditModal";
import BookingPassModal from "@/components/BookingPassModal";
import {
  CalendarCheck,
  Search,
  Edit3,
  Trash2,
  QrCode,
  Download,
  MapPin,
  Clock,
  Calendar,
  User as UserIcon,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterFacility, setFilterFacility] = useState("ALL");

  // Modals
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedPassBooking, setSelectedPassBooking] =
    useState<Booking | null>(null);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const fac = typeof b.facility === "object" ? b.facility : null;
      const usr = typeof b.user === "object" ? b.user : null;
      const bDate = b.bookingDate.slice(0, 10);

      const matchesSearch =
        !searchTerm ||
        b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fac?.sportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = !filterDate || bDate === filterDate;
      const matchesFacility =
        filterFacility === "ALL" || fac?._id === filterFacility;

      return matchesSearch && matchesDate && matchesFacility;
    });
  }, [bookings, searchTerm, filterDate, filterFacility]);

  const summary = useMemo(() => {
    let totalHours = 0;
    let totalCost = 0;
    filteredBookings.forEach((b) => {
      totalHours += b.durationHours;
      const fac = typeof b.facility === "object" ? b.facility : null;
      if (fac) {
        totalCost += fac.hourlyRate * b.durationHours;
      }
    });
    return {
      count: filteredBookings.length,
      totalHours,
      totalCost,
    };
  }, [filteredBookings]);

  const handleUpdateBooking = async (
    id: string,
    payload: Partial<BookingInput>
  ) => {
    await api.updateBooking(id, payload);
    showToast(
      t("อัปเดตข้อมูลการจองเรียบร้อยแล้ว", "Booking updated successfully")
    );
    await fetchData();
  };

  const handleDeleteBooking = async (booking: Booking) => {
    const facName =
      typeof booking.facility === "object"
        ? booking.facility.name
        : "Facility";
    const confirmed = window.confirm(
      t(
        `ยืนยันการยกเลิก/ลบการจองสนาม "${facName}" วันที่ ${booking.bookingDate.slice(
          0,
          10
        )} เวลา ${booking.startTime} ใช่หรือไม่?`,
        `Are you sure you want to delete the booking for "${facName}" on ${booking.bookingDate.slice(
          0,
          10
        )} at ${booking.startTime}?`
      )
    );
    if (!confirmed) return;

    try {
      await api.deleteBooking(booking._id);
      showToast(t("ลบรายการจองเรียบร้อยแล้ว", "Booking deleted successfully"));
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Booking ID",
      "Facility Name",
      "Sport Type",
      "Location",
      "Member Name",
      "Member Email",
      "Booking Date",
      "Start Time",
      "End Time",
      "Duration (Hours)",
      "Estimated Cost (THB)",
    ];
    const rows = filteredBookings.map((b) => {
      const fac = typeof b.facility === "object" ? b.facility : null;
      const usr = typeof b.user === "object" ? b.user : null;
      const cost = fac ? fac.hourlyRate * b.durationHours : 0;
      return [
        b._id,
        `"${fac?.name || ""}"`,
        `"${fac?.sportType || ""}"`,
        `"${fac?.location || ""}"`,
        `"${usr?.name || ""}"`,
        `"${usr?.email || ""}"`,
        b.bookingDate.slice(0, 10),
        b.startTime,
        formatMinutesToTime(b.endMinutes),
        b.durationHours,
        cost,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sports_bookings_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <CalendarCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          {t(
            "กรุณาเข้าสู่ระบบเพื่อดูและจัดการการจอง",
            "Please Log In to View & Manage Bookings"
          )}
        </h2>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          {t("เข้าสู่ระบบ (Login)", "Go to Login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <CalendarCheck className="w-4 h-4" />
            {user?.role === "admin"
              ? t("Admin Booking Management", "Admin Booking Management")
              : t("Member Booking Portal", "Member Booking Portal")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {user?.role === "admin"
              ? t(
                  "จัดการการจองของผู้ใช้งานทั้งหมด",
                  "All Users' Facility Bookings"
                )
              : t("รายการจองสนามกีฬาของฉัน", "My Sports Facility Bookings")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === "admin"
              ? t(
                  "สิทธิ์ Admin: สามารถดู แก้ไข และลบรายการจองของ Member คนใดก็ได้",
                  "Admin Access: View, edit, and delete bookings of any user."
                )
              : t(
                  "สิทธิ์ Member: สามารถดู แก้ไขวันเวลา/สนาม และยกเลิกการจองของตนเองได้",
                  "Member Access: View, modify, and cancel your own facility bookings."
                )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {filteredBookings.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              {t("ส่งออก CSV", "Export CSV")}
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            {t("เลือกสนามเพื่อจองเพิ่ม", "Book a Facility")}
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            {t("จำนวนรายการจอง", "Total Bookings")}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.count} {t("รายการ", "bookings")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            {t("จำนวนชั่วโมงรวม", "Total Hours Reserved")}
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summary.totalHours} {t("ชั่วโมง", "hours")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            {user?.role === "admin"
              ? t("มูลค่าการใช้บริการรวม", "Total Estimated Revenue")
              : t("ค่าบริการประเมินรวม", "Total Estimated Spend")}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ฿{summary.totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(
              "ค้นหาชื่อสนาม, ชื่อผู้จอง, อีเมล หรือรหัสการจอง...",
              "Search facility, user name/email, or booking ID..."
            )}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">
              {t("ทุกสนามกีฬา (All Facilities)", "All Facilities")}
            </option>
            {facilities.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.sportType})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold shrink-0"
            >
              {t("ล้าง", "Clear")}
            </button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {t("ไม่พบรายการจองสนามกีฬา", "No bookings found")}
          </h3>
          <p className="text-xs text-slate-500">
            {t(
              "คุณสามารถเลือกสนามกีฬาจากหน้าแรกเพื่อทำการจองได้ทันที",
              "Select a sports facility from the catalog to create a new booking."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const fac =
              typeof booking.facility === "object" ? booking.facility : null;
            const usr = typeof booking.user === "object" ? booking.user : null;
            const endTime = formatMinutesToTime(booking.endMinutes);
            const totalFee = fac ? fac.hourlyRate * booking.durationHours : 0;

            return (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-sm p-5 sm:p-6 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {fac?.sportType || "Sport"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Booking ID: {booking._id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {fac?.name || "Deleted / Inactive Facility"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {booking.bookingDate.slice(0, 10)}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {booking.startTime} - {endTime} ({booking.durationHours}{" "}
                      {t("ชม.", "hrs")})
                    </span>
                    {fac?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {fac.location}
                      </span>
                    )}
                  </div>

                  {usr && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {t("ผู้จอง:", "Booked by:")}{" "}
                        <strong className="text-slate-900">{usr.name}</strong> (
                        {usr.email}
                        {usr.tel ? ` • ${usr.tel}` : ""})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Cost & Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right mr-2">
                    <div className="text-[11px] text-slate-400">
                      {t("ค่าบริการรวม", "Estimated Fee")}
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600">
                      ฿{totalFee.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPassBooking(booking)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      {t("บัตรจอง (QR)", "QR Pass")}
                    </button>

                    <button
                      onClick={() => setEditingBooking(booking)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {t("แก้ไข", "Edit")}
                    </button>

                    <button
                      onClick={() => handleDeleteBooking(booking)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("ลบ/ยกเลิก", "Delete")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Booking Modal */}
      <BookingEditModal
        isOpen={Boolean(editingBooking)}
        booking={editingBooking}
        facilities={facilities}
        onClose={() => setEditingBooking(null)}
        onSave={handleUpdateBooking}
      />

      {/* QR Booking Pass Modal */}
      <BookingPassModal
        booking={selectedPassBooking}
        onClose={() => setSelectedPassBooking(null)}
      />
    </div>
  );
}
