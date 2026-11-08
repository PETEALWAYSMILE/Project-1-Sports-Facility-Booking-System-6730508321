"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Booking, BookingInput, Facility, FacilityInput } from "@/types";
import { api, formatMinutesToTime } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import FacilityModal from "@/components/FacilityModal";
import BookingEditModal from "@/components/BookingEditModal";
import BookingPassModal from "@/components/BookingPassModal";
import {
  ShieldCheck,
  Building2,
  CalendarCheck,
  TrendingUp,
  Clock,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"facilities" | "bookings">(
    "facilities"
  );

  // Modals
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [passBooking, setPassBooking] = useState<Booking | null>(null);

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
        err instanceof Error ? err.message : "Failed to load admin data"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchAdminData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const stats = useMemo(() => {
    let totalHours = 0;
    let totalRevenue = 0;
    const perFacility: Record<
      string,
      { name: string; sportType: string; bookingsCount: number; hours: number; revenue: number }
    > = {};

    facilities.forEach((f) => {
      perFacility[f._id] = {
        name: f.name,
        sportType: f.sportType,
        bookingsCount: 0,
        hours: 0,
        revenue: 0,
      };
    });

    bookings.forEach((b) => {
      totalHours += b.durationHours;
      const fac = typeof b.facility === "object" ? b.facility : null;
      if (fac) {
        const rev = fac.hourlyRate * b.durationHours;
        totalRevenue += rev;
        if (!perFacility[fac._id]) {
          perFacility[fac._id] = {
            name: fac.name,
            sportType: fac.sportType,
            bookingsCount: 0,
            hours: 0,
            revenue: 0,
          };
        }
        perFacility[fac._id].bookingsCount += 1;
        perFacility[fac._id].hours += b.durationHours;
        perFacility[fac._id].revenue += rev;
      }
    });

    const facilityRanking = Object.values(perFacility).sort(
      (a, b) => b.revenue - a.revenue
    );

    return {
      totalFacilities: facilities.length,
      totalBookings: bookings.length,
      totalHours,
      totalRevenue,
      facilityRanking,
    };
  }, [facilities, bookings]);

  const handleSaveFacility = async (input: FacilityInput) => {
    if (editingFacility) {
      await api.updateFacility(editingFacility._id, input);
      showToast(
        t(
          `อัปเดตสนาม "${input.name}" เรียบร้อยแล้ว`,
          `Updated facility "${input.name}"`
        )
      );
    } else {
      await api.createFacility(input);
      showToast(
        t(
          `เพิ่มสนาม "${input.name}" เรียบร้อยแล้ว`,
          `Created facility "${input.name}"`
        )
      );
    }
    await fetchAdminData();
  };

  const handleDeleteFacility = async (facility: Facility) => {
    if (
      !window.confirm(
        t(
          `ยืนยันการลบสนาม "${facility.name}" ใช่หรือไม่?`,
          `Delete facility "${facility.name}"?`
        )
      )
    )
      return;
    await api.deleteFacility(facility._id);
    showToast(
      t(
        `ลบสนาม "${facility.name}" เรียบร้อยแล้ว`,
        `Deleted facility "${facility.name}"`
      )
    );
    await fetchAdminData();
  };

  const handleUpdateBooking = async (
    id: string,
    payload: Partial<BookingInput>
  ) => {
    await api.updateBooking(id, payload);
    showToast(
      t("อัปเดตข้อมูลการจองเรียบร้อยแล้ว", "Booking updated successfully")
    );
    await fetchAdminData();
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (
      !window.confirm(
        t(
          `ยืนยันการลบรายการจองรหัส ${booking._id} ใช่หรือไม่?`,
          `Delete booking ${booking._id}?`
        )
      )
    )
      return;
    await api.deleteBooking(booking._id);
    showToast(t("ลบรายการจองเรียบร้อยแล้ว", "Booking deleted successfully"));
    await fetchAdminData();
  };

  if (!authLoading && (!user || user.role !== "admin")) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          {t(
            "หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น",
            "Admin Access Required"
          )}
        </h2>
        <p className="text-xs text-slate-500">
          {t(
            "กรุณาเข้าสู่ระบบด้วยบัญชีที่มี Role เป็น admin เพื่อจัดการสนามกีฬาและการจองทั้งหมด",
            "Please log in with an administrator account to access this dashboard."
          )}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          {t("ไปหน้าเข้าสู่ระบบ", "Go to Login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            {t("Administrator Control Center", "Administrator Control Center")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t(
              "แดชบอร์ดผู้ดูแลระบบ & สถิติการใช้งาน",
              "Admin Analytics & Management Dashboard"
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "จัดการข้อมูลสนามกีฬา (Add/Update/Delete) และจัดการรายการจองของผู้ใช้ทุกคนในระบบ",
              "Full CRUD management for sports facilities and all member bookings."
            )}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingFacility(null);
            setIsFacilityModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          {t("เพิ่มสนามกีฬาใหม่ (Add Facility)", "Add New Facility")}
        </button>
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

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{t("สนามที่เปิดใช้งาน", "Active Facilities")}</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats.totalFacilities}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{t("รายการจองทั้งหมด", "Total Bookings")}</span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats.totalBookings}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{t("ชั่วโมงการจองรวม", "Total Booked Hours")}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {stats.totalHours} {t("ชม.", "hrs")}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{t("รายได้ประเมินรวม", "Estimated Revenue")}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ฿{stats.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Revenue & Popularity Breakdown by Facility */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          {t(
            "สถิติความนิยมและรายได้แยกตามสนามกีฬา (Facility Utilization)",
            "Facility Utilization & Revenue Breakdown"
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.facilityRanking.map((item) => {
            const pct =
              stats.totalRevenue > 0
                ? Math.round((item.revenue / stats.totalRevenue) * 100)
                : 0;
            return (
              <div
                key={item.name}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">
                      {item.name}
                    </span>{" "}
                    <span className="text-slate-500">({item.sportType})</span>
                  </div>
                  <span className="font-bold text-emerald-700">
                    ฿{item.revenue.toLocaleString()} ({item.bookingsCount}{" "}
                    {t("การจอง", "bookings")} / {item.hours} {t("ชม.", "hrs")})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.max(pct, item.bookingsCount > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Management Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("facilities")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === "facilities"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t(
            `จัดการสนามกีฬา (${facilities.length})`,
            `Manage Facilities (${facilities.length})`
          )}
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === "bookings"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t(
            `จัดการการจองของทุกคน (${bookings.length})`,
            `Manage All Bookings (${bookings.length})`
          )}
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
      ) : activeTab === "facilities" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="py-3.5 px-4 font-bold">
                  {t("ชื่อสนาม / ID", "Facility / ID")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("ประเภทกีฬา", "Sport Type")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("สถานที่ตั้ง", "Location")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("ความจุ", "Capacity")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("ค่าบริการ/ชม.", "Hourly Rate")}
                </th>
                <th className="py-3.5 px-4 font-bold text-right">
                  {t("การจัดการ", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facilities.map((f) => (
                <tr key={f._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {f._id}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {f.sportType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{f.location}</td>
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    {f.capacity} {t("คน", "persons")}
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-600">
                    ฿{f.hourlyRate.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/facilities/${f._id}`}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title={t("ดูตารางเวลา", "View Schedule")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setEditingFacility(f);
                          setIsFacilityModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                        title={t("แก้ไข", "Edit")}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFacility(f)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                        title={t("ลบ", "Delete")}
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
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="py-3.5 px-4 font-bold">
                  {t("สนามกีฬา / Booking ID", "Facility / Booking ID")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("ผู้จอง (Member)", "Member")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("วันที่ใช้งาน", "Date")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("เวลา & ระยะเวลา", "Time & Duration")}
                </th>
                <th className="py-3.5 px-4 font-bold">
                  {t("ค่าบริการ", "Fee")}
                </th>
                <th className="py-3.5 px-4 font-bold text-right">
                  {t("การจัดการ", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const fac =
                  typeof b.facility === "object" ? b.facility : null;
                const usr = typeof b.user === "object" ? b.user : null;
                const fee = fac ? fac.hourlyRate * b.durationHours : 0;

                return (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">
                        {fac?.name || "Unknown Facility"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {b._id}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {usr?.name || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {usr?.email || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {b.bookingDate.slice(0, 10)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900">
                        {b.startTime} - {formatMinutesToTime(b.endMinutes)}
                      </span>{" "}
                      <span className="text-xs text-slate-500">
                        ({b.durationHours} {t("ชม.", "hrs")})
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-600">
                      ฿{fee.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setPassBooking(b)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title={t("ดูบัตรจอง", "QR Pass")}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBooking(b)}
                          className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                          title={t("แก้ไข", "Edit")}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(b)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                          title={t("ลบ", "Delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}
