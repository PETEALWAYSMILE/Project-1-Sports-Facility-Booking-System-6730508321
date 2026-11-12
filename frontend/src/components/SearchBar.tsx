"use client";

import React from "react";
import { Search, Calendar, MapPin, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ALL_SPORT_KEYS, SPORT_META_MAP, SportKey } from "@/lib/ui-helpers";
import { Button, Select, SportIcon } from "./ui/Primitives";

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

  const sportOptions = [
    {
      value: "ALL",
      label: t("กีฬาทั้งหมด", "All Sports"),
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    ...ALL_SPORT_KEYS.map((key: SportKey) => {
      const meta = SPORT_META_MAP[key];
      return {
        value: key,
        label: lang === "TH" ? meta.labelTH : meta.labelEN,
        icon: <SportIcon sportType={key} className="w-4 h-4" />,
      };
    }),
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-[#D2CEC3] shadow-card p-4 sm:p-5"
      role="search"
      aria-label={t("ค้นหาสนามกีฬา", "Search sports facilities")}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
        {/* 1. Custom Sport Selector Dropdown */}
        <div className="md:col-span-3">
          <Select
            id="search-sport"
            label={t("ประเภทกีฬา", "Sport")}
            value={selectedSport}
            onValueChange={onSportChange}
            options={sportOptions}
          />
        </div>

        {/* 2. Keyword / Location */}
        <div className="md:col-span-4 space-y-1.5">
          <label
            htmlFor="search-keyword"
            className="block text-xs sm:text-sm font-medium text-[#181A18]"
          >
            {t("ชื่อสนาม หรือ ทำเลที่ตั้ง", "Court Name or Location")}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#767B76] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-keyword"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={t(
                "ค้นหาชื่อสนาม, อาคาร หรือโซน...",
                "Search court name, building, or zone..."
              )}
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-lg border border-[#D2CEC3] hover:border-[#B8B3A6] bg-white text-sm text-[#181A18] placeholder:text-[#8C908C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#143628]/20 focus:border-[#143628]"
            />
          </div>
        </div>

        {/* 3. Date Picker */}
        <div className="md:col-span-3 space-y-1.5">
          <label
            htmlFor="search-date"
            className="block text-xs sm:text-sm font-medium text-[#181A18]"
          >
            {t("วันที่ต้องการเล่น", "Date")}
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-[#767B76] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-lg border border-[#D2CEC3] hover:border-[#B8B3A6] bg-white text-sm font-medium text-[#181A18] tabular-price transition-colors focus:outline-none focus:ring-2 focus:ring-[#143628]/20 focus:border-[#143628]"
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
