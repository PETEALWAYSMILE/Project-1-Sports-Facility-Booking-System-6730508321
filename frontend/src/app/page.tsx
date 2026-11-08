"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Facility, FacilityInput } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import FacilityModal from "@/components/FacilityModal";
import {
  Search,
  MapPin,
  Users,
  Plus,
  Edit3,
  Trash2,
  CalendarPlus,
  Sparkles,
  Filter,
  ArrowUpDown,
  Dumbbell,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const getSportBadgeStyle = (sportType: string) => {
  const s = sportType.toLowerCase();
  if (s.includes("badminton"))
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s.includes("tennis"))
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (s.includes("futsal") || s.includes("football") || s.includes("soccer"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("gym") || s.includes("fitness"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (s.includes("basketball"))
    return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-teal-100 text-teal-800 border-teal-200";
};

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<"name" | "priceAsc" | "priceDesc" | "capacityDesc">("name");

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFacilities();
      setFacilities(res.data || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sports facilities from backend"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const sportCategories = useMemo(() => {
    const types = Array.from(
      new Set(facilities.map((f) => f.sportType.trim()))
    ).filter(Boolean);
    return ["ALL", ...types];
  }, [facilities]);

  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((f) => {
        const matchesSearch =
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.sportType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f._id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSport =
          selectedSport === "ALL" ||
          f.sportType.toLowerCase() === selectedSport.toLowerCase();
        const matchesPrice = f.hourlyRate <= maxPrice;
        return matchesSearch && matchesSport && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "priceAsc") return a.hourlyRate - b.hourlyRate;
        if (sortBy === "priceDesc") return b.hourlyRate - a.hourlyRate;
        if (sortBy === "capacityDesc") return b.capacity - a.capacity;
        return a.name.localeCompare(b.name);
      });
  }, [facilities, searchQuery, selectedSport, maxPrice, sortBy]);

  const handleSaveFacility = async (input: FacilityInput) => {
    if (editingFacility) {
      await api.updateFacility(editingFacility._id, input);
      showToast(
        t(
          `แก้ไขสนาม "${input.name}" สำเร็จ`,
          `Updated facility "${input.name}" successfully`
        )
      );
    } else {
      await api.createFacility(input);
      showToast(
        t(
          `เพิ่มสนาม "${input.name}" สำเร็จ`,
          `Created facility "${input.name}" successfully`
        )
      );
    }
    await fetchFacilities();
  };

  const handleDeleteFacility = async (facility: Facility) => {
    const confirmed = window.confirm(
      t(
        `ต้องการลบสนาม "${facility.name}" ใช่หรือไม่?`,
        `Are you sure you want to delete "${facility.name}"?`
      )
    );
    if (!confirmed) return;

    try {
      await api.deleteFacility(facility._id);
      showToast(
        t(
          `ลบสนาม "${facility.name}" เรียบร้อยแล้ว`,
          `Deleted facility "${facility.name}"`
        )
      );
      await fetchFacilities();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-12 sm:py-16 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {t(
                  "Project 1: ระบบจองสถานที่และสนามกีฬาออนไลน์",
                  "Project 1: Real-Time Sports Facility Booking System"
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {t(
                  "ค้นหาและจองสนามกีฬาได้ทันที",
                  "Find & Book Your Ideal Sports Arena"
                )}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {t(
                  "รองรับสนามแบดมินตัน สนามเทนนิส สนามฟุตซอล ห้องออกกำลังกาย และสนามบาสเกตบอล พร้อมตารางตรวจสอบเวลาว่างแบบเรียลไทม์และระบบคำนวณค่าบริการอัตโนมัติ",
                  "Browse badminton courts, tennis arenas, futsal pitches, fitness studios, and basketball halls with interactive time-slot availability and instant price estimation."
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {user ? (
                  <Link
                    href="/bookings"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    {user.role === "admin"
                      ? t("ดูรายการจองทั้งหมดในระบบ", "Manage All Bookings")
                      : t("ดูรายการจองของฉัน", "View My Bookings")}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition"
                    >
                      {t("เข้าสู่ระบบเพื่อจองสนาม", "Log In to Book Facility")}
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
                    >
                      {t("สมัครสมาชิกใหม่", "Create Account")}
                    </Link>
                  </>
                )}

                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setEditingFacility(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    {t("เพิ่มสนามกีฬาใหม่ (Admin)", "Add New Facility")}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-80 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
                <Trophy className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-2xl font-extrabold">{facilities.length}</div>
                <div className="text-xs text-slate-300">
                  {t("สนามที่เปิดให้บริการ", "Active Facilities")}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
                <Dumbbell className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-2xl font-extrabold">
                  {Math.max(0, sportCategories.length - 1)}
                </div>
                <div className="text-xs text-slate-300">
                  {t("ประเภทกีฬา", "Sport Categories")}
                </div>
              </div>
              <div className="col-span-2 bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-100 space-y-1">
                <div className="font-bold text-emerald-300">
                  {t("เงื่อนไขการจอง (Booking Rules):", "Booking Conditions:")}
                </div>
                <div>• {t("จองล่วงหน้าตั้งแต่วันปัจจุบันเป็นต้นไป", "Book from today onwards (no past dates)")}</div>
                <div>• {t("จองได้สูงสุด 2 ชั่วโมงต่อ 1 รายการ (0.5 - 2 ชม.)", "Up to 2 hours per booking (0.5 - 2.0 hrs)")}</div>
                <div>• {t("ระบบป้องกันการจองเวลาซ้อนทับอัตโนมัติ", "Automatic overlap prevention for facility & member")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast notification */}
        {toast && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  "ค้นหาชื่อสนาม, ประเภทกีฬา, สถานที่ตั้ง หรือ ID...",
                  "Search by facility name, sport type, location, or ID..."
                )}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Max Hourly Rate Filter */}
            <div className="md:col-span-4 flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>{t("ราคาสูงสุดต่อชั่วโมง", "Max Hourly Rate")}</span>
                  <span className="text-emerald-700 font-bold">
                    ฿{maxPrice.toLocaleString()}/hr
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 cursor-pointer"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="md:col-span-3 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "name"
                      | "priceAsc"
                      | "priceDesc"
                      | "capacityDesc"
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="name">
                  {t("เรียงตามชื่อสนาม (A-Z)", "Sort by Name (A-Z)")}
                </option>
                <option value="priceAsc">
                  {t("ราคา: ต่ำ -> สูง", "Hourly Rate: Low to High")}
                </option>
                <option value="priceDesc">
                  {t("ราคา: สูง -> ต่ำ", "Hourly Rate: High to Low")}
                </option>
                <option value="capacityDesc">
                  {t("ความจุ: มาก -> น้อย", "Capacity: High to Low")}
                </option>
              </select>
            </div>
          </div>

          {/* Sport Category Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {sportCategories.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sport === "ALL"
                    ? t("ทุกประเภทกีฬา (All Sports)", "All Sports")
                    : sport}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("รายการสถานที่และสนามกีฬา", "Available Sports Facilities")}
            </h2>
            <p className="text-xs text-slate-500">
              {t(
                `แสดง ${filteredFacilities.length} จากทั้งหมด ${facilities.length} สนาม`,
                `Showing ${filteredFacilities.length} of ${facilities.length} facilities`
              )}
            </p>
          </div>

          {user?.role === "admin" && (
            <button
              onClick={() => {
                setEditingFacility(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              {t("เพิ่มสนามกีฬา", "Add Facility")}
            </button>
          )}
        </div>

        {/* Error / Loading / Facilities Grid */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-24 h-6 bg-slate-200 rounded-lg" />
                  <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded-lg" />
                </div>
                <div className="w-full h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Dumbbell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">
              {t(
                "ไม่พบสนามกีฬาที่ตรงกับเงื่อนไขการค้นหา",
                "No matching sports facilities found"
              )}
            </h3>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSport("ALL");
                setMaxPrice(2000);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              {t("ล้างตัวกรองทั้งหมด", "Reset Filters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <div
                key={facility._id}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badge & Price */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getSportBadgeStyle(
                        facility.sportType
                      )}`}
                    >
                      {facility.sportType}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-emerald-600">
                        ฿{facility.hourlyRate.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {t("/ ชั่วโมง", "/ hour")}
                      </span>
                    </div>
                  </div>

                  {/* Facility Name & Details */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ID: {facility._id}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{facility.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {t("ความจุสูงสุด:", "Max Capacity:")}{" "}
                        <strong className="text-slate-900">
                          {facility.capacity} {t("คน", "persons")}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/facilities/${facility._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    {user?.role === "admin"
                      ? t("ดูรายละเอียด / ตารางเวลา", "View Details & Schedule")
                      : t("เช็คเวลาว่าง & จองสนาม", "Check Slots & Book")}
                  </Link>

                  {user?.role === "admin" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingFacility(facility);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition"
                        title={t("แก้ไขสนาม", "Edit Facility")}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFacility(facility)}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition"
                        title={t("ลบสนาม", "Delete Facility")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Add/Edit Modal */}
      <FacilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveFacility}
        initialData={editingFacility}
      />
    </div>
  );
}
