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
  Clock,
  CheckCircle2,
  Plus,
  LayoutGrid,
  ShieldCheck,
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
  const [deletingFacility, setDeletingFacility] = useState<Facility | null>(
    null
  );
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
    <div className="space-y-8 pb-8">
      {/* Top Clubhouse Header & Search Section */}
      <section className="bg-[#EFECE6]/70 border-b border-[#E2DFD7] py-7 sm:py-9">
        <div className="max-w-container mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#143628] block mb-1">
                {t("ศูนย์กีฬาและคอร์ทมาตรฐาน", "Athletic Club & Court Reservations")}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#181A18] tracking-tight">
                {t(
                  "ค้นหาและสำรองเวลาสนามกีฬา",
                  "Find and Reserve Sports Courts"
                )}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#143628] hover:underline self-start sm:self-auto min-h-[36px]"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{t("ระเบียบการจองสนาม", "Club Booking Policy")}</span>
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

          {/* Segmented Sport Category Bar (Unified Deep Forest & Warm Stone) */}
          <div
            role="tablist"
            aria-label={t("เลือกประเภทกีฬา", "Filter by sport category")}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedSport === "ALL"}
              onClick={() => setSelectedSport("ALL")}
              className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
                selectedSport === "ALL"
                  ? "bg-[#143628] text-white border-[#143628] shadow-soft"
                  : "bg-white text-[#4A4F4B] border-[#D2CEC3] hover:border-[#143628] hover:text-[#181A18]"
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>{t("กีฬาทั้งหมด", "All Courts")}</span>
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
                  className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap ${
                    active
                      ? "bg-[#143628] text-white border-[#143628] shadow-soft"
                      : "bg-white text-[#4A4F4B] border-[#D2CEC3] hover:border-[#143628] hover:text-[#181A18]"
                  }`}
                >
                  <SportIcon sportType={key} className="w-4 h-4 shrink-0" />
                  <span>{lang === "TH" ? meta.labelTH : meta.labelEN}</span>
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
            <h2 className="text-lg sm:text-xl font-semibold text-[#181A18]">
              {t("สนามกีฬาที่เปิดให้บริการ", "Available Courts")}
            </h2>
            <p className="text-xs sm:text-sm text-[#767B76] mt-0.5 tabular-price">
              {loading
                ? t("กำลังค้นหาสนาม...", "Loading courts...")
                : t(
                    `แสดง ${filteredFacilities.length} สนามที่พร้อมให้จอง`,
                    `Showing ${filteredFacilities.length} available courts`
                  )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Compact Filter & Sort Drawer Trigger */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#D2CEC3] bg-white hover:bg-[#F3F1EC] text-xs sm:text-sm font-medium text-[#181A18] shadow-soft transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#143628]" />
              <span>{t("ตัวกรองและเรียงลำดับ", "Filter & Sort")}</span>
              {(maxPrice < 2000 || sortBy !== "name") && (
                <span className="w-2 h-2 rounded-full bg-[#143628]" />
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-[#D2CEC3] text-[#181A18] shadow-soft">
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
                  className="text-[#767B76] hover:text-[#181A18] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {searchQuery.trim() !== "" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-[#D2CEC3] text-[#181A18] shadow-soft">
                <span>
                  {t("คำค้น:", "Search:")} &ldquo;{searchQuery.trim()}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("ลบคำค้นหา", "Remove search keyword")}
                  className="text-[#767B76] hover:text-[#181A18] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {maxPrice < 2000 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-[#D2CEC3] text-[#181A18] shadow-soft tabular-price">
                <span>
                  {t("ไม่เกิน", "Up to")} ฿{maxPrice.toLocaleString()}/
                  {t("ชม.", "hr")}
                </span>
                <button
                  type="button"
                  onClick={() => setMaxPrice(2000)}
                  aria-label={t("ลบตัวกรองราคา", "Remove price filter")}
                  className="text-[#767B76] hover:text-[#181A18] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {sortBy !== "name" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-[#D2CEC3] text-[#181A18] shadow-soft">
                <ArrowUpDown className="w-3 h-3 text-[#143628]" />
                <span>{sortLabelMap[sortBy]}</span>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  aria-label={t("คืนค่าการเรียงลำดับ", "Reset sort")}
                  className="text-[#767B76] hover:text-[#181A18] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#143628] hover:underline px-2 py-1"
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

        {/* Clubhouse Information Strip (Concise, authentic venue information) */}
        <section
          aria-labelledby="club-info-heading"
          className="pt-8 mt-10 border-t border-[#E2DFD7]"
        >
          <div className="bg-white rounded-xl border border-[#E2DFD7] p-6 sm:p-7 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-[#EFECE6]">
              <div>
                <h2
                  id="club-info-heading"
                  className="text-base sm:text-lg font-semibold text-[#181A18]"
                >
                  {t(
                    "มาตรฐานการให้บริการและการสำรองคอร์ท",
                    "Club Reservation & Court Standards"
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#767B76] mt-0.5">
                  {t(
                    "ข้อมูลสำคัญสำหรับการเข้าใช้บริการสนามกีฬาในเครือ SportArenaHub",
                    "Essential guidelines for members playing at SportArenaHub venues"
                  )}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F3F1EC] border border-[#DCD8CE] text-xs font-medium text-[#143628] self-start md:self-auto tabular-price">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {t("เปิดบริการทุกวัน 06:00 – 22:00 น.", "Open Daily 06:00 – 22:00")}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#181A18]">
                  <Clock className="w-4 h-4 text-[#143628] shrink-0" />
                  <span>
                    {t(
                      "รอบเวลาจองยืดหยุ่น 30 นาที – 2 ชั่วโมง",
                      "30-Min to 2-Hour Sessions"
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#4A4F4B] leading-relaxed pl-6">
                  {t(
                    "เลือกเวลาเริ่มเล่นได้ทุกครึ่งชั่วโมง สูงสุดไม่เกิน 2 ชั่วโมงต่อรายการ เพื่อกระจายรอบสนามให้สมาชิกอย่างทั่วถึง",
                    "Reserve courts in 30-minute increments up to 2 hours per booking."
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#181A18]">
                  <ShieldCheck className="w-4 h-4 text-[#143628] shrink-0" />
                  <span>
                    {t(
                      "ล็อกคอร์ทแบบเรียลไทม์ ไม่ซ้อนทับ",
                      "Real-Time Court Locking"
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#4A4F4B] leading-relaxed pl-6">
                  {t(
                    "ตารางเวลาเชื่อมต่อกับหน้าสนามโดยตรง ป้องกันคิวชนทั้งในคอร์ทเดียวกันและระหว่างรายการจองของสมาชิก",
                    "Live schedule synchronization prevents double-booking across all courts."
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[#181A18]">
                  <CheckCircle2 className="w-4 h-4 text-[#143628] shrink-0" />
                  <span>
                    {t(
                      "เช็คอินหน้าสนามด้วยรหัส SAH",
                      "Fast Check-In with SAH Pass"
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#4A4F4B] leading-relaxed pl-6">
                  {t(
                    "แสดงรหัสการจองหรือ QR Pass ที่เคาน์เตอร์ต้อนรับก่อนเวลาเริ่ม 10 นาที พร้อมสิทธิ์เลื่อนเวลาล่วงหน้าได้ฟรี",
                    "Present your SAH reference pass at reception 10 minutes prior to play."
                  )}
                </p>
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
            <label className="block text-sm font-semibold text-[#181A18]">
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
                  className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-left text-sm font-medium transition-colors flex items-center justify-between ${
                    sortBy === opt
                      ? "bg-[#EBF2EE] border-[#143628] text-[#143628] font-semibold"
                      : "bg-white border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#F6F5F0]"
                  }`}
                >
                  <span>{sortLabelMap[opt]}</span>
                  {sortBy === opt && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Price */}
          <div className="space-y-3 pt-4 border-t border-[#E2DFD7]">
            <div className="flex items-center justify-between">
              <label
                htmlFor="price-range-slider"
                className="text-sm font-semibold text-[#181A18]"
              >
                {t("งบประมาณสูงสุดต่อชั่วโมง", "Max Hourly Rate")}
              </label>
              <span className="text-sm font-semibold text-[#143628] tabular-price">
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
              className="w-full accent-[#143628] h-2 cursor-pointer"
            />

            <div className="flex justify-between text-xs text-[#767B76] tabular-price">
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
                  className={`min-h-[38px] rounded-lg border text-xs font-medium tabular-price transition-colors ${
                    maxPrice === preset
                      ? "bg-[#143628] text-white border-[#143628]"
                      : "bg-[#F6F5F0] text-[#4A4F4B] border-[#D2CEC3] hover:bg-[#EFECE6]"
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
        title={t(
          "ระเบียบและเงื่อนไขการจองสนาม",
          "Court Booking Rules & Policy"
        )}
        subtitle={t(
          "ข้อกำหนดมาตรฐานเพื่อให้สมาชิกทุกท่านเข้าใช้งานสนามได้อย่างทั่วถึง",
          "Standard reservation guidelines for all SportArenaHub members"
        )}
        footer={
          <Button variant="primary" onClick={() => setRulesModalOpen(false)}>
            {t("รับทราบ", "Got It")}
          </Button>
        }
      >
        <ul className="space-y-3 text-sm text-[#4A4F4B]">
          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F6F5F0] border border-[#E2DFD7]">
            <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-[#181A18] block">
                {t(
                  "จองล่วงหน้าตั้งแต่วันนี้เป็นต้นไป",
                  "Advance Booking from Today Onwards"
                )}
              </strong>
              <span className="text-xs text-[#4A4F4B]">
                {t(
                  "สามารถเลือกจองคิวสนามตั้งแต่วันปัจจุบันเป็นต้นไป ไม่สามารถเลือกวันที่ผ่านมาแล้วได้",
                  "Reservations are open from the current date onwards."
                )}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F6F5F0] border border-[#E2DFD7]">
            <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-[#181A18] block">
                {t(
                  "ระยะเวลา 0.5 – 2 ชั่วโมง ต่อรายการ",
                  "0.5 to 2 Hours per Booking"
                )}
              </strong>
              <span className="text-xs text-[#4A4F4B]">
                {t(
                  "เลือกช่วงเวลาได้ทีละ 30 นาที สูงสุดไม่เกิน 2 ชั่วโมงต่อ 1 รายการจอง และต้องสิ้นสุดภายในวันเดียวกัน",
                  "Book in 30-minute increments from 30 minutes up to 2 hours per reservation."
                )}
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F6F5F0] border border-[#E2DFD7]">
            <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-[#181A18] block">
                {t(
                  "ป้องกันเวลาซ้อนทับอัตโนมัติ",
                  "Automatic Overlap Protection"
                )}
              </strong>
              <span className="text-xs text-[#4A4F4B]">
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
