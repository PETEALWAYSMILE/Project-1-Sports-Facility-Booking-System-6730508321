"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Facility, FacilityInput } from "@/types";
import { api, getTodayUtcString } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  ALL_SPORT_KEYS,
  SPORT_META_MAP,
  SportKey,
  resolveSportKey,
  setCustomFacilityImage,
  useFavorites,
} from "@/lib/ui-helpers";
import SearchBar from "@/components/SearchBar";
import CourtCard from "@/components/CourtCard";
import FacilityModal from "@/components/FacilityModal";
import {
  Button,
  CourtCardSkeleton,
  EmptyState,
  ErrorState,
  SportIcon,
} from "@/components/ui/Primitives";
import { ConfirmDialog, Drawer, Modal, Toast } from "@/components/ui/Overlays";
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Info,
  Search,
  CalendarClock,
  CheckCircle2,
  Plus,
  LayoutGrid,
} from "lucide-react";

type SortOption = "name" | "priceAsc" | "priceDesc" | "capacityDesc";

export default function HomePage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const userId = user?._id || user?.id;
  const { toggleFavorite, isFavorite } = useFavorites(userId);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filters & Sorting
  const todayUtc = getTodayUtcString();
  const [selectedDate, setSelectedDate] = useState<string>(todayUtc);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Filter Drawer/Popover & Rules Modal
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Admin Modals
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

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
          : t(
              "ไม่สามารถโหลดข้อมูลสนามกีฬาได้ กรุณาลองใหม่อีกครั้ง",
              "Unable to load sports facilities. Please try again."
            )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sp = params.get("sport");
      if (sp && ALL_SPORT_KEYS.includes(sp as SportKey)) {
        setSelectedSport(sp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filteredFacilities = useMemo(() => {
    return facilities
      .filter((f) => {
        const sportKey = resolveSportKey(f.sportType);
        const sportMeta = SPORT_META_MAP[sportKey];
        const q = searchQuery.trim().toLowerCase();

        const matchesSearch =
          !q ||
          f.name.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.sportType.toLowerCase().includes(q) ||
          sportMeta.labelTH.toLowerCase().includes(q);

        const matchesSport =
          selectedSport === "ALL" || sportKey === selectedSport;
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

  const hasActiveFilters =
    selectedSport !== "ALL" ||
    searchQuery.trim() !== "" ||
    maxPrice < 2000 ||
    sortBy !== "name";

  const clearAllFilters = () => {
    setSelectedSport("ALL");
    setSearchQuery("");
    setMaxPrice(2000);
    setSortBy("name");
  };

  const sortLabelMap: Record<SortOption, string> = {
    name: t("เรียงตามชื่อ (A-Z)", "Name (A-Z)"),
    priceAsc: t("ราคา: ต่ำ ไป สูง", "Price: Low to High"),
    priceDesc: t("ราคา: สูง ไป ต่ำ", "Price: High to Low"),
    capacityDesc: t("ความจุผู้เล่นมากสุด", "Capacity: High to Low"),
  };

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
          `บันทึกการแก้ไข "${input.name}" เรียบร้อยแล้ว`,
          `Updated "${input.name}" successfully`
        )
      );
    } else {
      const res = await api.createFacility(input);
      if (customImageUrl && res.data?._id) {
        setCustomFacilityImage(res.data._id, customImageUrl);
      }
      showToast(
        t(
          `เพิ่มสนาม "${input.name}" เรียบร้อยแล้ว`,
          `Added "${input.name}" successfully`
        )
      );
    }
    await fetchFacilities();
  };

  const handleConfirmDeleteFacility = async () => {
    if (!deletingFacility) return;
    try {
      setDeleteSubmitting(true);
      await api.deleteFacility(deletingFacility._id);
      showToast(
        t(
          `ลบสนาม "${deletingFacility.name}" เรียบร้อยแล้ว`,
          `Removed "${deletingFacility.name}"`
        )
      );
      setDeletingFacility(null);
      await fetchFacilities();
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถลบสนามได้", "Failed to delete facility")
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-8">
      {/* Top Search Section (Light, airy, clean one-line heading above prominent SearchBar) */}
      <section className="bg-gradient-to-b from-white via-white/80 to-transparent border-b border-black/5 py-8 sm:py-10">
        <div className="max-w-container mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
                {t(
                  "ค้นหาและจองสนามกีฬาพร้อมเล่นวันนี้",
                  "Find and book sports courts ready for play"
                )}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0071e3] hover:underline self-start sm:self-auto min-h-[36px]"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{t("เงื่อนไขการจองสนาม", "Booking Rules")}</span>
            </button>
          </div>

          <SearchBar
            selectedSport={selectedSport}
            onSportChange={setSelectedSport}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            minDate={todayUtc}
            onSearchSubmit={() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* Horizontal Circular Sport Category Strip */}
          <div
            role="tablist"
            aria-label={t("เลือกประเภทกีฬา", "Filter by sport category")}
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pt-2 pb-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedSport === "ALL"}
              onClick={() => setSelectedSport("ALL")}
              className="group flex flex-col items-center gap-2 min-w-[72px] py-1 focus:outline-none rounded-xl"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-150 ${
                  selectedSport === "ALL"
                    ? "bg-[#0071e3] text-white border-transparent shadow-sm scale-105"
                    : "bg-white text-slate-600 border-slate-200/90 group-hover:border-[#0071e3] group-hover:text-[#0071e3] shadow-soft"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  selectedSport === "ALL"
                    ? "text-[#0071e3] font-semibold"
                    : "text-slate-700"
                }`}
              >
                {t("ทั้งหมด", "All")}
              </span>
            </button>

            {ALL_SPORT_KEYS.map((key) => {
              const meta = SPORT_META_MAP[key];
              const active = selectedSport === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedSport(key)}
                  className="group flex flex-col items-center gap-2 min-w-[76px] py-1 focus:outline-none rounded-xl"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-150 ${
                      active
                        ? "bg-[#0071e3] text-white border-transparent shadow-sm scale-105"
                        : `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} group-hover:scale-105 shadow-soft`
                    }`}
                  >
                    <SportIcon sportType={key} className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      active ? "text-[#0071e3] font-semibold" : "text-slate-700"
                    }`}
                  >
                    {lang === "TH" ? meta.labelTH : meta.labelEN}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div
        ref={resultsRef}
        className="max-w-container mx-auto px-4 sm:px-6 space-y-6"
      >
        {/* Header Bar + Filter/Sort Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              {t("สนามกีฬาที่เปิดให้บริการ", "Available Courts")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 tabular-price">
              {loading
                ? t("กำลังค้นหาสนาม...", "Loading courts...")
                : t(
                    `พบ ${filteredFacilities.length} สนาม`,
                    `Found ${filteredFacilities.length} courts`
                  )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Filter & Sort Drawer Trigger */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-full border border-slate-300/80 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-[#1d1d1f] shadow-sm transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#0071e3]" />
              <span>{t("ตัวกรองและเรียงลำดับ", "Filter & Sort")}</span>
              {(maxPrice < 2000 || sortBy !== "name") && (
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
              )}
            </button>

            {user?.role === "admin" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingFacility(null);
                  setIsFacilityModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                <span>{t("เพิ่มสนาม", "Add Court")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedSport !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-soft">
                <span>
                  {t("กีฬา:", "Sport:")}{" "}
                  {lang === "TH"
                    ? SPORT_META_MAP[selectedSport as SportKey]?.labelTH
                    : SPORT_META_MAP[selectedSport as SportKey]?.labelEN}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSport("ALL")}
                  aria-label={t("ลบตัวกรองประเภทกีฬา", "Remove sport filter")}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {searchQuery.trim() !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-soft">
                <span>
                  {t("คำค้น:", "Search:")} &ldquo;{searchQuery.trim()}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("ลบคำค้นหา", "Remove search keyword")}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {maxPrice < 2000 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-soft tabular-price">
                <span>
                  {t("ไม่เกิน", "Up to")} ฿{maxPrice.toLocaleString()}/{t("ชม.", "hr")}
                </span>
                <button
                  type="button"
                  onClick={() => setMaxPrice(2000)}
                  aria-label={t("ลบตัวกรองราคา", "Remove price filter")}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {sortBy !== "name" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-soft">
                <ArrowUpDown className="w-3 h-3 text-primary" />
                <span>{sortLabelMap[sortBy]}</span>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  aria-label={t("คืนค่าการเรียงลำดับ", "Reset sort")}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-primary hover:text-primary-hover px-2 py-1"
            >
              {t("ล้างตัวกรอง", "Clear All")}
            </button>
          </div>
        )}

        {/* 4 States: Error / Loading Skeleton / Empty / Success Grid */}
        {error ? (
          <ErrorState message={error} onRetry={fetchFacilities} />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CourtCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredFacilities.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title={t(
              "ไม่พบสนามกีฬาที่ตรงกับตัวกรอง",
              "No courts match your current filters"
            )}
            description={t(
              "ลองเปลี่ยนประเภทกีฬา ปรับช่วงราคา หรือล้างตัวกรองเพื่อดูสนามทั้งหมดที่เปิดให้บริการ",
              "Try selecting another sport category, adjusting your price range, or clearing filters."
            )}
            actionLabel={t("ล้างตัวกรองทั้งหมด", "Reset All Filters")}
            onAction={clearAllFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <CourtCard
                key={facility._id}
                facility={facility}
                selectedDate={selectedDate}
                isFavorite={isFavorite(facility._id)}
                onToggleFavorite={toggleFavorite}
                adminActions={
                  user?.role === "admin"
                    ? {
                        onEdit: (fac) => {
                          setEditingFacility(fac);
                          setIsFacilityModalOpen(true);
                        },
                        onDelete: (fac) => setDeletingFacility(fac),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* "จองง่ายใน 3 ขั้นตอน" (Easy Booking in 3 Steps) */}
        <section
          aria-labelledby="how-it-works-heading"
          className="pt-8 mt-12 border-t border-slate-200"
        >
          <div className="bg-white rounded-card border border-slate-200 p-6 sm:p-8 shadow-soft">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                id="how-it-works-heading"
                className="text-lg sm:text-xl font-semibold text-slate-900"
              >
                {t("จองง่ายใน 3 ขั้นตอน", "Book Your Court in 3 Simple Steps")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t(
                  "เช็คตารางเวลาว่างและล็อกคิวสนามได้ทันทีโดยไม่ต้องรอคอนเฟิร์มผ่านแชท",
                  "Check live court availability and lock in your slot instantly."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-control bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-control bg-primary-light text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-primary">
                    {t("ขั้นตอนที่ 1", "Step 1")}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    {t("ค้นหาสนามที่ต้องการ", "Find Your Court")}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t(
                      "เลือกประเภทกีฬา ทำเล และเปรียบเทียบราคาพร้อมสิ่งอำนวยความสะดวกครบถ้วน",
                      "Filter by sport, location, and hourly rate to find the right arena."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-control bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-control bg-primary-light text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-primary">
                    {t("ขั้นตอนที่ 2", "Step 2")}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    {t("เลือกวันและช่วงเวลาว่าง", "Pick Date & Time Slot")}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t(
                      "เลือกช่วงเวลาทีละ 30 นาที (0.5 - 2 ชม.) ระบบคำนวณราคาและกันคิวซ้อนทับอัตโนมัติ",
                      "Select 30-minute increments (0.5 to 2 hrs) with live overlap protection."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-control bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-control bg-primary-light text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-primary">
                    {t("ขั้นตอนที่ 3", "Step 3")}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    {t("ยืนยันและรับใบจองทันที", "Confirm & Play")}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t(
                      "รับรหัสการจองและ QR Pass สำหรับแสดงหน้าสนามหรือเพิ่มลงปฏิทินได้ทันที",
                      "Receive your SAH booking code and QR pass ready for check-in."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Filter & Sort Drawer / Bottom Sheet */}
      <Drawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title={t("ตัวกรองและการเรียงลำดับ", "Filter & Sort Courts")}
        subtitle={t(
          "ปรับแต่งการแสดงผลรายการสนามกีฬาตามงบประมาณและลำดับที่ต้องการ",
          "Refine court listings by hourly budget and sort preference"
        )}
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <Button variant="ghost" onClick={clearAllFilters}>
              {t("ล้างค่าทั้งหมด", "Reset")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setFilterDrawerOpen(false)}
            >
              {t(
                `แสดงผลลัพธ์ (${filteredFacilities.length})`,
                `Show Courts (${filteredFacilities.length})`
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Sort Order */}
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-slate-900">
              {t("เรียงลำดับตาม", "Sort By")}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                ["name", "priceAsc", "priceDesc", "capacityDesc"] as SortOption[]
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSortBy(opt)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-control border text-left text-sm font-medium transition-colors flex items-center justify-between ${
                    sortBy === opt
                      ? "bg-primary-light border-primary text-primary"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{sortLabelMap[opt]}</span>
                  {sortBy === opt && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Price */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label
                htmlFor="price-range-slider"
                className="text-sm font-semibold text-slate-900"
              >
                {t("งบประมาณสูงสุดต่อชั่วโมง", "Max Hourly Rate")}
              </label>
              <span className="text-sm font-semibold text-primary tabular-price">
                ฿{maxPrice.toLocaleString()} / {t("ชม.", "hr")}
              </span>
            </div>

            <input
              id="price-range-slider"
              type="range"
              min={100}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#0071e3] h-2 cursor-pointer"
            />

            <div className="flex justify-between text-xs text-slate-400 tabular-price">
              <span>฿100</span>
              <span>฿500</span>
              <span>฿1,000</span>
              <span>฿2,000</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {[200, 400, 800, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaxPrice(preset)}
                  className={`min-h-[38px] rounded-control border text-xs font-medium tabular-price transition-colors ${
                    maxPrice === preset
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset === 2000 ? t("ทั้งหมด", "All") : `≤ ฿${preset}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Booking Rules Modal */}
      <Modal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        title={t("เงื่อนไขและข้อกำหนดการจองสนาม", "Court Booking Rules & Policy")}
        subtitle={t(
          "กติกาการจองเพื่อให้สมาชิกทุกคนเข้าใช้งานสนามได้อย่างทั่วถึง",
          "Standard reservation guidelines for all SportArenaHub members"
        )}
        footer={
          <Button variant="primary" onClick={() => setRulesModalOpen(false)}>
            {t("รับทราบ", "Got It")}
          </Button>
        }
      >
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3 p-3 rounded-control bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-slate-900 block">
                {t("จองล่วงหน้าตั้งแต่วันนี้เป็นต้นไป", "Advance Booking from Today Onwards")}
              </strong>
              <span className="text-xs text-slate-600">
                {t(
                  "สามารถเลือกจองคิวสนามตั้งแต่วันปัจจุบันเป็นต้นไป ไม่สามารถเลือกวันที่ผ่านมาแล้วได้",
                  "Reservations are open from the current date onwards."
                )}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-control bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-slate-900 block">
                {t("ระยะเวลา 0.5 – 2 ชั่วโมง ต่อรายการ", "0.5 to 2 Hours per Booking")}
              </strong>
              <span className="text-xs text-slate-600">
                {t(
                  "เลือกช่วงเวลาได้ทีละ 30 นาที สูงสุดไม่เกิน 2 ชั่วโมงต่อ 1 รายการจอง และต้องสิ้นสุดภายในวันเดียวกัน",
                  "Book in 30-minute increments from 30 minutes up to 2 hours per reservation."
                )}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-control bg-slate-50 border border-slate-200/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-slate-900 block">
                {t("ป้องกันเวลาซ้อนทับอัตโนมัติ", "Automatic Overlap Protection")}
              </strong>
              <span className="text-xs text-slate-600">
                {t(
                  "ระบบตรวจสอบทั้งคิวของสนามและคิวของสมาชิก เพื่อป้องกันการจองซ้อนในช่วงเวลาเดียวกัน",
                  "Prevents double-booking on the same court or overlapping slots for the same member."
                )}
              </span>
            </div>
          </li>
        </ul>
      </Modal>

      {/* Admin Add/Edit Facility Modal */}
      <FacilityModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        onSubmit={handleSaveFacility}
        initialData={editingFacility}
      />

      {/* Admin Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFacility)}
        onClose={() => setDeletingFacility(null)}
        onConfirm={handleConfirmDeleteFacility}
        loading={deleteSubmitting}
        title={t("ยืนยันการลบสนามกีฬา", "Delete Sports Court")}
        description={t(
          `คุณต้องการลบสนาม "${deletingFacility?.name || ""}" ออกจากรายการที่เปิดให้บริการใช่หรือไม่?`,
          `Are you sure you want to remove "${deletingFacility?.name || ""}" from active listings?`
        )}
        policyNotice={t(
          "เมื่อลบสนามแล้ว สมาชิกจะไม่สามารถค้นหาหรือสร้างการจองใหม่ในสนามนี้ได้อีก",
          "Once removed, members will no longer be able to book new slots on this court."
        )}
        confirmLabel={t("ยืนยันลบสนาม", "Delete Court")}
      />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
