"use client";

import React from "react";
import { Search, Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ALL_SPORT_KEYS, SPORT_META_MAP, SportKey } from "@/lib/ui-helpers";
import { Button } from "./ui/Primitives";

interface SearchBarProps {
  selectedSport: string;
  onSportChange: (sport: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedDate: string;
  onDateChange: (d: string) => void;
  minDate?: string;
  onSearchSubmit?: () => void;
}

export default function SearchBar({
  selectedSport,
  onSportChange,
  searchQuery,
  onSearchQueryChange,
  selectedDate,
  onDateChange,
  minDate,
  onSearchSubmit,
}: SearchBarProps) {
  const { lang, t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/90 backdrop-blur-xl rounded-2xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-3.5 sm:p-5"
      role="search"
      aria-label={t("ค้นหาสนามกีฬา", "Search sports facilities")}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* 1. Sport Selector */}
        <div className="md:col-span-3 space-y-1">
          <label
            htmlFor="search-sport"
            className="block text-xs font-medium text-[#1d1d1f] px-1"
          >
            {t("ประเภทกีฬา", "Sport")}
          </label>
          <select
            id="search-sport"
            value={selectedSport}
            onChange={(e) => onSportChange(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1d1d1f] transition-all focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3]"
          >
            <option value="ALL">
              {t("กีฬาทั้งหมด", "All Sports")}
            </option>
            {ALL_SPORT_KEYS.map((key: SportKey) => {
              const meta = SPORT_META_MAP[key];
              return (
                <option key={key} value={key}>
                  {lang === "TH" ? meta.labelTH : meta.labelEN}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Keyword / Location */}
        <div className="md:col-span-4 space-y-1">
          <label
            htmlFor="search-keyword"
            className="block text-xs font-medium text-[#1d1d1f] px-1"
          >
            {t("ชื่อสนาม หรือ ทำเลที่ตั้ง", "Court Name or Location")}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-keyword"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={t(
                "ค้นหาชื่อสนาม, อาคาร หรือโซน...",
                "Search court name, building, or zone..."
              )}
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-sm text-[#1d1d1f] placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3]"
            />
          </div>
        </div>

        {/* 3. Date Picker */}
        <div className="md:col-span-3 space-y-1">
          <label
            htmlFor="search-date"
            className="block text-xs font-medium text-[#1d1d1f] px-1"
          >
            {t("วันที่ต้องการเล่น", "Date")}
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1d1d1f] tabular-price transition-all focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3]"
            />
          </div>
        </div>

        {/* 4. Search Button */}
        <div className="md:col-span-2">
          <Button type="submit" variant="primary" fullWidth>
            <Search className="w-4 h-4" />
            <span>{t("ค้นหาสนาม", "Search")}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
